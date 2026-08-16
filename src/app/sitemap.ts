import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";
import { providerComparisons } from "@/lib/provider-comparisons";
import { providerPageProfiles } from "@/lib/provider-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppUrl();
  const lastModified = new Date("2026-08-15T00:00:00Z");
  return [
    { url: origin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/pricing`, lastModified, changeFrequency: "weekly", priority: .95 },
    { url: `${origin}/audit`, lastModified: new Date("2026-08-16T00:00:00Z"), changeFrequency: "weekly", priority: .95 },
    ...providerPageProfiles.map((provider) => ({ url: `${origin}/pricing/${provider.id}`, lastModified, changeFrequency: "weekly" as const, priority: .9 })),
    { url: `${origin}/compare`, lastModified, changeFrequency: "weekly", priority: .9 },
    ...providerComparisons.map((comparison) => ({ url: `${origin}/compare/${comparison.slug}`, lastModified, changeFrequency: "weekly" as const, priority: .88 })),
    { url: `${origin}/library`, lastModified, changeFrequency: "weekly", priority: .9 },
    { url: `${origin}/atlas`, lastModified, changeFrequency: "monthly", priority: .82 },
    { url: `${origin}/lab`, lastModified, changeFrequency: "monthly", priority: .8 },
    { url: `${origin}/privacy`, lastModified, changeFrequency: "yearly", priority: .3 },
    { url: `${origin}/terms`, lastModified, changeFrequency: "yearly", priority: .3 },
  ];
}
