import { describe, expect, it } from "vitest";

import { proTips, publicTips, tokenTips } from "./catalog";

describe("strategy catalogue", () => {
  it("ships the stated free and pro inventory", () => {
    expect(tokenTips).toHaveLength(120);
    expect(publicTips).toHaveLength(12);
    expect(proTips).toHaveLength(108);
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
      expect(tip.measure.length).toBeGreaterThan(20);
      expect(tip.caveat.length).toBeGreaterThan(20);
    }
  });

  it("exposes only implemented controlled recipes in the lab", () => {
    expect(tokenTips.filter((tip) => tip.experimentSupport === "supported").map((tip) => tip.id).sort()).toEqual([
      "low-verbosity",
      "lower-reasoning-effort",
    ]);
  });
});
