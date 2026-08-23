import { createChatGPTProxyProvider } from "@opencoredev/loginwithchatgpt-ai";
import { APICallError, streamText, type LanguageModelUsage } from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { requireChatGPT, requireOwnerAccount, type AuthContext } from "@/lib/access";
import { tokenTips } from "@/lib/catalog";
import { getChatGPTHandler } from "@/lib/chatgpt";
import { saveExperiment } from "@/lib/db";
import { getProviderCredential } from "@/lib/provider-vault";
import { ProviderRequestError, providerStrategyIds, runProviderText, type LabUsage } from "@/lib/provider-runner";
import { isProviderId, providerDefinition, type ProviderId } from "@/lib/providers";
import { planAtLeast, planDefinition } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  model: z.string().min(1).max(100),
  task: z.string().min(10).max(6_000),
  baselineInstructions: z.string().min(3).max(6_000),
  candidateInstructions: z.string().min(3).max(6_000).optional(),
  strategyId: z.string().min(1).max(100).default("custom"),
  providerId: z.union([z.literal("chatgpt"), z.string().refine(isProviderId)]).default("chatgpt"),
});

function usageDto(usage: LanguageModelUsage) {
  return {
    input: usage.inputTokens ?? 0,
    cachedRead: usage.inputTokenDetails.cacheReadTokens ?? 0,
    cachedWrite: usage.inputTokenDetails.cacheWriteTokens ?? 0,
    output: usage.outputTokens ?? 0,
    reasoning: usage.outputTokenDetails.reasoningTokens ?? 0,
    total: usage.totalTokens ?? 0,
  };
}

function settingsFor(strategyId: string, variant: "baseline" | "candidate") {
  const settings = {
    maxOutputTokens: 600,
    reasoningEffort: "low" as "low" | "medium",
    textVerbosity: "low" as "low" | "medium",
  };
  if (strategyId === "low-verbosity") {
    settings.textVerbosity = variant === "baseline" ? "medium" : "low";
  }
  if (strategyId === "lower-reasoning-effort") {
    settings.reasoningEffort = variant === "baseline" ? "medium" : "low";
  }
  if (strategyId === "cap-output" && variant === "candidate") {
    settings.maxOutputTokens = 300;
  }
  return settings;
}

function errorChain(error: unknown): unknown[] {
  const pending = [error];
  const seen = new Set<unknown>();
  const chain: unknown[] = [];

  while (pending.length > 0 && chain.length < 12) {
    const current = pending.shift();
    if (current == null || seen.has(current)) continue;
    seen.add(current);
    chain.push(current);
    if (typeof current !== "object") continue;

    const wrapped = current as { cause?: unknown; lastError?: unknown; errors?: unknown };
    if (wrapped.lastError != null) pending.push(wrapped.lastError);
    if (wrapped.cause != null) pending.push(wrapped.cause);
    if (Array.isArray(wrapped.errors)) pending.push(...wrapped.errors.slice(-3));
  }

  return chain;
}

function errorStatus(error: unknown): number | undefined {
  for (const current of errorChain(error)) {
    if (APICallError.isInstance(current)) return current.statusCode;
    if (current instanceof ProviderRequestError) return current.status;
    if (typeof current !== "object" || current == null) continue;
    const candidate = current as { status?: unknown; statusCode?: unknown };
    const status = candidate.statusCode ?? candidate.status;
    if (typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599) return status;
  }
  return undefined;
}

function hasErrorName(error: unknown, name: string): boolean {
  return errorChain(error).some((current) =>
    typeof current === "object" && current != null && "name" in current && current.name === name,
  );
}

