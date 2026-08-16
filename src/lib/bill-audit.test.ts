import { describe, expect, it } from "vitest";

import { calculateBillAudit } from "@/lib/bill-audit";
import { modelPrices } from "@/lib/costs";

const terra = modelPrices.find((price) => price.id === "openai:gpt-5.6-terra:standard:short")!;

describe("bill audit", () => {
  it("reconciles token buckets, quality, and a reported bill", () => {
    const result = calculateBillAudit(terra, {
      inputTokens: 30_000_000,
      cachedInputTokens: 9_000_000,
      outputTokens: 5_000_000,
      attempts: 10_000,
      acceptedAnswers: 8_500,
      reportedBillUsd: 110,
    });

    expect(result.uncachedInputCostUsd).toBeCloseTo(42);
    expect(result.cachedInputCostUsd).toBeCloseTo(1.8);
    expect(result.outputCostUsd).toBeCloseTo(60);
    expect(result.modeledTokenCostUsd).toBeCloseTo(103.8);
    expect(result.invoiceVarianceUsd).toBeCloseTo(6.2);
    expect(result.cacheSharePercentage).toBe(30);
    expect(result.acceptanceRatePercentage).toBe(85);
    expect(result.nonAcceptedAttemptCostUsd).toBeCloseTo(15.57);
    expect(result.dominantDriver).toBe("output");
  });

  it("clamps impossible aggregates and treats an unpublished cache rate as unknown, not free", () => {
    const withoutCacheRate = { ...terra, cachedInputPerMillionUsd: null };
    const result = calculateBillAudit(withoutCacheRate, {
      inputTokens: 1_000_000,
      cachedInputTokens: 2_000_000,
      outputTokens: -1,
      attempts: 4,
      acceptedAnswers: 9,
      reportedBillUsd: 0,
    });

    expect(result.cachedInputCostUsd).toBeCloseTo(2);
    expect(result.modeledTokenCostUsd).toBeCloseTo(2);
    expect(result.cacheRatePublished).toBe(false);
    expect(result.acceptanceRatePercentage).toBe(100);
    expect(result.invoiceVariancePercentage).toBeNull();
  });
});
