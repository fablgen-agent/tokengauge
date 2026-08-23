import { describe, expect, it } from "vitest";

import { buildBillAuditReport, calculateBillAudit } from "@/lib/bill-audit";
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

  it("builds a bounded plain-text handoff without prompts or outputs", () => {
    const input = {
      inputTokens: 30_000_000,
      cachedInputTokens: 9_000_000,
      outputTokens: 5_000_000,
      attempts: 10_000,
      acceptedAnswers: 8_500,
      reportedBillUsd: 110,
    };
    const report = buildBillAuditReport({
      providerLabel: terra.providerLabel,
      modelLabel: terra.label,
      tierLabel: terra.tierLabel,
      region: terra.region,
      snapshotDate: "2026-08-22",
    }, input, calculateBillAudit(terra, input));

    expect(report).toContain("TokenGauge bill-audit handoff");
    expect(report).toContain("Invoice gap: $6.20 above the token model");
    expect(report).toContain("Largest modeled bucket: output");
    expect(report).toContain("Cost per accepted answer: $0.0122");
    expect(report).toContain("not an invoice audit or proof of overbilling");
    expect(report).not.toMatch(/prompt|model output/i);
  });
});
