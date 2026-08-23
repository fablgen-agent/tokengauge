import { describe, expect, it } from "vitest";

import { GET as legacyGet } from "@/app/api/pricing/route";

import { GET, HEAD } from "./route";

describe("public Pricing Feed v1 route", () => {
  it("serves a cacheable cross-origin contract with its schema relation", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, stale-while-revalidate=86400");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(response.headers.get("link")).toContain("/schemas/pricing-v1.schema.json");
    expect(payload.schemaVersion).toBe("1");
  });

  it("retains exact compatibility content at the old API route", async () => {
    const current = await (await GET()).json();
    const legacy = await (await legacyGet()).json();
    const { schemaVersion, ...compatibility } = current;

    expect(schemaVersion).toBe("1");
    expect(compatibility).toEqual(legacy);
  });

  it("supports a body-free HEAD request without state", async () => {
    const getResponse = await GET();
    const response = await HEAD();

    expect(response.status).toBe(200);
    for (const header of ["content-type", "cache-control", "access-control-allow-origin", "cross-origin-resource-policy", "link"]) {
      expect(response.headers.get(header)).toBe(getResponse.headers.get(header));
    }
    expect(await response.text()).toBe("");
  });
});
