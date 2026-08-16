import type { ProviderId } from "@/lib/costs";

export type ProviderComparison = {
  slug: string;
  left: ProviderId;
  right: ProviderId;
  searchTitle: string;
  description: string;
  billingCaveat: string;
};

export const providerComparisons: readonly ProviderComparison[] = [
  {
    slug: "openai-vs-anthropic",
    left: "openai",
    right: "anthropic",
    searchTitle: "OpenAI vs Anthropic API pricing",
    description: "Compare current GPT and Claude API rate cards on the same request volume, token counts, cache-read share, and quality-pass assumptions.",
    billingCaveat: "OpenAI context tiers and Anthropic cache-write lifetimes are different billing mechanisms. Select the exact card used by each workload rather than comparing provider-wide minimums.",
  },
  {
    slug: "gemini-vs-grok",
    left: "google",
    right: "xai",
    searchTitle: "Gemini vs Grok API pricing",
    description: "Compare Google Gemini and xAI Grok API token costs with model, context, cache, region, and quality assumptions kept visible.",
    billingCaveat: "Gemini Developer API, Vertex AI, and xAI regional price scopes are not interchangeable. Match each rate card to the actual API surface and deployment region.",
  },
  {
    slug: "deepseek-vs-kimi",
    left: "deepseek",
    right: "kimi",
    searchTitle: "DeepSeek vs Kimi API pricing",
    description: "Compare DeepSeek and Moonshot Kimi API spend without hiding effective dates, cache modes, context tiers, or batch-only discounts.",
    billingCaveat: "DeepSeek time-window prices and Kimi batch or cache tiers apply only under their documented conditions. A scheduled or batch rate is not a general on-demand price.",
  },
  {
    slug: "kimi-vs-qwen",
    left: "kimi",
    right: "qwen",
    searchTitle: "Kimi vs Qwen API pricing",
    description: "Compare Moonshot Kimi and Alibaba Qwen API token costs while preserving region, input band, context, cache, and execution-mode rules.",
    billingCaveat: "Qwen can vary by region, input size, and cache mode while Kimi separates standard and batch paths. Use only tiers the intended request actually qualifies for.",
  },
  {
    slug: "mistral-vs-cohere",
    left: "mistral",
    right: "cohere",
    searchTitle: "Mistral vs Cohere API pricing",
    description: "Compare Mistral and Cohere API rates with the same workload and quality assumptions using dated, source-linked price cards.",
    billingCaveat: "A missing cache rate means no separate published cache-read price was captured; it does not mean cached input is free. Review manual-verification notes before production decisions.",
  },
];

export function providerComparison(slug: string): ProviderComparison | undefined {
  return providerComparisons.find((comparison) => comparison.slug === slug);
}
