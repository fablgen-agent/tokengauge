import type { PlanId } from "@/lib/plans";

export type ProviderId = "openai" | "anthropic" | "google" | "xai" | "deepseek" | "kimi" | "qwen" | "mistral" | "cohere";

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  minimumPlan: PlanId;
  models: readonly string[];
  keyUrl: string;
  configuration?: {
    name: "region";
    label: string;
    options: readonly { value: string; label: string }[];
    defaultValue: string;
  };
};

export const providerDefinitions: readonly ProviderDefinition[] = [
  { id: "openai", label: "OpenAI API", minimumPlan: "pro_plus", models: ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"], keyUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic Claude", minimumPlan: "pro_plus", models: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-sonnet-5", "claude-opus-5"], keyUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", label: "Google Gemini", minimumPlan: "pro_plus", models: ["gemini-3.1-flash-lite", "gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"], keyUrl: "https://aistudio.google.com/app/apikey" },
  { id: "xai", label: "xAI Grok", minimumPlan: "ultimate", models: ["grok-4.3", "grok-4.5", "grok-4.6", "grok-4.20-0309-reasoning"], keyUrl: "https://console.x.ai/" },
  { id: "deepseek", label: "DeepSeek", minimumPlan: "ultimate", models: ["deepseek-v4-flash", "deepseek-v4-pro"], keyUrl: "https://platform.deepseek.com/api_keys" },
  { id: "kimi", label: "Kimi / Moonshot AI", minimumPlan: "ultimate", models: ["kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed", "kimi-k3"], keyUrl: "https://platform.kimi.com/console/api-keys" },
  {
    id: "qwen",
    label: "Qwen / Alibaba Model Studio",
    minimumPlan: "ultimate",
    models: ["qwen3.7-flash", "qwen3.7-plus", "qwen3.7-max"],
    keyUrl: "https://modelstudio.console.alibabacloud.com/",
    configuration: {
      name: "region",
      label: "API-key region",
      defaultValue: "us",
      options: [
        { value: "us", label: "US (Virginia)" },
        { value: "beijing", label: "China (Beijing)" },
      ],
    },
  },
  { id: "mistral", label: "Mistral AI", minimumPlan: "ultimate", models: ["ministral-3b-latest", "ministral-8b-latest", "ministral-14b-latest", "mistral-small-latest", "mistral-medium-latest", "mistral-large-latest", "codestral-latest"], keyUrl: "https://console.mistral.ai/api-keys" },
  { id: "cohere", label: "Cohere", minimumPlan: "ultimate", models: ["command-r7b-12-2024", "command-r-08-2024", "command-r-plus-08-2024", "command-a-03-2025"], keyUrl: "https://dashboard.cohere.com/api-keys" },
] as const;

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && providerDefinitions.some((provider) => provider.id === value);
}

export function providerDefinition(id: ProviderId): ProviderDefinition {
  const provider = providerDefinitions.find((candidate) => candidate.id === id);
  if (!provider) throw new Error("Unsupported provider.");
  return provider;
}

export function providerConfiguration(id: ProviderId, input: Record<string, string> | undefined): Record<string, string> {
  const provider = providerDefinition(id);
  if (!provider.configuration) return {};
  const proposed = input?.[provider.configuration.name] ?? provider.configuration.defaultValue;
  const allowed = provider.configuration.options.some((option) => option.value === proposed);
  return { [provider.configuration.name]: allowed ? proposed : provider.configuration.defaultValue };
}
