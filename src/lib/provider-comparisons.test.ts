import { describe, expect, it } from "vitest";

import { providerComparisons } from "@/lib/provider-comparisons";

describe("provider comparisons", () => {
  it("has unique slugs and never compares a provider with itself", () => {
    expect(new Set(providerComparisons.map((comparison) => comparison.slug)).size).toBe(providerComparisons.length);
    expect(providerComparisons.every((comparison) => comparison.left !== comparison.right)).toBe(true);
  });

  it("covers every published provider", () => {
    const covered = new Set(providerComparisons.flatMap((comparison) => [comparison.left, comparison.right]));
    expect(covered).toEqual(new Set(["openai", "anthropic", "google", "xai", "deepseek", "kimi", "qwen", "mistral", "cohere"]));
  });
});
