import pricingSnapshot from "@/data/pricing-snapshot.json";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"
  | "kimi"
  | "qwen"
  | "mistral"
  | "cohere";

export type ModelPrice = {
  id: string;
  modelId: string;
  provider: ProviderId;
  providerLabel: string;
  label: string;
  tierLabel: string;
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number | null;
  cacheWritePerMillionUsd?: number;
  cacheWriteOneHourPerMillionUsd?: number;
  explicitCacheReadPerMillionUsd?: number;
  explicitCacheStoragePerMillionTokenHourUsd?: number;
  outputPerMillionUsd: number;
  contextWindowTokens?: number;
  minInputTokensExclusive?: number;
  minInputTokensInclusive?: number;
  maxInputTokensExclusive?: number;
  maxInputTokensInclusive?: number;
  region: string;
  sourceUrl: string;
  sourceLabel: string;
  provenanceUrls?: readonly string[];
  reviewStatus?: "verified" | "manual-review";
  reviewNote?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
};

type PricingSnapshot = {
  observedAt: string;
  currency: "USD";
  unitTokens: 1_000_000;
  models: ModelPrice[];
};

const snapshot = pricingSnapshot as PricingSnapshot;

export const priceSnapshotDate = snapshot.observedAt.slice(0, 10);
export const priceSnapshotObservedAt = snapshot.observedAt;
export const modelPrices: readonly ModelPrice[] = snapshot.models;

export const priceProviders = Array.from(
  new Map(modelPrices.map((model) => [model.provider, model.providerLabel])).entries(),
).map(([id, label]) => ({ id: id as ProviderId, label }));

export function isPriceEffective(price: ModelPrice, at = new Date()): boolean {
  const timestamp = at.getTime();
  const starts = price.effectiveFrom ? Date.parse(price.effectiveFrom) : Number.NEGATIVE_INFINITY;
  const ends = price.effectiveUntil ? Date.parse(price.effectiveUntil) : Number.POSITIVE_INFINITY;
  return timestamp >= starts && timestamp < ends;
}

export function getSelectableModelPrices(at = new Date()): readonly ModelPrice[] {
  return modelPrices.filter((price) => isPriceEffective(price, at));
}

export function isInputWithinPriceTier(price: ModelPrice, inputTokens: number): boolean {
  const input = Math.max(inputTokens, 0);
  if (price.contextWindowTokens !== undefined && input > price.contextWindowTokens) return false;
  if (price.minInputTokensExclusive !== undefined && input <= price.minInputTokensExclusive) return false;
  if (price.minInputTokensInclusive !== undefined && input < price.minInputTokensInclusive) return false;
  if (price.maxInputTokensExclusive !== undefined && input >= price.maxInputTokensExclusive) return false;
  if (price.maxInputTokensInclusive !== undefined && input > price.maxInputTokensInclusive) return false;
  return true;
}

export function resolvePriceForInput(selected: ModelPrice, inputTokens: number, at = new Date()): ModelPrice | undefined {
  if (isPriceEffective(selected, at) && isInputWithinPriceTier(selected, inputTokens)) return selected;
  return getSelectableModelPrices(at).find((candidate) =>
    candidate.provider === selected.provider &&
    candidate.modelId === selected.modelId &&
    candidate.region === selected.region &&
    isInputWithinPriceTier(candidate, inputTokens),
  );
}

export type TokenUsage = {
  inputTokens: number;
  cachedInputTokens?: number;
  outputTokens: number;
};

export type CacheTtl = "5m" | "1h";

export type CacheEpisodeUsage = {
  totalInputTokens: number;
  reusablePrefixTokens: number;
  writes: number;
  readsPerWrite: number;
  ttl: CacheTtl;
};

