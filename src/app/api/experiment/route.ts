import { createChatGPTProxyProvider } from "@opencoredev/loginwithchatgpt-ai";
import { generateText, type LanguageModelUsage } from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { requirePro } from "@/lib/access";
import { getChatGPTHandler } from "@/lib/chatgpt";
import { saveExperiment } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  model: z.string().min(1).max(100),
  task: z.string().min(10).max(6_000),
  baselineInstructions: z.string().min(3).max(6_000),
  candidateInstructions: z.string().min(3).max(6_000),
  strategyId: z.string().min(1).max(100).default("custom"),
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

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 20_000) return Response.json({ error: "Experiment is too large." }, { status: 413 });

    const account = await requirePro(request);
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 20_000) {
      return Response.json({ error: "Experiment is too large." }, { status: 413 });
    }
    const input = inputSchema.parse(JSON.parse(rawBody));

    const handler = getChatGPTHandler();
    const availableModels = await handler.getModels(request);
    if (!availableModels?.includes(input.model)) {
      return Response.json({ error: "That model is not available on this ChatGPT account." }, { status: 400 });
    }

    const provider = createChatGPTProxyProvider({ fetch: handler.proxyFetch(request) });
    const variants = [
      { key: "baseline" as const, instructions: input.baselineInstructions },
      { key: "candidate" as const, instructions: input.candidateInstructions },
    ];
    if (Math.random() < 0.5) variants.reverse();

    const results = new Map<"baseline" | "candidate", { text: string; usage: ReturnType<typeof usageDto> }>();
    for (const variant of variants) {
      const result = await generateText({
        model: provider(input.model),
        system: variant.instructions,
        prompt: input.task,
        maxOutputTokens: 600,
        providerOptions: { openai: { reasoningEffort: "low", textVerbosity: "low" } },
      });
      results.set(variant.key, { text: result.text, usage: usageDto(result.usage) });
    }

    const baseline = results.get("baseline");
    const candidate = results.get("candidate");
    if (!baseline || !candidate) throw new Error("Experiment did not produce both variants.");

    saveExperiment({
      id: randomUUID(),
      accountId: account.accountId,
      strategyId: input.strategyId,
      model: input.model,
      baseline: baseline.usage,
      optimized: candidate.usage,
    });

    return Response.json(
      { baseline, candidate, executionOrder: variants.map((variant) => variant.key) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Check the experiment fields and try again." }, { status: 400 });
    }
    console.error("Experiment failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The experiment could not be completed." }, { status: 500 });
  }
}
