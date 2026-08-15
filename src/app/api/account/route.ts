import { getChatGPTContext, getProductAccountContext } from "@/lib/access";
import { authEmailReady } from "@/lib/auth-email";
import { linkedChatGPTAccount } from "@/lib/db";
import { getPublicRuntimeStatus } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const [product, chatgpt] = await Promise.all([
    getProductAccountContext(request),
    getChatGPTContext(request),
  ]);
  const runtimeStatus = getPublicRuntimeStatus();
  const linked = product ? linkedChatGPTAccount(product.accountId) : undefined;

  return Response.json(
    {
      authenticated: Boolean(product),
      user: product
        ? {
            name: product.name,
            email: product.email,
            emailVerified: product.emailVerified,
            twoFactorEnabled: product.twoFactorEnabled,
          }
        : undefined,
      pro: product?.pro ?? (!product && chatgpt?.pro) ?? false,
      accountSystemReady: authEmailReady(),
      chatgpt: {
        connected: Boolean(chatgpt),
        plan: chatgpt?.plan,
        linked: Boolean(chatgpt && linked === chatgpt.accountId),
        legacyPro: Boolean(chatgpt?.pro),
      },
      ...runtimeStatus,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
