import { describe, expect, it } from "vitest";

import { proTips, publicTips, tokenTips } from "./catalog";

describe("strategy catalogue", () => {
  it("ships the stated free and pro inventory", () => {
    expect(tokenTips).toHaveLength(33);
    expect(publicTips).toHaveLength(6);
    expect(proTips).toHaveLength(27);
  });

  it("uses unique identifiers and HTTPS primary sources", () => {
    expect(new Set(tokenTips.map((tip) => tip.id)).size).toBe(tokenTips.length);
    for (const tip of tokenTips) {
      expect(tip.source.url).toMatch(/^https:\/\//);
      expect(["official", "derived", "experiment"]).toContain(tip.grade);
      expect(tip.measure.length).toBeGreaterThan(20);
      expect(tip.caveat.length).toBeGreaterThan(20);
    }
  });
});
