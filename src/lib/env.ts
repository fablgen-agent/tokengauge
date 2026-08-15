import "server-only";

import { createHmac } from "node:crypto";

import type { PaidPlanId } from "@/lib/plans";

export type StripeMode = "test" | "live";

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getAppUrl(request?: Request): string {
  const configured = read("APP_URL");
  if (configured) return configured.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "http://127.0.0.1:3000";
}

export function getLoginSecret(): string {
  const secret = read("LWC_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("A stable Login with ChatGPT secret of at least 32 characters is required.");
  }
  return secret;
}

export function getProductAuthSecret(): string {
  const configured = read("BETTER_AUTH_SECRET");
  if (configured) {
    if (configured.length < 32) throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
    return configured;
  }
  return createHmac("sha256", getLoginSecret())
    .update("tokengauge-product-auth-v1")
    .digest("base64url");
}

export function getStripeMode(): StripeMode {
  return read("STRIPE_MODE") === "live" ? "live" : "test";
}

export function getStripeConfig(): {
  mode: StripeMode;
  apiKey: string;
  priceId?: string;
  priceIds: Partial<Record<PaidPlanId, string>>;
  launchPriceIds: Partial<Record<PaidPlanId, string>>;
  upgradeCouponIds: { pro?: string; pro_plus?: string };
  webhookSecret?: string;
} {
  const mode = getStripeMode();
  const apiKey = read(mode === "live" ? "STRIPE_API_KEY" : "STRIPE_TEST_API_KEY");
  const priceId = read(mode === "live" ? "STRIPE_LIVE_PRICE_ID" : "STRIPE_TEST_PRICE_ID");
  const priceIds: Partial<Record<PaidPlanId, string>> = {
    pro: priceId,
    pro_plus: read(mode === "live" ? "STRIPE_LIVE_PRO_PLUS_PRICE_ID" : "STRIPE_TEST_PRO_PLUS_PRICE_ID"),
    ultimate: read(mode === "live" ? "STRIPE_LIVE_ULTIMATE_PRICE_ID" : "STRIPE_TEST_ULTIMATE_PRICE_ID"),
  };
  const launchPriceIds: Partial<Record<PaidPlanId, string>> = {
    pro: read(mode === "live" ? "STRIPE_LIVE_LAUNCH_PRO_PRICE_ID" : "STRIPE_TEST_LAUNCH_PRO_PRICE_ID"),
    pro_plus: read(mode === "live" ? "STRIPE_LIVE_LAUNCH_PRO_PLUS_PRICE_ID" : "STRIPE_TEST_LAUNCH_PRO_PLUS_PRICE_ID"),
    ultimate: read(mode === "live" ? "STRIPE_LIVE_LAUNCH_ULTIMATE_PRICE_ID" : "STRIPE_TEST_LAUNCH_ULTIMATE_PRICE_ID"),
  };
  const webhookSecret = read(
    mode === "live" ? "STRIPE_LIVE_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET",
  );

  if (!apiKey) throw new Error(`Stripe ${mode} API key is not configured.`);
  if (mode === "live" && !apiKey.startsWith("sk_live_")) {
    throw new Error("STRIPE_MODE=live requires a live API key.");
  }
  if (mode === "test" && !apiKey.startsWith("sk_test_")) {
    throw new Error("Stripe test mode requires a test API key.");
  }

  return {
    mode,
    apiKey,
    priceId,
    priceIds,
    launchPriceIds,
    upgradeCouponIds: {
      pro: read("STRIPE_PRO_CREDIT_COUPON_ID"),
      pro_plus: read("STRIPE_PRO_PLUS_CREDIT_COUPON_ID"),
    },
    webhookSecret,
  };
}

export function getPublicRuntimeStatus() {
  const mode = getStripeMode();
  const priceName = mode === "live" ? "STRIPE_LIVE_PRICE_ID" : "STRIPE_TEST_PRICE_ID";
  const prefix = mode === "live" ? "STRIPE_LIVE" : "STRIPE_TEST";
  return {
    stripeMode: mode,
    checkoutReady: Boolean(read(priceName)),
    checkoutPlans: {
      pro: Boolean(read(priceName)),
      pro_plus: Boolean(read(`${prefix}_PRO_PLUS_PRICE_ID`)),
      ultimate: Boolean(read(`${prefix}_ULTIMATE_PRICE_ID`)),
    },
    launchCheckoutReady: ["PRO", "PRO_PLUS", "ULTIMATE"].every((plan) => Boolean(read(`${prefix}_LAUNCH_${plan}_PRICE_ID`))),
  } as const;
}
