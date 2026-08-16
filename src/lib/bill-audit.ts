import type { ModelPrice } from "@/lib/costs";

export type BillAuditInput = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  attempts: number;
  acceptedAnswers: number;
  reportedBillUsd: number;
};

export type BillAuditResult = {
  modeledTokenCostUsd: number;
  uncachedInputCostUsd: number;
  cachedInputCostUsd: number;
  outputCostUsd: number;
  invoiceVarianceUsd: number;
  invoiceVariancePercentage: number | null;
  cacheSharePercentage: number;
  acceptanceRatePercentage: number;
  costPerAttemptUsd: number | null;
  costPerAcceptedAnswerUsd: number | null;
  nonAcceptedAttemptCostUsd: number;
  dominantDriver: "uncached input" | "cached input" | "output";
  cacheRatePublished: boolean;
};

function finite(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

export function calculateBillAudit(price: ModelPrice, input: BillAuditInput): BillAuditResult {
  const inputTokens = finite(input.inputTokens);
  const cachedInputTokens = Math.min(finite(input.cachedInputTokens), inputTokens);
  const outputTokens = finite(input.outputTokens);
  const attempts = Math.trunc(finite(input.attempts));
  const acceptedAnswers = Math.min(Math.trunc(finite(input.acceptedAnswers)), attempts);
  const reportedBillUsd = finite(input.reportedBillUsd);
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const cacheRatePublished = price.cachedInputPerMillionUsd !== null;
  const cacheRate = price.cachedInputPerMillionUsd ?? price.inputPerMillionUsd;

  const uncachedInputCostUsd = uncachedInputTokens * price.inputPerMillionUsd / 1_000_000;
  const cachedInputCostUsd = cachedInputTokens * cacheRate / 1_000_000;
  const outputCostUsd = outputTokens * price.outputPerMillionUsd / 1_000_000;
  const modeledTokenCostUsd = uncachedInputCostUsd + cachedInputCostUsd + outputCostUsd;
  const invoiceVarianceUsd = reportedBillUsd - modeledTokenCostUsd;
  const invoiceVariancePercentage = reportedBillUsd > 0
    ? invoiceVarianceUsd / reportedBillUsd * 100
    : null;
  const acceptanceRatePercentage = attempts > 0 ? acceptedAnswers / attempts * 100 : 0;
  const nonAcceptedAttemptShare = attempts > 0 ? (attempts - acceptedAnswers) / attempts : 0;
  const costParts = [
    ["uncached input", uncachedInputCostUsd],
    ["cached input", cachedInputCostUsd],
    ["output", outputCostUsd],
  ] as const;
  const dominantDriver = costParts.reduce((largest, candidate) => candidate[1] > largest[1] ? candidate : largest)[0];

  return {
    modeledTokenCostUsd,
    uncachedInputCostUsd,
    cachedInputCostUsd,
    outputCostUsd,
    invoiceVarianceUsd,
    invoiceVariancePercentage,
    cacheSharePercentage: inputTokens > 0 ? cachedInputTokens / inputTokens * 100 : 0,
    acceptanceRatePercentage,
    costPerAttemptUsd: attempts > 0 ? modeledTokenCostUsd / attempts : null,
    costPerAcceptedAnswerUsd: acceptedAnswers > 0 ? modeledTokenCostUsd / acceptedAnswers : null,
    nonAcceptedAttemptCostUsd: modeledTokenCostUsd * nonAcceptedAttemptShare,
    dominantDriver,
    cacheRatePublished,
  };
}