export function calculateCacheEpisodeCosts(price: ModelPrice, usage: CacheEpisodeUsage): {
  baselineUsd: number;
  cachedUsd: number;
  breakEvenReads: number;
  totalRequests: number;
} {
  const totalInput = Math.max(usage.totalInputTokens, 0);
  if (!isInputWithinPriceTier(price, totalInput)) {
    throw new RangeError(`${price.id} does not cover ${totalInput} input tokens.`);
  }
  const prefix = Math.min(Math.max(usage.reusablePrefixTokens, 0), totalInput);
  const suffix = totalInput - prefix;
  const writes = Math.max(Math.trunc(usage.writes), 0);
  const reads = Math.max(Math.trunc(usage.readsPerWrite), 0);
  const readRate = price.cachedInputPerMillionUsd;
  const writeRate = usage.ttl === "1h"
    ? price.cacheWriteOneHourPerMillionUsd
    : price.cacheWritePerMillionUsd;
  if (readRate === null || writeRate === undefined) {
    throw new RangeError(`${price.id} does not publish the selected cache read/write rates.`);
  }

  const totalRequests = writes * (1 + reads);
  const baselineUsd = totalRequests * totalInput * price.inputPerMillionUsd / 1_000_000;
  const cachedEpisodeCost =
    prefix * writeRate +
    suffix * price.inputPerMillionUsd +
    reads * (prefix * readRate + suffix * price.inputPerMillionUsd);
  const cachedUsd = writes * cachedEpisodeCost / 1_000_000;
  const denominator = price.inputPerMillionUsd - readRate;
  const threshold = denominator > 0 ? (writeRate - price.inputPerMillionUsd) / denominator : Number.POSITIVE_INFINITY;
  const breakEvenReads = prefix > 0 && Number.isFinite(threshold)
    ? Math.max(0, Math.floor(threshold) + 1)
    : Number.POSITIVE_INFINITY;

  return { baselineUsd, cachedUsd, breakEvenReads, totalRequests };
}

export function calculateCostUsd(price: ModelPrice, usage: TokenUsage): number {
  if (!isInputWithinPriceTier(price, usage.inputTokens)) {
    throw new RangeError(`${price.id} does not cover ${usage.inputTokens} input tokens.`);
  }
  const cached = Math.min(
    Math.max(usage.cachedInputTokens ?? 0, 0),
    Math.max(usage.inputTokens, 0),
  );
  const uncached = Math.max(usage.inputTokens - cached, 0);
  const cachedRate = price.cachedInputPerMillionUsd ?? price.inputPerMillionUsd;

  return (
    (uncached * price.inputPerMillionUsd +
      cached * cachedRate +
      Math.max(usage.outputTokens, 0) * price.outputPerMillionUsd) /
    1_000_000
  );
}

export function calculateSavings(
  baselineUsd: number,
  optimizedUsd: number,
): { amountUsd: number; percentage: number } {
  const amountUsd = baselineUsd - optimizedUsd;
  return {
    amountUsd,
    percentage: baselineUsd > 0 ? (amountUsd / baselineUsd) * 100 : 0,
  };
}

export function calculateCostPerAcceptedAnswer(
  totalCostUsd: number,
  attempts: number,
  acceptanceRatePercentage: number,
): number | null {
  const boundedAttempts = Math.max(attempts, 0);
  const boundedAcceptanceRate = Math.min(Math.max(acceptanceRatePercentage, 0), 100);
  const acceptedAnswers = boundedAttempts * (boundedAcceptanceRate / 100);
  if (acceptedAnswers === 0) return null;
  return Math.max(totalCostUsd, 0) / acceptedAnswers;
}

export function calculateBreakEvenAcceptanceRate(
  baselineCostUsd: number,
  candidateCostUsd: number,
  baselineAcceptanceRatePercentage: number,
): number | null {
  if (baselineCostUsd <= 0) return null;
  const boundedBaselineRate = Math.min(Math.max(baselineAcceptanceRatePercentage, 0), 100);
  return (Math.max(candidateCostUsd, 0) / baselineCostUsd) * boundedBaselineRate;
}

export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 0.01) return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  if (value < 1) return `$${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${value.toFixed(2).replace(/\.00$/, "")}`;
}
