import { describe, expect, it } from "vitest";

import { calculateMediaCost, mediaRateCards } from "./media-costs";

describe("media cost calculator", () => {
  it("models per-image output and input-image charges separately", () => {
    const rate = mediaRateCards.find((card) => card.id === "xai-grok-imagine-image-2-low-1k");
    expect(rate).toBeDefined();
    expect(calculateMediaCost(rate!, {
      requests: 100,
      outputUnitsPerRequest: 2,
      inputImagesPerRequest: 1,
      otherCostPerRequestUsd: 0.005,
      monthlyBudgetUsd: 20,
    })).toEqual({
      outputCostUsd: 8,
      inputImageCostUsd: 1,
      otherCostUsd: 0.5,
      totalCostUsd: 9.5,
      budgetDifferenceUsd: 10.5,
      maximumOutputUnitsPerRequest: 4,
    });
  });

  it("models per-second video output and enforces a whole-unit budget cap", () => {
    const rate = mediaRateCards.find((card) => card.id === "xai-grok-imagine-video-1-5-1080p");
    expect(rate).toBeDefined();
    const result = calculateMediaCost(rate!, {
      requests: 10,
      outputUnitsPerRequest: 8,
      inputImagesPerRequest: 1,
      otherCostPerRequestUsd: 0,
      monthlyBudgetUsd: 15,
    });
    expect(result.totalCostUsd).toBeCloseTo(20.1, 10);
    expect(result.budgetDifferenceUsd).toBeCloseTo(-5.1, 10);
    expect(result.maximumOutputUnitsPerRequest).toBe(5);
  });

  it("never produces a negative cap when fixed costs exceed the budget", () => {
    const result = calculateMediaCost(mediaRateCards[0], {
      requests: 100,
      outputUnitsPerRequest: 0,
      inputImagesPerRequest: 10,
      otherCostPerRequestUsd: 1,
      monthlyBudgetUsd: 5,
    });
    expect(result.maximumOutputUnitsPerRequest).toBe(0);
  });

  it("keeps every rate source-dated and uses the supported billing units", () => {
    expect(mediaRateCards.length).toBeGreaterThanOrEqual(10);
    for (const rate of mediaRateCards) {
      expect(rate.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["image", "second"]).toContain(rate.billingUnit);
      expect(rate.outputPriceUsd).toBeGreaterThan(0);
      expect(rate.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
