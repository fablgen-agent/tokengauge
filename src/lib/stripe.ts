import "server-only";

import Stripe from "stripe";

import {
  findAccountByBillingId,
  grantEntitlement,
  setStripeCustomer,
} from "@/lib/db";
import { getStripeConfig } from "@/lib/env";
import { isPaidPlanId } from "@/lib/plans";

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

export async function getOrCreateUpgradeCoupon(amountPence: number): Promise<string | undefined> {
  const amount = Math.max(0, Math.trunc(amountPence));
  if (!amount) return undefined;
  const stripe = getStripe();
  const id = `tokengauge_credit_gbp_${amount}_v1`;
  try {
    const existing = await stripe.coupons.retrieve(id);
    if (!("deleted" in existing) && existing.valid && existing.amount_off === amount && existing.currency === "gbp") return id;
    throw new Error("Stored upgrade coupon does not match the required GBP credit.");
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || error.code !== "resource_missing") throw error;
    try {
      await stripe.coupons.create({
        id,
        amount_off: amount,
        currency: "gbp",
        duration: "once",
        name: `TokenGauge £${(amount / 100).toFixed(2)} upgrade credit`,
        metadata: { product: "tokengauge", purpose: "upgrade_credit", amount_pence: String(amount) },
      });
    } catch (createError) {
      if (!(createError instanceof Stripe.errors.StripeInvalidRequestError) || createError.code !== "resource_already_exists") throw createError;
    }
    return id;
  }
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
  plan?: string;
  reason?: string;
}> {
  const config = getStripeConfig();
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer", "payment_intent"],
  });

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { fulfilled: false, reason: "Payment is not complete." };
  }
  const entitlement = session.metadata?.entitlement;
  if (!isPaidPlanId(entitlement)) {
    return { fulfilled: false, reason: "Unexpected entitlement." };
  }
  const expectedPriceId = session.metadata?.offer === "launch_100"
    ? config.launchPriceIds[entitlement]
    : config.priceIds[entitlement];
  if (!expectedPriceId) return { fulfilled: false, reason: "Checkout price is not configured." };
  const billingUserId = session.client_reference_id;
  if (!billingUserId) return { fulfilled: false, reason: "Missing account reference." };
  if (expectedBillingUserId && billingUserId !== expectedBillingUserId) {
    return { fulfilled: false, reason: "Checkout belongs to a different account." };
  }

  const lines = session.line_items?.data ?? [];
  const hasExpectedPrice = lines.some((line) => line.price?.id === expectedPriceId && line.quantity === 1);
  if (!hasExpectedPrice) return { fulfilled: false, reason: "Unexpected checkout item." };

  const accountId = findAccountByBillingId(billingUserId);
  if (!accountId) return { fulfilled: false, reason: "Account reference is unknown." };

  grantEntitlement({
    accountId,
    checkoutSessionId: session.id,
    paymentIntentId: idOf(session.payment_intent),
    key: entitlement,
    amountPaid: session.amount_total ?? 0,
    currency: session.currency ?? undefined,
  });
  const customerId = idOf(session.customer);
  if (customerId) setStripeCustomer(accountId, customerId);
  return { fulfilled: true, plan: entitlement };
}