function experimentFailure(error: unknown): Response {
  const status = errorStatus(error);

  if (status === 401) {
    return Response.json({ error: "The model connection expired. Reconnect it and run the test again." }, { status: 401 });
  }
  if (status === 429) {
    return Response.json({ error: "The model source is rate-limiting requests. Wait a minute, then retry." }, { status: 429 });
  }
  if (status && status >= 400 && status < 500) {
    return Response.json({ error: "The model source rejected this model or request setting. Refresh the model list or choose another model." }, { status: 422 });
  }
  if (status && status >= 500) {
    return Response.json({ error: "The model source is temporarily unavailable. No result was stored; retry shortly." }, { status: 502 });
  }
  if (hasErrorName(error, "TimeoutError")) {
    return Response.json({ error: "The model source did not respond within two minutes. No result was stored." }, { status: 504 });
  }
  if (hasErrorName(error, "AI_NoOutputGeneratedError")) {
    return Response.json({ error: "The model source completed without usable text. No result was stored; retry or choose another model." }, { status: 502 });
  }
  return Response.json({ error: "The experiment could not be completed. No result was stored; reconnect the model source or retry." }, { status: 500 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000) return Response.json({ error: "Experiment is too large." }, { status: 413 });

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 20_000) {
      return Response.json({ error: "Experiment is too large." }, { status: 413 });
    }
    const input = inputSchema.parse(JSON.parse(rawBody));
    const strategy = tokenTips.find((tip) => tip.id === input.strategyId);
    if (!strategy || strategy.experimentSupport !== "supported") {
      return Response.json({ error: "That strategy is not available for this account." }, { status: 403 });
    }
    const variants = [
      { key: "baseline" as const, instructions: input.baselineInstructions, settings: settingsFor(input.strategyId, "baseline") },
      { key: "candidate" as const, instructions: input.baselineInstructions, settings: settingsFor(input.strategyId, "candidate") },
    ];
    if (Math.random() < 0.5) variants.reverse();

    const results = new Map<"baseline" | "candidate", { text: string; usage: ReturnType<typeof usageDto>; settings: ReturnType<typeof settingsFor> }>();
    let account: AuthContext;
    if (input.providerId === "chatgpt") {
      // The ChatGPT session authorizes the proxy request, while the owner
      // context is the canonical TokenGauge identity for entitlements and
      // stored experiment history. These differ after a ChatGPT identity is
      // linked to a product account.
      const [, owner] = await Promise.all([
        requireChatGPT(request),
        requireOwnerAccount(request),
      ]);
      account = owner;
      if (!account.pro && strategy.access !== "free") {
        return Response.json({ error: "That strategy is not available for this account." }, { status: 403 });
      }
      const handler = getChatGPTHandler();
      const availableModels = await handler.getModels(request);
      if (!availableModels?.includes(input.model)) {
        return Response.json({ error: "That model is not available on this ChatGPT account." }, { status: 400 });
      }
      const provider = createChatGPTProxyProvider({ fetch: handler.proxyFetch(request) });
      for (const variant of variants) {
        let streamError: unknown;
        const result = streamText({
          model: provider(input.model),
          system: variant.instructions,
          prompt: input.task,
          maxOutputTokens: variant.settings.maxOutputTokens,
          // A lab run promises exactly two model requests. Disable the SDK's
          // implicit retries so a transient failure cannot silently consume
          // additional plan usage, and bound each arm so the UI cannot hang.
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(120_000),
          // streamText otherwise logs the provider error and later rejects
          // `text` with a new NoOutputGeneratedError that has lost the HTTP
          // status. Capture the original without logging its request body.
          onError: ({ error }) => { streamError = error; },
          providerOptions: { openai: { reasoningEffort: variant.settings.reasoningEffort, textVerbosity: variant.settings.textVerbosity } },
        });
        let text: string;
        let usage: LanguageModelUsage;
        try {
          [text, usage] = await Promise.all([result.text, result.usage]);
        } catch (error) {
          throw streamError ?? error;
        }
        results.set(variant.key, { text, usage: usageDto(usage), settings: variant.settings });
      }
    } else {
      const providerId = input.providerId as ProviderId;
      account = await requireOwnerAccount(request);
      const definition = providerDefinition(providerId);
      if (!planAtLeast(account.accessPlan, definition.minimumPlan)) {
        return Response.json({ error: `${definition.label} requires ${planDefinition(definition.minimumPlan).name}.` }, { status: 403 });
      }
      if (!definition.models.includes(input.model)) {
        return Response.json({ error: "That model is not supported by this adapter." }, { status: 400 });
      }
      if (!providerStrategyIds(providerId).includes(input.strategyId)) {
        return Response.json({ error: "That request setting is not portable to the selected provider." }, { status: 400 });
      }
      const credential = getProviderCredential(account.accountId, providerId);
      if (!credential) return Response.json({ error: `Connect ${definition.label} in Settings first.` }, { status: 409 });
      for (const variant of variants) {
        const result = await runProviderText({
          providerId,
          apiKey: credential.apiKey,
          configuration: credential.configuration,
          model: input.model,
          instructions: variant.instructions,
          task: input.task,
          settings: variant.settings,
        });
        results.set(variant.key, { text: result.text, usage: result.usage as LabUsage, settings: variant.settings });
      }
    }

    const baseline = results.get("baseline");
    const candidate = results.get("candidate");
    if (!baseline || !candidate) throw new Error("Experiment did not produce both variants.");

    saveExperiment({
      id: randomUUID(),
      accountId: account.accountId,
      strategyId: input.strategyId,
      model: input.model,
      providerId: input.providerId,
      baseline: baseline.usage,
      optimized: candidate.usage,
    });

    return Response.json(
      { baseline, candidate, providerId: input.providerId, executionOrder: variants.map((variant) => variant.key) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Check the experiment fields and try again." }, { status: 400 });
    }
    const chain = errorChain(error);
    console.error("Experiment failed", {
      outerName: error instanceof Error ? error.name : typeof error,
      terminalName: chain.findLast((item) => item instanceof Error)?.name,
      status: errorStatus(error),
    });
    return experimentFailure(error);
  }
}
