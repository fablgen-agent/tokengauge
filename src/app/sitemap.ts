import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppUrl();
  const lastModified = new Date("2026-08-15T00:00:00Z");
  return [
    { url: origin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/library`, lastModified, changeFrequency: "weekly", priority: .9 },
    { url: `${origin}/lab`, lastModified, changeFrequency: "monthly", priority: .8 },
    { url: `${origin}/privacy`, lastModified, changeFrequency: "yearly", priority: .3 },
    { url: `${origin}/terms`, lastModified, changeFrequency: "yearly", priority: .3 },
  ];
}
