import { requireAuth } from "@/lib/access";
import { getAppUrl, getStripeConfig } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const account = await requireAuth(request);
    if (account.pro) {
      return Response.json({ url: `${getAppUrl(request)}/library` });
    }

    const config = getStripeConfig();
    if (!config.priceId) {
      return Response.json({ error: "Checkout is not configured yet." }, { status: 503 });
    }

    const appUrl = getAppUrl(request);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: account.billingUserId,
      customer_email: account.email,
      line_items: [{ price: config.priceId, quantity: 1 }],
      metadata: { entitlement: "pro", product: "tokengauge" },
      payment_intent_data: {
        metadata: { entitlement: "pro", billing_user_id: account.billingUserId },
      },
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Unable to create checkout session", error);
    return Response.json({ error: "Checkout could not be started." }, { status: 500 });
  }
}
