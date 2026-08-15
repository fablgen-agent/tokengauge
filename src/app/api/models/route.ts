import { requireChatGPT, requireOwnerAccount } from "@/lib/access";
import { getChatGPTHandler } from "@/lib/chatgpt";
import { getProviderCredential } from "@/lib/provider-vault";
import { providerStrategyIds } from "@/lib/provider-runner";
import { isProviderId, providerDefinition } from "@/lib/providers";
import { planAtLeast, planDefinition } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const providerId = new URL(request.url).searchParams.get("provider") || "chatgpt";
    if (providerId === "chatgpt") {
      await requireChatGPT(request);
      const models = (await getChatGPTHandler().getModels(request)) ?? [];
      return Response.json({ providerId, models, strategyIds: ["lower-reasoning-effort", "low-verbosity", "cap-output"] }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!isProviderId(providerId)) return Response.json({ error: "Unknown provider." }, { status: 400 });
    const account = await requireOwnerAccount(request);
    const definition = providerDefinition(providerId);
    if (!planAtLeast(account.accessPlan, definition.minimumPlan)) {
      return Response.json({ error: `${definition.label} requires ${planDefinition(definition.minimumPlan).name}.` }, { status: 403 });
    }
    if (!getProviderCredential(account.accountId, providerId)) {
      return Response.json({ error: `Connect ${definition.label} in Settings first.` }, { status: 409 });
    }
    return Response.json({ providerId, models: definition.models, strategyIds: providerStrategyIds(providerId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Models could not be loaded." }, { status: 500 });
  }
}
