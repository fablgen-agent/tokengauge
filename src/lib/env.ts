import "server-only";

import { createHmac } from "node:crypto";

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
  webhookSecret?: string;
} {
  const mode = getStripeMode();
  const apiKey = read(mode === "live" ? "STRIPE_API_KEY" : "STRIPE_TEST_API_KEY");
  const priceId = read(mode === "live" ? "STRIPE_LIVE_PRICE_ID" : "STRIPE_TEST_PRICE_ID");
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

  return { mode, apiKey, priceId, webhookSecret };
}

export function getPublicRuntimeStatus() {
  const mode = getStripeMode();
  const priceName = mode === "live" ? "STRIPE_LIVE_PRICE_ID" : "STRIPE_TEST_PRICE_ID";
  return {
    stripeMode: mode,
    checkoutReady: Boolean(read(priceName)),
  } as const;
}
