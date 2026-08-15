import { describe, expect, it } from "vitest";

import { calculateCostUsd, calculateSavings, getSelectableModelPrices, modelPrices, priceProviders, resolvePriceForInput } from "./costs";

describe("cost calculations", () => {
  const terra = modelPrices.find((model) => model.id === "openai:gpt-5.6-terra:standard:short")!;
  const terraLong = modelPrices.find((model) => model.id === "openai:gpt-5.6-terra:standard:long")!;

  it("prices cached and uncached input separately", () => {
    expect(calculateCostUsd(terraLong, { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 100_000 })).toBeCloseTo(4.36, 8);
  });

  it("caps cached tokens at total input tokens", () => {
    expect(calculateCostUsd(terra, { inputTokens: 100, cachedInputTokens: 1_000, outputTokens: 0 })).toBeCloseTo(0.00002, 10);
  });

  it("reports positive and negative savings without hiding either", () => {
    expect(calculateSavings(100, 75)).toEqual({ amountUsd: 25, percentage: 25 });
    expect(calculateSavings(100, 125)).toEqual({ amountUsd: -25, percentage: -25 });
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
  });

  it("selects OpenAI's long-context band at exactly the published boundary", () => {
    expect(resolvePriceForInput(terra, 272_000)?.id).toBe(terra.id);
    expect(resolvePriceForInput(terra, 272_001)?.id).toBe(terraLong.id);
    expect(() => calculateCostUsd(terra, { inputTokens: 272_001, outputTokens: 0 })).toThrow(RangeError);
  });
});
