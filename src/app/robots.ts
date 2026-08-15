import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppUrl();
  return {
    rules: { userAgent: "*", allow: ["/", "/library", "/lab", "/privacy", "/terms"], disallow: ["/account", "/settings", "/dashboard", "/api/"] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
