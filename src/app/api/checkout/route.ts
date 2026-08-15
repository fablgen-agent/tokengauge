import { requireProductAccount } from "@/lib/access";
import { getAppUrl, getStripeConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { isPaidPlanId, planAtLeast, planDefinition } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const account = await requireProductAccount(request);
    const text = await request.text();
    const requestedPlan = text ? (JSON.parse(text) as { plan?: unknown }).plan : "pro";
    if (!isPaidPlanId(requestedPlan)) {
      return Response.json({ error: "Choose a valid TokenGauge plan." }, { status: 400 });
    }
    if (planAtLeast(account.accessPlan, requestedPlan)) {
      return Response.json({ url: `${getAppUrl(request)}/dashboard` });
    }

    const config = getStripeConfig();
    const priceId = config.priceIds[requestedPlan];
    if (!priceId) {
      return Response.json({ error: `${planDefinition(requestedPlan).name} checkout is not configured yet.` }, { status: 503 });
    }

    const appUrl = getAppUrl(request);
    const upgradeCoupon = account.accessPlan === "pro"
      ? config.upgradeCouponIds.pro
      : account.accessPlan === "pro_plus"
        ? config.upgradeCouponIds.pro_plus
        : undefined;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: account.billingUserId,
      customer_email: account.email,
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: upgradeCoupon ? [{ coupon: upgradeCoupon }] : undefined,
      metadata: { entitlement: requestedPlan, previous_entitlement: account.accessPlan, product: "tokengauge" },
      payment_intent_data: {
        metadata: { entitlement: requestedPlan, previous_entitlement: account.accessPlan, billing_user_id: account.billingUserId },
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Choose a valid TokenGauge plan." }, { status: 400 });
    }
    console.error("Unable to create checkout session", error);
    return Response.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
