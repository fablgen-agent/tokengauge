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

export type BillAuditReportContext = {
  providerLabel: string;
  modelLabel: string;
  tierLabel: string;
  region: string;
  snapshotDate: string;
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

export function buildBillAuditReport(
  context: BillAuditReportContext,
  input: BillAuditInput,
  result: BillAuditResult,
): string {
  const acceptedAnswers = Math.min(Math.trunc(finite(input.acceptedAnswers)), Math.trunc(finite(input.attempts)));
  const varianceDirection = result.invoiceVarianceUsd >= 0 ? "above" : "below";
  const cacheTreatment = result.cacheRatePublished
    ? "Published cache-read rate applied"
    : "No published cache-read rate; cached input conservatively priced as ordinary input";

  return [
    "TokenGauge bill-audit handoff",
    `Rate snapshot: ${context.snapshotDate}`,
    `Rate card: ${context.providerLabel} · ${context.modelLabel} · ${context.tierLabel} · ${context.region}`,
    "",
    "Aggregate usage supplied",
    `- Input tokens: ${Math.trunc(finite(input.inputTokens)).toLocaleString("en-GB")}`,
    `- Cached input tokens: ${Math.min(Math.trunc(finite(input.cachedInputTokens)), Math.trunc(finite(input.inputTokens))).toLocaleString("en-GB")}`,
    `- Output tokens: ${Math.trunc(finite(input.outputTokens)).toLocaleString("en-GB")}`,
    `- Attempts: ${Math.trunc(finite(input.attempts)).toLocaleString("en-GB")}`,
    `- Accepted answers: ${acceptedAnswers.toLocaleString("en-GB")}`,
    `- Reported provider bill: ${formatReportUsd(finite(input.reportedBillUsd))}`,
    "",
    "Modeled result",
    `- Token spend: ${formatReportUsd(result.modeledTokenCostUsd)}`,
    `- Invoice gap: ${formatReportUsd(Math.abs(result.invoiceVarianceUsd))} ${varianceDirection} the token model`,
    `- Largest modeled bucket: ${result.dominantDriver}`,
    `- Cache share: ${result.cacheSharePercentage.toFixed(1)}%`,
    `- Accepted-answer rate: ${result.acceptanceRatePercentage.toFixed(1)}%`,
    `- Cost per accepted answer: ${result.costPerAcceptedAnswerUsd === null ? "unavailable" : formatReportUsd(result.costPerAcceptedAnswerUsd, 4)}`,
    `- Non-accepted-attempt estimate: ${formatReportUsd(result.nonAcceptedAttemptCostUsd)}`,
    `- Cache treatment: ${cacheTreatment}`,
    "",
    "Interpretation boundary",
    "This browser-local rate-card model is not an invoice audit or proof of overbilling. Investigate mixed price bands, tools, cache writes or storage, media, regional or priority uplifts, taxes, credits, and rounding before drawing a conclusion. Retry cost is a uniform-attempt approximation unless retry-specific usage is available.",
    "",
    "Generated locally at https://tokengauge.enby.fish/audit",
  ].join("\n");
}

function formatReportUsd(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value > 0 && value < .01 ? maximumFractionDigits : 2,
    maximumFractionDigits,
  }).format(value);
}
