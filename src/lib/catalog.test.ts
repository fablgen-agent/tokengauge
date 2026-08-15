import { describe, expect, it } from "vitest";

import { catalogueAliases, proTips, publicTips, tokenTips } from "./catalog";

const requiredDuplicateAliases = {
  "cache-key-partition": ["research-pc-08"],
  "research-pc-15": ["research-ca-06"],
  "research-ctx-10": ["research-pd-09"],
  "research-ctx-11": ["research-pd-06"],
  "research-ctx-12": ["research-pd-07"],
  "structured-output-retries": ["research-so-01"],
  "limit-initial-tools": ["research-tl-01"],
  "combine-sequential-tools": ["research-tl-09"],
} as const;

describe("strategy catalogue", () => {
  it("ships the stated free and pro inventory", () => {
    expect(tokenTips.length).toBeGreaterThanOrEqual(112);
    expect(publicTips.length).toBeGreaterThanOrEqual(12);
    expect(proTips.length).toBeGreaterThanOrEqual(100);
  });

  it("uses canonical identifiers, aliases, and complete source metadata", () => {
    const ids = new Set(tokenTips.map((tip) => tip.id));
    expect(ids.size).toBe(tokenTips.length);
    for (const tip of tokenTips) {
      expect(tip.canonicalId).toBe(tip.id);
      expect(tip.intervention.length).toBeGreaterThan(20);
      expect(tip.providers.length).toBeGreaterThan(2);
      expect(tip.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tip.sources.length).toBeGreaterThan(0);
      expect(tip.source.url).toMatch(/^https:\/\//);
      for (const source of tip.sources) expect(source.url).toMatch(/^https:\/\//);
      for (const alias of tip.aliases) expect(ids.has(alias)).toBe(false);
      expect(["official", "derived", "experiment"]).toContain(tip.grade);
      expect(["request_config", "prompt_diff", "model_route", "cache_sequence", "schema_diff", "context_diff", "processing_diff", "guided_only"]).toContain(tip.experimentType);
      expect(["supported", "guided-only", "not-supported"]).toContain(tip.experimentSupport);
      expect(tip.measure.length).toBeGreaterThan(20);
      expect(tip.caveat.length).toBeGreaterThan(20);
    }

    const allAliases = tokenTips.flatMap((tip) => tip.aliases);
    expect(new Set(allAliases).size).toBe(allAliases.length);
    for (const canonicalId of Object.keys(catalogueAliases)) expect(ids.has(canonicalId)).toBe(true);
  });

  it("keeps the audited duplicate fixtures as aliases, not sellable cards", () => {
    for (const [canonicalId, aliases] of Object.entries(requiredDuplicateAliases)) {
      expect(catalogueAliases[canonicalId]).toEqual(expect.arrayContaining([...aliases]));
      expect(tokenTips.some((tip) => tip.id === canonicalId)).toBe(true);
      for (const alias of aliases) expect(tokenTips.some((tip) => tip.id === alias)).toBe(false);
    }
  });

  it("uses distinct researched replacements instead of provider-profile or QA count inflation", () => {
    const ids = new Set(tokenTips.map((tip) => tip.id));
    for (const id of [
      "research-mre-002",
      "research-mre-003",
      "research-mre-006",
      "research-mre-020",
      "research-mre-026",
      "research-mre-041",
      "research-mre-045",
      "research-mre-046",
      "research-mre-051",
      "research-mre-052",
    ]) expect(ids.has(id)).toBe(true);
    expect(ids.has("research-ps-ki-04")).toBe(false);
    expect(ids.has("research-ps-co-04")).toBe(false);
  });

  it("preserves report-six evidence grades and experiment types", () => {
    const byId = new Map(tokenTips.map((tip) => [tip.id, tip]));
    expect(byId.get("research-mre-002")?.grade).toBe("experiment");
    expect(byId.get("research-mre-006")?.grade).toBe("official");
    expect(byId.get("research-mre-020")?.grade).toBe("official");
    expect(byId.get("research-mre-052")?.grade).toBe("derived");
    expect(byId.get("research-mre-003")?.experimentType).toBe("model_route");
    expect(byId.get("research-mre-045")?.experimentType).toBe("processing_diff");
  });

  it("exposes only implemented controlled recipes in the lab", () => {
    expect(tokenTips.filter((tip) => tip.experimentSupport === "supported").map((tip) => tip.id).sort()).toEqual([
      "low-verbosity",
      "lower-reasoning-effort",
    ]);
    expect(tokenTips.find((tip) => tip.id === "cap-output")).toMatchObject({ experimentType: "request_config", experimentSupport: "not-supported" });
    expect(tokenTips.find((tip) => tip.id === "stop-at-known-delimiter")).toMatchObject({ experimentType: "request_config", experimentSupport: "not-supported" });
    expect(proTips.every((tip) => tip.experimentSupport !== "supported")).toBe(true);
  });
});
