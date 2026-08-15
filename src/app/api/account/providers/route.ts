import { z } from "zod";

import { requireProductAccount } from "@/lib/access";
import { deleteProviderCredential, listProviderCredentials, saveProviderCredential } from "@/lib/provider-vault";
import { isProviderId, providerConfiguration, providerDefinition, providerDefinitions } from "@/lib/providers";
import { planAtLeast } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mutationSchema = z.object({
  providerId: z.string().refine(isProviderId),
  apiKey: z.string().min(12).max(1_000),
  configuration: z.record(z.string(), z.string().max(100)).optional(),
});

const deletionSchema = z.object({ providerId: z.string().refine(isProviderId) });

export async function GET(request: Request): Promise<Response> {
  try {
    const account = await requireProductAccount(request);
    const connected = new Map(listProviderCredentials(account.accountId).map((item) => [item.providerId, item]));
    return Response.json({
      plan: account.accessPlan,
      providers: providerDefinitions.map((provider) => ({
        ...provider,
        allowed: planAtLeast(account.accessPlan, provider.minimumPlan),
        connection: connected.get(provider.id),
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Provider settings could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const account = await requireProductAccount(request);
    const input = mutationSchema.parse(await request.json());
    const provider = providerDefinition(input.providerId);
    if (!planAtLeast(account.accessPlan, provider.minimumPlan)) {
      return Response.json({ error: `${provider.label} requires ${provider.minimumPlan === "ultimate" ? "Ultimate" : "Pro+"}.` }, { status: 403 });
    }
    saveProviderCredential({
      accountId: account.accountId,
      providerId: input.providerId,
      apiKey: input.apiKey,
      configuration: providerConfiguration(input.providerId, input.configuration),
    });
    return Response.json({ saved: true, keyHint: input.apiKey.trim().slice(-4) });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Check the provider and API key fields." }, { status: 400 });
    }
    console.error("Provider credential save failed");
    return Response.json({ error: "The provider connection could not be saved." }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const account = await requireProductAccount(request);
    const input = deletionSchema.parse(await request.json());
    return Response.json({ deleted: deleteProviderCredential(account.accountId, input.providerId) });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Choose a valid provider." }, { status: 400 });
    }
    return Response.json({ error: "The provider connection could not be removed." }, { status: 500 });
  }
}
