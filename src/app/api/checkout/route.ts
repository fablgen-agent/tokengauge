import { requireOwnerAccount } from "@/lib/access";
import { entitlementCredit, launchOfferStatus, recordFunnelEvent } from "@/lib/db";
import { getAppUrl, getStripeConfig } from "@/lib/env";
import { getOrCreateUpgradeCoupon, getStripe } from "@/lib/stripe";
import { isPaidPlanId, launchPricesGbp, planAtLeast, planDefinition } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safelyRecord(event: "checkout_created" | "checkout_failed"): void {
  try {
    recordFunnelEvent(event);
  } catch (error) {
    console.error("Unable to record aggregate funnel event", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const account = await requireOwnerAccount(request);
    const text = await request.text();
    const requestedPlan = text ? (JSON.parse(text) as { plan?: unknown }).plan : "pro";
    if (!isPaidPlanId(requestedPlan)) {
      return Response.json({ error: "Choose a valid TokenGauge plan." }, { status: 400 });
    }
    if (planAtLeast(account.accessPlan, requestedPlan)) {
      return Response.json({ url: `${getAppUrl(request)}/dashboard` });
    }

    const config = getStripeConfig();
    const launchOffer = launchOfferStatus(account.accountId);
    const usesLaunchOffer = launchOffer.eligible;
    const priceId = usesLaunchOffer ? config.launchPriceIds[requestedPlan] : config.priceIds[requestedPlan];
    if (!priceId) {
      return Response.json({ error: `${usesLaunchOffer ? "Launch-offer " : ""}${planDefinition(requestedPlan).name} checkout is not configured yet.` }, { status: 503 });
    }

    const appUrl = getAppUrl(request);
    const currentCredit = entitlementCredit(account.accountId);
    const targetPence = (usesLaunchOffer ? launchPricesGbp[requestedPlan] : planDefinition(requestedPlan).priceGbp) * 100;
    const creditPence = currentCredit.currency === "gbp" ? Math.min(currentCredit.amountPaid, targetPence) : 0;
    const upgradeCoupon = await getOrCreateUpgradeCoupon(creditPence);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: account.billingUserId,
      customer_email: account.email,
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: upgradeCoupon ? [{ coupon: upgradeCoupon }] : undefined,
      metadata: {
        entitlement: requestedPlan,
        previous_entitlement: account.accessPlan,
        product: "tokengauge",
        offer: usesLaunchOffer ? "launch_100" : "standard",
        launch_ordinal: usesLaunchOffer ? String(launchOffer.ordinal) : "none",
        upgrade_credit_pence: String(creditPence),
      },
      payment_intent_data: {
        metadata: {
          entitlement: requestedPlan,
          previous_entitlement: account.accessPlan,
          billing_user_id: account.billingUserId,
          offer: usesLaunchOffer ? "launch_100" : "standard",
          launch_ordinal: usesLaunchOffer ? String(launchOffer.ordinal) : "none",
          upgrade_credit_pence: String(creditPence),
        },
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/api/checkout/cancel?plan=${encodeURIComponent(requestedPlan)}`,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    safelyRecord("checkout_created");
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Choose a valid TokenGauge plan." }, { status: 400 });
    }
    safelyRecord("checkout_failed");
    console.error("Unable to create checkout session", error);
    return Response.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
