import { describe, expect, it } from "vitest";

import { calculateCostUsd, calculateSavings, modelPrices } from "./costs";

describe("cost calculations", () => {
  const terra = modelPrices.find((model) => model.id === "gpt-5.6-terra")!;

  it("prices cached and uncached input separately", () => {
    expect(calculateCostUsd(terra, { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 100_000 })).toBeCloseTo(3.1, 8);
  });

  it("caps cached tokens at total input tokens", () => {
    expect(calculateCostUsd(terra, { inputTokens: 100, cachedInputTokens: 1_000, outputTokens: 0 })).toBeCloseTo(0.000025, 10);
  });

  it("reports positive and negative savings without hiding either", () => {
    expect(calculateSavings(100, 75)).toEqual({ amountUsd: 25, percentage: 25 });
    expect(calculateSavings(100, 125)).toEqual({ amountUsd: -25, percentage: -25 });
  });
});
