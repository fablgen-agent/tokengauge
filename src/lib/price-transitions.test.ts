import { describe, expect, it } from "vitest";

import { modelPrices } from "@/lib/costs";
import { buildPriceTransitions, priceTransitions } from "@/lib/price-transitions";

describe("price transitions", () => {
  it("groups cards that end and begin at the same exact boundary", () => {
    const deepSeek = priceTransitions.find((transition) => transition.effectiveAt === "2026-08-16T16:00:00Z");

    expect(deepSeek?.providers).toEqual(["DeepSeek"]);
    expect(deepSeek?.ends.map((card) => card.id).sort()).toEqual([
      "deepseek:deepseek-v4-flash:standard",
      "deepseek:deepseek-v4-pro:standard",
    ]);
    expect(deepSeek?.starts.map((card) => card.id).sort()).toEqual([
      "deepseek:deepseek-v4-flash:off-peak",
      "deepseek:deepseek-v4-flash:peak",
      "deepseek:deepseek-v4-pro:off-peak",
      "deepseek:deepseek-v4-pro:peak",
    ]);
  });

  it("keeps expiries with no published successor visible", () => {
    const google = priceTransitions.find((transition) => transition.effectiveAt === "2026-12-31T23:59:59Z");

    expect(google?.providers).toEqual(["Google"]);
    expect(google?.starts).toHaveLength(0);
    expect(google?.ends).toHaveLength(2);
  });

  it("sorts valid unique boundaries and accounts for every dated edge", () => {
    const rebuilt = buildPriceTransitions(modelPrices);
    const edges = modelPrices.reduce((count, card) => count + Number(Boolean(card.effectiveFrom)) + Number(Boolean(card.effectiveUntil)), 0);

    expect(rebuilt.map((transition) => transition.effectiveAt)).toEqual([...new Set(rebuilt.map((transition) => transition.effectiveAt))]);
    expect(rebuilt.every((transition) => Number.isFinite(Date.parse(transition.effectiveAt)))).toBe(true);
    expect(rebuilt.reduce((count, transition) => count + transition.starts.length + transition.ends.length, 0)).toBe(edges);
  });
});
