import "server-only";

import { createHmac } from "node:crypto";

import { getChatGPTHandler } from "@/lib/chatgpt";
import { hasEntitlement, upsertUser } from "@/lib/db";
import { getLoginSecret } from "@/lib/env";
import { billingIdForProductUser, getProductAuth, productAccountId } from "@/lib/product-auth";

export type AuthContext = {
  accountId: string;
  billingUserId: string;
  name?: string;
  email?: string;
  plan?: string;
  pro: boolean;
  kind: "product" | "chatgpt";
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
  upsertUser({ accountId, billingUserId, name, email });

  return {
    accountId,
    billingUserId,
    name,
    email,
    plan,
    pro: hasEntitlement(accountId),
    kind: "chatgpt",
  };
}

export async function getProductAccountContext(request: Request): Promise<AuthContext | undefined> {
  const session = await getProductAuth().api.getSession({ headers: request.headers });
  if (!session?.user?.id || !session.user.emailVerified) return undefined;

  const accountId = productAccountId(session.user.id);
  const billingUserId = billingIdForProductUser(session.user.id);
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
    pro: hasEntitlement(accountId),
    kind: "product",
    emailVerified: session.user.emailVerified,
    twoFactorEnabled: Boolean(session.user.twoFactorEnabled),
  };
}

export async function getAuthContext(request: Request): Promise<AuthContext | undefined> {
  return (await getProductAccountContext(request)) ?? getChatGPTContext(request);
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
