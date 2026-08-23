import {
  modelPrices,
  priceProviders,
  priceSnapshotObservedAt,
} from "@/lib/costs";

export const pricingSchemaVersion = "1" as const;
export const pricingSchemaUrl = "https://tokengauge.enby.fish/schemas/pricing-v1.schema.json";
export const pricingFeedCacheControl = "public, max-age=3600, stale-while-revalidate=86400";

export function pricingCompatibilityPayload() {
  return {
    observedAt: priceSnapshotObservedAt,
    currency: "USD" as const,
    unitTokens: 1_000_000 as const,
    providers: priceProviders,
    models: modelPrices,
  };
}

export function pricingFeedPayload() {
  return {
    schemaVersion: pricingSchemaVersion,
    ...pricingCompatibilityPayload(),
  };
}

export function pricingFeedHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": pricingFeedCacheControl,
    "Cross-Origin-Resource-Policy": "cross-origin",
    Link: `<${pricingSchemaUrl}>; rel="describedby"; type="application/schema+json"`,
    "X-Content-Type-Options": "nosniff",
  };
}

export type PricingFeed = ReturnType<typeof pricingFeedPayload>;
