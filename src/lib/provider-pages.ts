import { modelPrices, priceProviders, type ModelPrice, type ProviderId } from "@/lib/costs";

export type ProviderPageProfile = {
  id: ProviderId;
  searchName: string;
  description: string;
  billingNote: string;
};

export const providerPageProfiles: readonly ProviderPageProfile[] = [
  {
    id: "openai",
    searchName: "OpenAI GPT",
    description: "Compare current GPT API input, cached-input, output, context-tier, and regional rate cards without mixing API billing with ChatGPT plan quotas.",
    billingNote: "Long-context thresholds and cache rates are model-specific. TokenGauge selects the matching published tier from the input size instead of averaging short- and long-context prices.",
  },
  {
    id: "anthropic",
    searchName: "Anthropic Claude",
    description: "Calculate Claude API costs from official input, cache-read, cache-write, output, context-window, and routing details.",
    billingNote: "Prompt-cache reads and writes have different rates, and one-hour cache writes can cost more than five-minute writes. The scenario calculator models warm reads only and labels that limitation.",
  },
  {
    id: "google",
    searchName: "Google Gemini",
    description: "Compare Gemini API model tiers, cached-input rates, output rates, introductory dates, and explicit cache-storage caveats.",
    billingNote: "Gemini Developer API and Vertex AI are not interchangeable billing surfaces. These cards retain the documented surface, tier, and effective dates instead of presenting one blended Gemini price.",
  },
  {
    id: "xai",
    searchName: "xAI Grok",
    description: "Estimate Grok API spend from current official input, cached-input, output, context-window, and regional price scopes.",
    billingNote: "A published cache-read discount is not a guaranteed cache hit. Model realistic warm-cache shares and measure actual provider usage before treating a scenario as savings.",
  },
  {
    id: "deepseek",
    searchName: "DeepSeek",
    description: "Compare DeepSeek API token rates with effective dates and time-sensitive pricing rules kept visible.",
    billingNote: "DeepSeek can publish scheduled and time-window pricing changes. TokenGauge keeps effective boundaries on separate rate cards and never applies a future rate before it begins.",
  },
  {
    id: "kimi",
    searchName: "Moonshot Kimi",
    description: "Calculate Kimi API costs across official model, context, cache, and batch pricing scopes.",
    billingNote: "Batch, cache, and standard request prices describe different execution modes. Use the card matching the actual request path rather than assuming the lowest listed rate applies.",
  },
  {
    id: "qwen",
    searchName: "Alibaba Qwen",
    description: "Compare Qwen API rates while preserving region, input tier, cache mode, and context constraints.",
    billingNote: "Qwen prices can depend on region, input size, and cache mode at the same time. TokenGauge retains those dimensions as distinct cards so a low tier is not silently applied to an ineligible request.",
  },
  {
    id: "mistral",
    searchName: "Mistral AI",
    description: "Estimate Mistral API input and output token costs from a dated, official-source pricing snapshot.",
    billingNote: "A missing cache rate is displayed as unavailable, not zero. The calculator falls back to the normal input price whenever no separate cache-read rate is published.",
  },
  {
    id: "cohere",
    searchName: "Cohere Command",
    description: "Compare Cohere Command API input, output, context, and documented pricing scopes with source provenance attached.",
    billingNote: "Cards marked for manual review retain their provenance note. Confirm the linked provider page before making a production commitment when a provider's pricing surfaces disagree.",
  },
];

export function providerPageProfile(id: string): ProviderPageProfile | undefined {
  return providerPageProfiles.find((profile) => profile.id === id);
}

export function providerLabel(id: ProviderId): string {
  return priceProviders.find((provider) => provider.id === id)?.label ?? id;
}

export function providerRateCards(id: ProviderId): readonly ModelPrice[] {
  return modelPrices.filter((model) => model.provider === id);
}

export function uniqueProviderModels(id: ProviderId): number {
  return new Set(providerRateCards(id).map((model) => model.modelId)).size;
}

export function providerSourceUrls(id: ProviderId): readonly string[] {
  return Array.from(new Set(providerRateCards(id).flatMap((model) => model.provenanceUrls ?? [model.sourceUrl])));
}
