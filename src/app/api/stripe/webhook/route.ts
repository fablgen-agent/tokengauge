import type Stripe from "stripe";

import { markStripeEvent, revokeEntitlementByPaymentIntent } from "@/lib/db";
import { getStripeConfig } from "@/lib/env";
import { fulfilCheckoutSession, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function idOf(value: string | { id: string } | null): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export async function POST(request: Request): Promise<Response> {
  const config = getStripeConfig();
  if (!config.webhookSecret) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, config.webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const result = await fulfilCheckoutSession((event.data.object as Stripe.Checkout.Session).id);
      if (!result.fulfilled && result.reason !== "Payment is not complete.") {
        throw new Error(result.reason);
      }
    } else if (event.type === "charge.refunded") {
      const paymentIntentId = idOf((event.data.object as Stripe.Charge).payment_intent);
      if (paymentIntentId) revokeEntitlementByPaymentIntent(paymentIntentId);
    }

    markStripeEvent(event.id, event.type);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
