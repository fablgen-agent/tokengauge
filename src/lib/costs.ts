export const priceSnapshotDate = "2026-08-15";

export type ModelPrice = {
  id: string;
  label: string;
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

export const modelPrices: readonly ModelPrice[] = [
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    inputPerMillionUsd: 5,
    cachedInputPerMillionUsd: 0.5,
    outputPerMillionUsd: 30,
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    inputPerMillionUsd: 2.5,
    cachedInputPerMillionUsd: 0.25,
    outputPerMillionUsd: 15,
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    inputPerMillionUsd: 1,
    cachedInputPerMillionUsd: 0.1,
    outputPerMillionUsd: 6,
  },
] as const;

export type TokenUsage = {
  inputTokens: number;
  cachedInputTokens?: number;
  outputTokens: number;
};

export function calculateCostUsd(price: ModelPrice, usage: TokenUsage): number {
  const cached = Math.min(
    Math.max(usage.cachedInputTokens ?? 0, 0),
    Math.max(usage.inputTokens, 0),
  );
  const uncached = Math.max(usage.inputTokens - cached, 0);

  return (
    (uncached * price.inputPerMillionUsd +
      cached * price.cachedInputPerMillionUsd +
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
