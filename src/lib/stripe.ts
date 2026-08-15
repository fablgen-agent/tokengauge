import "server-only";

import Stripe from "stripe";

import {
  findAccountByBillingId,
  grantEntitlement,
  setStripeCustomer,
} from "@/lib/db";
import { getStripeConfig } from "@/lib/env";

let singleton: Stripe | undefined;
let singletonKey: string | undefined;

export function getStripe(): Stripe {
  const { apiKey } = getStripeConfig();
  if (!singleton || singletonKey !== apiKey) {
    singleton = new Stripe(apiKey, { appInfo: { name: "TokenGauge", version: "0.1.0" } });
    singletonKey = apiKey;
  }
  return singleton;
}

function idOf(value: string | { id: string } | null): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export async function fulfilCheckoutSession(
  sessionId: string,
  expectedBillingUserId?: string,
): Promise<{
  fulfilled: boolean;
  reason?: string;
}> {
  const config = getStripeConfig();
  if (!config.priceId) return { fulfilled: false, reason: "Checkout price is not configured." };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer", "payment_intent"],
  });

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { fulfilled: false, reason: "Payment is not complete." };
  }
  if (session.metadata?.entitlement !== "pro") {
    return { fulfilled: false, reason: "Unexpected entitlement." };
  }
  const billingUserId = session.client_reference_id;
  if (!billingUserId) return { fulfilled: false, reason: "Missing account reference." };
  if (expectedBillingUserId && billingUserId !== expectedBillingUserId) {
    return { fulfilled: false, reason: "Checkout belongs to a different account." };
  }

  const lines = session.line_items?.data ?? [];
  const hasExpectedPrice = lines.some((line) => line.price?.id === config.priceId && line.quantity === 1);
  if (!hasExpectedPrice) return { fulfilled: false, reason: "Unexpected checkout item." };

  const accountId = findAccountByBillingId(billingUserId);
  if (!accountId) return { fulfilled: false, reason: "Account reference is unknown." };

  grantEntitlement({
    accountId,
    checkoutSessionId: session.id,
    paymentIntentId: idOf(session.payment_intent),
  });
  const customerId = idOf(session.customer);
  if (customerId) setStripeCustomer(accountId, customerId);
  return { fulfilled: true };
}
