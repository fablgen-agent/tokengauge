import "server-only";

import { createHmac } from "node:crypto";

import { getChatGPTHandler } from "@/lib/chatgpt";
import { ensureLaunchOffer, linkedProductAccount, planForAccount, upsertUser, userRecord } from "@/lib/db";
import { getLoginSecret } from "@/lib/env";
import { planAtLeast, type PlanId } from "@/lib/plans";
import { billingIdForProductUser, getProductAuth, productAccountId } from "@/lib/product-auth";

export type AuthContext = {
  accountId: string;
  billingUserId: string;
  name?: string;
  email?: string;
  plan?: string;
  accessPlan: PlanId;
  pro: boolean;
  kind: "product" | "chatgpt" | "chatgpt_linked";
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
};

export function billingIdForAccount(accountId: string): string {
  return `tg_${createHmac("sha256", getLoginSecret()).update(accountId).digest("hex")}`;
}

export async function getChatGPTContext(request: Request): Promise<AuthContext | undefined> {
  const session = await getChatGPTHandler().getSession(request);
  if (session.status !== "authenticated" || !session.user?.accountId) return undefined;

  const { accountId, name, email, plan } = session.user;
  const billingUserId = billingIdForAccount(accountId);
  const accessPlan = planForAccount(accountId);
  upsertUser({ accountId, billingUserId, name, email });

  return {
    accountId,
    billingUserId,
    name,
    email,
    plan,
    accessPlan,
    pro: planAtLeast(accessPlan, "pro"),
    kind: "chatgpt",
  };
}

export async function getProductAccountContext(request: Request): Promise<AuthContext | undefined> {
  const session = await getProductAuth().api.getSession({ headers: request.headers });
  if (!session?.user?.id || !session.user.emailVerified) return undefined;

  const accountId = productAccountId(session.user.id);
  const billingUserId = billingIdForProductUser(session.user.id);
  const accessPlan = planForAccount(accountId);
  upsertUser({
    accountId,
    billingUserId,
    name: session.user.name,
    email: session.user.email,
  });

  return {
    accountId,
    billingUserId,
    name: session.user.name,
    email: session.user.email,
    accessPlan,
    pro: planAtLeast(accessPlan, "pro"),
    kind: "product",
    emailVerified: session.user.emailVerified,
    twoFactorEnabled: Boolean(session.user.twoFactorEnabled),
  };
}

export async function getOwnerAccountContext(request: Request): Promise<AuthContext | undefined> {
  const product = await getProductAccountContext(request);
  if (product) {
    ensureLaunchOffer(product.accountId);
    return product;
  }

  const chatgpt = await getChatGPTContext(request);
  if (!chatgpt) return undefined;
  const linkedAccountId = linkedProductAccount(chatgpt.accountId);
  if (!linkedAccountId) {
    ensureLaunchOffer(chatgpt.accountId);
    return chatgpt;
  }

  const linkedUser = userRecord(linkedAccountId);
  if (!linkedUser) {
    ensureLaunchOffer(chatgpt.accountId);
    return chatgpt;
  }
  const accessPlan = planForAccount(linkedAccountId);
  ensureLaunchOffer(linkedAccountId);
  return {
    accountId: linkedAccountId,
    billingUserId: linkedUser.billing_user_id,
    name: linkedUser.name ?? chatgpt.name,
    email: linkedUser.email ?? chatgpt.email,
    plan: chatgpt.plan,
    accessPlan,
    pro: planAtLeast(accessPlan, "pro"),
    kind: "chatgpt_linked",
    emailVerified: true,
  };
}

export async function getAuthContext(request: Request): Promise<AuthContext | undefined> {
  return getOwnerAccountContext(request);
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const context = await getAuthContext(request);
  if (!context) throw new Response("Sign in first.", { status: 401 });
  return context;
}

export async function requireProductAccount(request: Request): Promise<AuthContext> {
  const context = await getProductAccountContext(request);
  if (!context) throw new Response("Sign in to your verified TokenGauge account first.", { status: 401 });
  return context;
}

export async function requireOwnerAccount(request: Request): Promise<AuthContext> {
  const context = await getOwnerAccountContext(request);
  if (!context) throw new Response("Sign in with ChatGPT or a verified TokenGauge account first.", { status: 401 });
  return context;
}

export async function requireChatGPT(request: Request): Promise<AuthContext> {
  const context = await getChatGPTContext(request);
  if (!context) throw new Response("Connect ChatGPT first.", { status: 401 });
  return context;
}

export async function requirePro(request: Request): Promise<AuthContext> {
  const context = await requireAuth(request);
  if (!context.pro) throw new Response("TokenGauge Pro is required.", { status: 403 });
  return context;
}
