import { describe, expect, it } from "vitest";

import { priceSnapshotDate } from "@/lib/costs";
import { providerComparisons } from "@/lib/provider-comparisons";
import { providerPageProfiles } from "@/lib/provider-pages";

import sitemap from "./sitemap";

describe("sitemap pricing freshness", () => {
  it("uses the current pricing snapshot date for every pricing-backed route", () => {
    const entries = sitemap();
    const origin = entries[0].url.replace(/\/$/, "");
    const expectedDate = `${priceSnapshotDate}T00:00:00.000Z`;
    const pricingBackedUrls = [
      origin,
      `${origin}/pricing`,
      `${origin}/pricing/changes`,
      `${origin}/audit`,
      `${origin}/ledger`,
      `${origin}/guides/llm-cost-per-customer-feature`,
      ...providerPageProfiles.map((provider) => `${origin}/pricing/${provider.id}`),
      `${origin}/compare`,
      ...providerComparisons.map((comparison) => `${origin}/compare/${comparison.slug}`),
    ];

    for (const url of pricingBackedUrls) {
      const entry = entries.find((candidate) => candidate.url === url);
      expect(entry, url).toBeDefined();
      expect(new Date(entry!.lastModified!).toISOString(), url).toBe(expectedDate);
    }
  });
});
