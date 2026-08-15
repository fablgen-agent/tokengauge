import "server-only";

import { createHmac } from "node:crypto";

import { getChatGPTHandler } from "@/lib/chatgpt";
import { hasEntitlement, upsertUser } from "@/lib/db";
import { getLoginSecret } from "@/lib/env";

export type AuthContext = {
  accountId: string;
  billingUserId: string;
  name?: string;
  email?: string;
  plan?: string;
  pro: boolean;
};

export function billingIdForAccount(accountId: string): string {
  return `tg_${createHmac("sha256", getLoginSecret()).update(accountId).digest("hex")}`;
}

export async function getAuthContext(request: Request): Promise<AuthContext | undefined> {
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
  };
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const context = await getAuthContext(request);
  if (!context) throw new Response("Sign in with ChatGPT first.", { status: 401 });
  return context;
}

export async function requirePro(request: Request): Promise<AuthContext> {
  const context = await requireAuth(request);
  if (!context.pro) throw new Response("TokenGauge Pro is required.", { status: 403 });
  return context;
}
