import { beforeEach, describe, expect, it, vi } from "vitest";

const requireChatGPT = vi.fn();
const requireOwnerAccount = vi.fn();
const getModels = vi.fn();
const proxyFetch = vi.fn();
const saveExperiment = vi.fn();
const streamText = vi.fn();

vi.mock("@/lib/access", () => ({ requireChatGPT, requireOwnerAccount }));
vi.mock("@/lib/catalog", () => ({
  tokenTips: [{
    id: "lower-reasoning-effort",
    access: "paid",
    experimentSupport: "supported",
  }],
}));
vi.mock("@/lib/chatgpt", () => ({
  getChatGPTHandler: () => ({ getModels, proxyFetch: () => proxyFetch }),
}));
vi.mock("@/lib/db", () => ({ saveExperiment }));
vi.mock("@/lib/provider-vault", () => ({ getProviderCredential: vi.fn() }));
vi.mock("@/lib/provider-runner", () => ({
  ProviderRequestError: class ProviderRequestError extends Error {},
  providerStrategyIds: vi.fn(),
  runProviderText: vi.fn(),
}));
vi.mock("@/lib/providers", () => ({
  isProviderId: () => false,
  providerDefinition: vi.fn(),
}));
vi.mock("@opencoredev/loginwithchatgpt-ai", () => ({
  createChatGPTProxyProvider: () => (model: string) => model,
}));
vi.mock("ai", () => ({
  APICallError: { isInstance: (error: unknown) => Boolean(error && typeof error === "object" && "kind" in error && error.kind === "api") },
  streamText,
}));

const { POST } = await import("./route");

const usage = {
  inputTokens: 20,
  inputTokenDetails: { cacheReadTokens: 0, cacheWriteTokens: 0 },
  outputTokens: 10,
  outputTokenDetails: { reasoningTokens: 2 },
  totalTokens: 30,
};

describe("ChatGPT experiment account ownership", () => {
  beforeEach(() => {
    requireChatGPT.mockReset();
    requireOwnerAccount.mockReset();
    getModels.mockReset();
    proxyFetch.mockReset();
    saveExperiment.mockReset();
    streamText.mockReset();

    requireChatGPT.mockResolvedValue({
      accountId: "chatgpt-account",
      accessPlan: "free",
      pro: false,
      kind: "chatgpt",
    });
    requireOwnerAccount.mockResolvedValue({
      accountId: "product-account",
      accessPlan: "pro",
      pro: true,
      kind: "chatgpt_linked",
    });
    getModels.mockResolvedValue(["gpt-test"]);
    streamText.mockImplementation(() => ({
      text: Promise.resolve("A concise result"),
      usage: Promise.resolve(usage),
    }));
  });

  it("uses the linked owner entitlement and stores history under the owner account", async () => {
    const response = await POST(new Request("https://tokengauge.enby.fish/api/experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "chatgpt",
        model: "gpt-test",
        strategyId: "lower-reasoning-effort",
        task: "Explain this request in a concise paragraph.",
        baselineInstructions: "Preserve every required fact.",
      }),
    }));

    expect(response.status).toBe(200);
    expect(requireChatGPT).toHaveBeenCalledOnce();
    expect(requireOwnerAccount).toHaveBeenCalledOnce();
    expect(streamText).toHaveBeenCalledTimes(2);
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
      maxRetries: 0,
      abortSignal: expect.any(AbortSignal),
    }));
    expect(saveExperiment).toHaveBeenCalledOnce();
    expect(saveExperiment).toHaveBeenCalledWith(expect.objectContaining({
      accountId: "product-account",
      providerId: "chatgpt",
    }));
  });

  it("still rejects a paid recipe when the canonical owner has no paid access", async () => {
    requireOwnerAccount.mockResolvedValue({
      accountId: "free-owner",
      accessPlan: "free",
      pro: false,
      kind: "chatgpt",
    });

    const response = await POST(new Request("https://tokengauge.enby.fish/api/experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "chatgpt",
        model: "gpt-test",
        strategyId: "lower-reasoning-effort",
        task: "Explain this request in a concise paragraph.",
        baselineInstructions: "Preserve every required fact.",
      }),
    }));

    expect(response.status).toBe(403);
    expect(streamText).not.toHaveBeenCalled();
    expect(saveExperiment).not.toHaveBeenCalled();
  });

  it("surfaces a wrapped upstream rate limit instead of the generic failure", async () => {
    streamText.mockImplementationOnce(() => ({
      text: Promise.reject({
        name: "AI_RetryError",
        lastError: { kind: "api", statusCode: 429 },
      }),
      usage: Promise.resolve(usage),
    }));

    const response = await POST(new Request("https://tokengauge.enby.fish/api/experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "chatgpt",
        model: "gpt-test",
        strategyId: "lower-reasoning-effort",
        task: "Explain this request in a concise paragraph.",
        baselineInstructions: "Preserve every required fact.",
      }),
    }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "The model source is rate-limiting requests. Wait a minute, then retry.",
    });
    expect(saveExperiment).not.toHaveBeenCalled();
  });

  it("explains a wrapped empty model response", async () => {
    streamText.mockImplementationOnce(() => ({
      text: Promise.reject({ name: "AI_NoOutputGeneratedError" }),
      usage: Promise.resolve(usage),
    }));

    const response = await POST(new Request("https://tokengauge.enby.fish/api/experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "chatgpt",
        model: "gpt-test",
        strategyId: "lower-reasoning-effort",
        task: "Explain this request in a concise paragraph.",
        baselineInstructions: "Preserve every required fact.",
      }),
    }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "The model source completed without usable text. No result was stored; retry or choose another model.",
    });
  });
});
