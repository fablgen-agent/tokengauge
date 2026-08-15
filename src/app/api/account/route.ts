import { getChatGPTContext, getOwnerAccountContext } from "@/lib/access";
import { authEmailReady } from "@/lib/auth-email";
import { entitlementCredit, launchOfferStatus, linkedChatGPTAccount } from "@/lib/db";
import { getPublicRuntimeStatus } from "@/lib/env";
import { launchPricesGbp } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const [owner, chatgpt] = await Promise.all([
    getOwnerAccountContext(request),
    getChatGPTContext(request),
  ]);
  const runtimeStatus = getPublicRuntimeStatus();
  const linked = owner ? linkedChatGPTAccount(owner.accountId) : undefined;
  const offer = launchOfferStatus(owner?.accountId);
  const credit = owner ? entitlementCredit(owner.accountId) : undefined;

  return Response.json(
    {
      authenticated: Boolean(owner),
      accountKind: owner?.kind,
      user: owner
        ? {
            name: owner.name,
            email: owner.email,
            emailVerified: owner.emailVerified,
            twoFactorEnabled: owner.twoFactorEnabled,
          }
        : undefined,
      pro: owner?.pro ?? false,
      accessPlan: owner?.accessPlan ?? "free",
      launchOffer: { ...offer, pricesGbp: launchPricesGbp },
      upgradeCreditGbp: credit?.currency === "gbp" ? credit.amountPaid / 100 : 0,
      accountSystemReady: authEmailReady(),
      chatgpt: {
        connected: Boolean(chatgpt),
        plan: chatgpt?.plan,
        linked: owner?.kind === "chatgpt_linked" || Boolean(chatgpt && linked === chatgpt.accountId),
        legacyPro: Boolean(chatgpt?.pro),
      },
      ...runtimeStatus,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
