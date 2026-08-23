import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";
import { priceSnapshotDate } from "@/lib/costs";
import { providerComparisons } from "@/lib/provider-comparisons";
import { providerPageProfiles } from "@/lib/provider-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppUrl();
  const contentLastModified = new Date("2026-08-15T00:00:00Z");
  const pricingLastModified = new Date(`${priceSnapshotDate}T00:00:00Z`);
  return [
    { url: origin, lastModified: pricingLastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/pricing`, lastModified: pricingLastModified, changeFrequency: "weekly", priority: .95 },
    { url: `${origin}/pricing/changes`, lastModified: pricingLastModified, changeFrequency: "weekly", priority: .92 },
    { url: `${origin}/audit`, lastModified: pricingLastModified, changeFrequency: "weekly", priority: .95 },
    { url: `${origin}/ledger`, lastModified: pricingLastModified, changeFrequency: "weekly", priority: .95 },
    { url: `${origin}/guides/llm-cost-per-customer-feature`, lastModified: pricingLastModified, changeFrequency: "monthly", priority: .9 },
    { url: `${origin}/guides/autonomous-agent-token-budget`, lastModified: new Date("2026-08-22T00:00:00Z"), changeFrequency: "monthly", priority: .9 },
    { url: `${origin}/services/attribution`, lastModified: new Date("2026-08-16T00:00:00Z"), changeFrequency: "monthly", priority: .82 },
    { url: `${origin}/services/budget-guard`, lastModified: new Date("2026-08-16T00:00:00Z"), changeFrequency: "monthly", priority: .82 },
    { url: "https://work.enby.fish/", lastModified: new Date("2026-08-23T00:00:00Z"), changeFrequency: "monthly", priority: .85 },
    ...providerPageProfiles.map((provider) => ({ url: `${origin}/pricing/${provider.id}`, lastModified: pricingLastModified, changeFrequency: "weekly" as const, priority: .9 })),
    { url: `${origin}/compare`, lastModified: pricingLastModified, changeFrequency: "weekly", priority: .9 },
    ...providerComparisons.map((comparison) => ({ url: `${origin}/compare/${comparison.slug}`, lastModified: pricingLastModified, changeFrequency: "weekly" as const, priority: .88 })),
    { url: `${origin}/library`, lastModified: contentLastModified, changeFrequency: "weekly", priority: .9 },
    { url: `${origin}/atlas`, lastModified: contentLastModified, changeFrequency: "monthly", priority: .82 },
    { url: `${origin}/lab`, lastModified: contentLastModified, changeFrequency: "monthly", priority: .8 },
    { url: `${origin}/privacy`, lastModified: contentLastModified, changeFrequency: "yearly", priority: .3 },
    { url: `${origin}/terms`, lastModified: contentLastModified, changeFrequency: "yearly", priority: .3 },
  ];
}
