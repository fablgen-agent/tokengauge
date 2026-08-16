import { describe, expect, it } from "vitest";

import {
  calculateBreakEvenAcceptanceRate,
  calculateCacheEpisodeCosts,
  calculateCostPerAcceptedAnswer,
  calculateCostUsd,
  calculateSavings,
  formatRate,
  getSelectableModelPrices,
  modelPrices,
  priceProviders,
  resolvePriceForInput,
} from "./costs";

describe("cost calculations", () => {
  const terra = modelPrices.find((model) => model.id === "openai:gpt-5.6-terra:standard:short")!;
  const terraLong = modelPrices.find((model) => model.id === "openai:gpt-5.6-terra:standard:long")!;

  it("prices cached and uncached input separately", () => {
    expect(calculateCostUsd(terraLong, { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 100_000 })).toBeCloseTo(4.36, 8);
  });

  it("preserves provider precision for sub-cent rates", () => {
    expect(formatRate(0.003625)).toBe("$0.003625");
    expect(formatRate(0.0028)).toBe("$0.0028");
    expect(formatRate(0.007)).toBe("$0.007");
  });

  it("models cache writes, reads, uncached suffixes, and TTL break-even points", () => {
    const haiku = modelPrices.find((model) => model.id === "anthropic:claude-haiku-4.5:standard")!;
    const fiveMinute = calculateCacheEpisodeCosts(haiku, {
      totalInputTokens: 20_000,
      reusablePrefixTokens: 15_000,
      writes: 100,
      readsPerWrite: 1,
      ttl: "5m",
    });
    expect(fiveMinute).toEqual({ baselineUsd: 4, cachedUsd: 3.025, breakEvenReads: 1, totalRequests: 200 });

    const oneHour = calculateCacheEpisodeCosts(haiku, {
      totalInputTokens: 20_000,
      reusablePrefixTokens: 15_000,
      writes: 100,
      readsPerWrite: 2,
      ttl: "1h",
    });
    expect(oneHour.baselineUsd).toBe(6);
    expect(oneHour.cachedUsd).toBeCloseTo(4.8, 8);
    expect(oneHour.breakEvenReads).toBe(2);
    expect(oneHour.totalRequests).toBe(300);
  });

  it("rejects cache TTLs without a published write rate", () => {
    expect(() => calculateCacheEpisodeCosts(terra, {
      totalInputTokens: 10_000,
      reusablePrefixTokens: 8_000,
      writes: 1,
      readsPerWrite: 2,
      ttl: "1h",
    })).toThrow(/does not publish/);
  });

  it("caps cached tokens at total input tokens", () => {
    expect(calculateCostUsd(terra, { inputTokens: 100, cachedInputTokens: 1_000, outputTokens: 0 })).toBeCloseTo(0.00002, 10);
  });

  it("reports positive and negative savings without hiding either", () => {
    expect(calculateSavings(100, 75)).toEqual({ amountUsd: 25, percentage: 25 });
    expect(calculateSavings(100, 125)).toEqual({ amountUsd: -25, percentage: -25 });
  });

  it("prices accepted answers and exposes the candidate break-even quality floor", () => {
    expect(calculateCostPerAcceptedAnswer(300, 10_000, 90)).toBeCloseTo(0.0333333333, 10);
    expect(calculateCostPerAcceptedAnswer(202.125, 10_000, 85)).toBeCloseTo(0.0237794118, 10);
    expect(calculateBreakEvenAcceptanceRate(300, 202.125, 90)).toBeCloseTo(60.6375, 8);
  });

  it("does not invent accepted-answer economics without attempts or passing answers", () => {
    expect(calculateCostPerAcceptedAnswer(10, 0, 90)).toBeNull();
    expect(calculateCostPerAcceptedAnswer(10, 100, 0)).toBeNull();
    expect(calculateBreakEvenAcceptanceRate(0, 5, 90)).toBeNull();
    expect(calculateCostPerAcceptedAnswer(10, 100, 120)).toBe(0.1);
  });

  it("covers the nine first-class providers with official sources", () => {
    expect(modelPrices).toHaveLength(52);
    expect(priceProviders.map((provider) => provider.id)).toEqual([
      "openai", "anthropic", "google", "xai", "deepseek", "kimi", "qwen", "mistral", "cohere",
    ]);
    for (const model of modelPrices) expect(model.sourceUrl).toMatch(/^https:\/\//);
  });

  it("switches DeepSeek to its published future schedule", () => {
    const before = getSelectableModelPrices(new Date("2026-08-16T15:59:59Z"));
    const after = getSelectableModelPrices(new Date("2026-08-16T16:00:00Z"));
    expect(before.some((model) => model.id === "deepseek:deepseek-v4-flash:standard")).toBe(true);
    expect(after.some((model) => model.id === "deepseek:deepseek-v4-flash:standard")).toBe(false);
    expect(after.some((model) => model.id === "deepseek:deepseek-v4-flash:off-peak")).toBe(true);
    expect(after.some((model) => model.id === "deepseek:deepseek-v4-flash:peak")).toBe(true);
  });

  it("keeps OpenAI's exact boundary short and selects long context above it", () => {
    expect(resolvePriceForInput(terra, 272_000)?.id).toBe(terra.id);
    expect(resolvePriceForInput(terra, 272_001)?.id).toBe(terraLong.id);
    expect(() => calculateCostUsd(terra, { inputTokens: 272_001, outputTokens: 0 })).toThrow(RangeError);
  });

  it("enforces each provider's inclusive and exclusive price boundaries", () => {
    const geminiShort = modelPrices.find((model) => model.id === "google:gemini-3.1-pro-preview:standard:short")!;
    const geminiLong = modelPrices.find((model) => model.id === "google:gemini-3.1-pro-preview:standard:long")!;
    expect(resolvePriceForInput(geminiShort, 200_000)?.id).toBe(geminiShort.id);
    expect(resolvePriceForInput(geminiShort, 200_001)?.id).toBe(geminiLong.id);

    const xaiShort = modelPrices.find((model) => model.id === "xai:grok-4.6:standard:short")!;
    const xaiLong = modelPrices.find((model) => model.id === "xai:grok-4.6:standard:long")!;
    expect(resolvePriceForInput(xaiShort, 199_999)?.id).toBe(xaiShort.id);
    expect(resolvePriceForInput(xaiShort, 200_000)?.id).toBe(xaiLong.id);

    const qwenShort = modelPrices.find((model) => model.id === "qwen:qwen3.7-flash:beijing:short")!;
    const qwenMedium = modelPrices.find((model) => model.id === "qwen:qwen3.7-flash:beijing:medium")!;
    const qwenLong = modelPrices.find((model) => model.id === "qwen:qwen3.7-flash:beijing:long")!;
    expect(resolvePriceForInput(qwenShort, 32_000)?.id).toBe(qwenShort.id);
    expect(resolvePriceForInput(qwenShort, 32_001)?.id).toBe(qwenMedium.id);
    expect(resolvePriceForInput(qwenShort, 256_000)?.id).toBe(qwenMedium.id);
    expect(resolvePriceForInput(qwenShort, 256_001)?.id).toBe(qwenLong.id);
  });

  it("retains dual provenance and manual review for Cohere's conflicting Command A page", () => {
    const commandA = modelPrices.find((model) => model.id === "cohere:command-a-03-2025:standard")!;
    expect(commandA.reviewStatus).toBe("manual-review");
    expect(commandA.provenanceUrls).toEqual(expect.arrayContaining([
      "https://docs.cohere.com/docs/command-a",
      "https://docs.cohere.com/v1/docs/models",
    ]));
    expect(commandA.reviewNote).toContain("conflicting Command A+ model ID");
  });
});
