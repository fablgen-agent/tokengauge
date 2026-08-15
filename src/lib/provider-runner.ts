import "server-only";

import type { ProviderId } from "@/lib/providers";

export type LabUsage = {
  input: number;
  cachedRead: number;
  cachedWrite: number;
  output: number;
  reasoning: number;
  total: number;
};

export type LabSettings = {
  maxOutputTokens: number;
  reasoningEffort: "low" | "medium";
  textVerbosity: "low" | "medium";
};

type RunInput = {
  providerId: ProviderId;
  apiKey: string;
  configuration: Record<string, string>;
  model: string;
  instructions: string;
  task: string;
  settings: LabSettings;
};

function numeric(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Provider request failed with HTTP ${response.status}.`);
  return await response.json() as Record<string, unknown>;
}

function compatibleEndpoint(providerId: ProviderId, configuration: Record<string, string>): string {
  switch (providerId) {
    case "xai": return "https://api.x.ai/v1/chat/completions";
    case "deepseek": return "https://api.deepseek.com/chat/completions";
    case "kimi": return "https://api.moonshot.cn/v1/chat/completions";
    case "qwen": return configuration.region === "beijing"
      ? "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
      : "https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions";
    case "mistral": return "https://api.mistral.ai/v1/chat/completions";
    default: throw new Error("Provider does not use the compatible chat adapter.");
  }
}

async function runOpenAI(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  const data = await postJson("https://api.openai.com/v1/responses", { Authorization: `Bearer ${input.apiKey}` }, {
    model: input.model,
    instructions: input.instructions,
    input: input.task,
    max_output_tokens: input.settings.maxOutputTokens,
    reasoning: { effort: input.settings.reasoningEffort },
    text: { verbosity: input.settings.textVerbosity },
  });
  const usage = (data.usage ?? {}) as Record<string, unknown>;
  const inputDetails = (usage.input_tokens_details ?? {}) as Record<string, unknown>;
  const outputDetails = (usage.output_tokens_details ?? {}) as Record<string, unknown>;
  const output = Array.isArray(data.output) ? data.output : [];
  const text = output.flatMap((item) => {
    const content = typeof item === "object" && item && Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : [];
    return content.flatMap((part) => typeof part === "object" && part && typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : []);
  }).join("");
  return { text, usage: {
    input: numeric(usage.input_tokens),
    cachedRead: numeric(inputDetails.cached_tokens),
    cachedWrite: 0,
    output: numeric(usage.output_tokens),
    reasoning: numeric(outputDetails.reasoning_tokens),
    total: numeric(usage.total_tokens),
  } };
}

async function runAnthropic(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  const data = await postJson("https://api.anthropic.com/v1/messages", {
    "x-api-key": input.apiKey,
    "anthropic-version": "2023-06-01",
  }, {
    model: input.model,
    system: input.instructions,
    messages: [{ role: "user", content: input.task }],
    max_tokens: input.settings.maxOutputTokens,
  });
  const usage = (data.usage ?? {}) as Record<string, unknown>;
  const cachedRead = numeric(usage.cache_read_input_tokens);
  const cachedWrite = numeric(usage.cache_creation_input_tokens);
  const uncachedInput = numeric(usage.input_tokens);
  const outputTokens = numeric(usage.output_tokens);
  const content = Array.isArray(data.content) ? data.content : [];
  const text = content.flatMap((part) => typeof part === "object" && part && (part as { type?: unknown }).type === "text" && typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : []).join("");
  return { text, usage: {
    input: uncachedInput + cachedRead + cachedWrite,
    cachedRead,
    cachedWrite,
    output: outputTokens,
    reasoning: 0,
    total: uncachedInput + cachedRead + cachedWrite + outputTokens,
  } };
}

async function runGoogle(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`,
    { "x-goog-api-key": input.apiKey },
    {
      systemInstruction: { parts: [{ text: input.instructions }] },
      contents: [{ role: "user", parts: [{ text: input.task }] }],
      generationConfig: {
        maxOutputTokens: input.settings.maxOutputTokens,
        thinkingConfig: { thinkingLevel: input.settings.reasoningEffort === "low" ? "LOW" : "MEDIUM" },
      },
    },
  );
  const usage = (data.usageMetadata ?? {}) as Record<string, unknown>;
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const text = candidates.flatMap((candidate) => {
    const content = typeof candidate === "object" && candidate ? (candidate as { content?: { parts?: unknown[] } }).content : undefined;
    return (content?.parts ?? []).flatMap((part) => typeof part === "object" && part && typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : []);
  }).join("");
  return { text, usage: {
    input: numeric(usage.promptTokenCount),
    cachedRead: numeric(usage.cachedContentTokenCount),
    cachedWrite: 0,
    output: numeric(usage.candidatesTokenCount),
    reasoning: numeric(usage.thoughtsTokenCount),
    total: numeric(usage.totalTokenCount),
  } };
}

async function runCohere(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  const data = await postJson("https://api.cohere.com/v2/chat", { Authorization: `Bearer ${input.apiKey}` }, {
    model: input.model,
    messages: [
      { role: "system", content: input.instructions },
      { role: "user", content: input.task },
    ],
    max_tokens: input.settings.maxOutputTokens,
  });
  const usageRoot = (data.usage ?? {}) as Record<string, unknown>;
  const usage = (usageRoot.tokens ?? usageRoot.billed_units ?? {}) as Record<string, unknown>;
  const inputTokens = numeric(usage.input_tokens);
  const outputTokens = numeric(usage.output_tokens);
  const message = (data.message ?? {}) as { content?: unknown[] };
  const text = (message.content ?? []).flatMap((part) => typeof part === "object" && part && typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : []).join("");
  return { text, usage: { input: inputTokens, cachedRead: 0, cachedWrite: 0, output: outputTokens, reasoning: 0, total: inputTokens + outputTokens } };
}

async function runCompatible(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  const data = await postJson(compatibleEndpoint(input.providerId, input.configuration), { Authorization: `Bearer ${input.apiKey}` }, {
    model: input.model,
    messages: [
      { role: "system", content: input.instructions },
      { role: "user", content: input.task },
    ],
    max_tokens: input.settings.maxOutputTokens,
  });
  const usage = (data.usage ?? {}) as Record<string, unknown>;
  const promptDetails = (usage.prompt_tokens_details ?? {}) as Record<string, unknown>;
  const completionDetails = (usage.completion_tokens_details ?? {}) as Record<string, unknown>;
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  const inputTokens = numeric(usage.prompt_tokens);
  const outputTokens = numeric(usage.completion_tokens);
  return { text: typeof first?.message?.content === "string" ? first.message.content : "", usage: {
    input: inputTokens,
    cachedRead: numeric(promptDetails.cached_tokens ?? usage.prompt_cache_hit_tokens),
    cachedWrite: 0,
    output: outputTokens,
    reasoning: numeric(completionDetails.reasoning_tokens),
    total: numeric(usage.total_tokens) || inputTokens + outputTokens,
  } };
}

export function providerStrategyIds(providerId: ProviderId): readonly string[] {
  if (providerId === "openai") return ["lower-reasoning-effort", "low-verbosity", "cap-output"];
  if (providerId === "google") return ["lower-reasoning-effort", "cap-output"];
  return ["cap-output"];
}

export async function runProviderText(input: RunInput): Promise<{ text: string; usage: LabUsage }> {
  if (input.providerId === "openai") return runOpenAI(input);
  if (input.providerId === "anthropic") return runAnthropic(input);
  if (input.providerId === "google") return runGoogle(input);
  if (input.providerId === "cohere") return runCohere(input);
  return runCompatible(input);
}
