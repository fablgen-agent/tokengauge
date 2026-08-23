export type MediaBillingUnit = "image" | "second";

export interface MediaRateCard {
  readonly id: string;
  readonly provider: "openai" | "xai";
  readonly providerLabel: string;
  readonly modelId: string;
  readonly label: string;
  readonly billingUnit: MediaBillingUnit;
  readonly outputPriceUsd: number;
  readonly inputImagePriceUsd?: number;
  readonly sourceUrl: string;
  readonly sourceLabel: string;
  readonly verifiedAt: string;
  readonly caveat: string;
}

export interface MediaCostScenario {
  readonly requests: number;
  readonly outputUnitsPerRequest: number;
  readonly inputImagesPerRequest: number;
  readonly otherCostPerRequestUsd: number;
  readonly monthlyBudgetUsd: number;
}

export interface MediaCostResult {
  readonly outputCostUsd: number;
  readonly inputImageCostUsd: number;
  readonly otherCostUsd: number;
  readonly totalCostUsd: number;
  readonly budgetDifferenceUsd: number;
  readonly maximumOutputUnitsPerRequest: number;
}

export const mediaPriceSnapshotDate = "2026-08-23";

export const mediaRateCards: readonly MediaRateCard[] = [
  {
    id: "xai-grok-imagine-image-2-low-1k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-2.0",
    label: "Image 2.0 · 1K low",
    billingUnit: "image",
    outputPriceUsd: 0.04,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-2.0",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-2-low-2k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-2.0",
    label: "Image 2.0 · 2K low",
    billingUnit: "image",
    outputPriceUsd: 0.06,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-2.0",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-2-medium-1k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-2.0",
    label: "Image 2.0 · 1K medium",
    billingUnit: "image",
    outputPriceUsd: 0.06,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-2.0",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-2-medium-2k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-2.0",
    label: "Image 2.0 · 2K medium",
    billingUnit: "image",
    outputPriceUsd: 0.08,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-2.0",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-1k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image",
    label: "Imagine Image · 1K / 2K",
    billingUnit: "image",
    outputPriceUsd: 0.02,
    inputImagePriceUsd: 0.002,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-quality-1k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-quality",
    label: "Imagine Image Quality · 1K",
    billingUnit: "image",
    outputPriceUsd: 0.05,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-quality",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-image-quality-2k",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-image-quality",
    label: "Imagine Image Quality · 2K",
    billingUnit: "image",
    outputPriceUsd: 0.07,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/models/grok-imagine-image-quality",
    sourceLabel: "Official xAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image edits also bill each input image. Text input is not included in this per-unit estimate.",
  },
  {
    id: "xai-grok-imagine-video-1-5-480p",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-video-1.5",
    label: "Imagine Video 1.5 · 480p",
    billingUnit: "second",
    outputPriceUsd: 0.08,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/pricing",
    sourceLabel: "Official xAI API pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image-to-video also bills the input image. Text, audio, retries, and any other billable inputs are excluded unless entered as other cost.",
  },
  {
    id: "xai-grok-imagine-video-1-5-720p",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-video-1.5",
    label: "Imagine Video 1.5 · 720p",
    billingUnit: "second",
    outputPriceUsd: 0.14,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/pricing",
    sourceLabel: "Official xAI API pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image-to-video also bills the input image. Text, audio, retries, and any other billable inputs are excluded unless entered as other cost.",
  },
  {
    id: "xai-grok-imagine-video-1-5-1080p",
    provider: "xai",
    providerLabel: "xAI",
    modelId: "grok-imagine-video-1.5",
    label: "Imagine Video 1.5 · 1080p",
    billingUnit: "second",
    outputPriceUsd: 0.25,
    inputImagePriceUsd: 0.01,
    sourceUrl: "https://docs.x.ai/developers/pricing",
    sourceLabel: "Official xAI API pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "Image-to-video also bills the input image. Text, audio, retries, and any other billable inputs are excluded unless entered as other cost.",
  },
  {
    id: "openai-gpt-image-1-5-low-square",
    provider: "openai",
    providerLabel: "OpenAI",
    modelId: "gpt-image-1.5",
    label: "GPT Image 1.5 · low · 1024²",
    billingUnit: "image",
    outputPriceUsd: 0.009,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-image-1.5",
    sourceLabel: "Official OpenAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "This is the listed generation-output estimate only. Text and image input tokens are separate; enter their modeled cost as other cost per request.",
  },
  {
    id: "openai-gpt-image-1-5-medium-square",
    provider: "openai",
    providerLabel: "OpenAI",
    modelId: "gpt-image-1.5",
    label: "GPT Image 1.5 · medium · 1024²",
    billingUnit: "image",
    outputPriceUsd: 0.034,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-image-1.5",
    sourceLabel: "Official OpenAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "This is the listed generation-output estimate only. Text and image input tokens are separate; enter their modeled cost as other cost per request.",
  },
  {
    id: "openai-gpt-image-1-5-high-square",
    provider: "openai",
    providerLabel: "OpenAI",
    modelId: "gpt-image-1.5",
    label: "GPT Image 1.5 · high · 1024²",
    billingUnit: "image",
    outputPriceUsd: 0.133,
    sourceUrl: "https://developers.openai.com/api/docs/models/gpt-image-1.5",
    sourceLabel: "Official OpenAI model pricing",
    verifiedAt: mediaPriceSnapshotDate,
    caveat: "This is the listed generation-output estimate only. Text and image input tokens are separate; enter their modeled cost as other cost per request.",
  },
] as const;

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function calculateMediaCost(rate: MediaRateCard, scenario: MediaCostScenario): MediaCostResult {
  const requests = finiteNonNegative(scenario.requests);
  const outputUnits = finiteNonNegative(scenario.outputUnitsPerRequest);
  const inputImages = finiteNonNegative(scenario.inputImagesPerRequest);
  const otherPerRequest = finiteNonNegative(scenario.otherCostPerRequestUsd);
  const budget = finiteNonNegative(scenario.monthlyBudgetUsd);
  const outputCostUsd = requests * outputUnits * rate.outputPriceUsd;
  const inputImageCostUsd = requests * inputImages * (rate.inputImagePriceUsd ?? 0);
  const otherCostUsd = requests * otherPerRequest;
  const totalCostUsd = outputCostUsd + inputImageCostUsd + otherCostUsd;
  const fixedCostUsd = inputImageCostUsd + otherCostUsd;
  const maximumOutputUnitsPerRequest = requests > 0 && budget > fixedCostUsd
    ? Math.floor(((budget - fixedCostUsd) / requests) / rate.outputPriceUsd)
    : 0;

  return {
    outputCostUsd,
    inputImageCostUsd,
    otherCostUsd,
    totalCostUsd,
    budgetDifferenceUsd: budget - totalCostUsd,
    maximumOutputUnitsPerRequest,
  };
}
