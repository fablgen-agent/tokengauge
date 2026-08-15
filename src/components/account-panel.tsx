"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { planAtLeast, planDefinition, type PaidPlanId, type PlanId } from "@/lib/plans";

type Account = {
  authenticated: boolean;
  accountKind?: "product" | "chatgpt" | "chatgpt_linked";
  user?: { name?: string; email?: string; emailVerified?: boolean; twoFactorEnabled?: boolean };
  pro: boolean;
  accessPlan: PlanId;
  accountSystemReady: boolean;
  chatgpt: { connected: boolean; plan?: string; linked: boolean; legacyPro: boolean };
  stripeMode: "test" | "live";
  checkoutReady: boolean;
  checkoutPlans: Record<PaidPlanId, boolean>;
  launchCheckoutReady: boolean;
  launchOffer: { limit: number; joined: number; remaining: number; eligible: boolean; ordinal?: number; pricesGbp: Record<PaidPlanId, number> };
  upgradeCreditGbp: number;
};

export function AccountPanel({ compact = false, targetPlan = "pro" }: { compact?: boolean; targetPlan?: PaidPlanId }) {
  const [account, setAccount] = useState<Account>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignored = false;
    void loadAccount().then((nextAccount) => {
      if (!ignored && nextAccount) setAccount(nextAccount);
    });
    return () => { ignored = true; };
  }, []);

  const target = planDefinition(targetPlan);
  const upgradePrice = account ? Math.max(0, target.priceGbp - planDefinition(account.accessPlan).priceGbp) : target.priceGbp;
  const usesLaunchOffer = Boolean(account?.launchOffer?.eligible);
  const targetPrice = usesLaunchOffer ? account!.launchOffer.pricesGbp[targetPlan] : target.priceGbp;
  const checkoutPrice = account ? Math.max(0, targetPrice - account.upgradeCreditGbp) : upgradePrice;
  const checkoutConfigured = usesLaunchOffer ? account?.launchCheckoutReady : account?.checkoutPlans?.[targetPlan];

  async function checkout() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: targetPlan }) });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout could not be started.");
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout could not be started.");
      setBusy(false);
    }
  }

  async function linkChatGPT() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/account/link-chatgpt", { method: "POST" });
      const data = (await response.json()) as { linked?: boolean; reason?: string; error?: string };
      if (!response.ok || !data.linked) throw new Error(data.reason || data.error || "The accounts could not be linked.");
      const refreshed = await loadAccount();
      if (refreshed) setAccount(refreshed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The accounts could not be linked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`account-panel ${compact ? "compact" : ""}`}>
      {account?.authenticated ? (
        planAtLeast(account.accessPlan, targetPlan) ? (
          <div className="entitled-note">
            <span>{target.name} access active</span>
            <Link className="button button-lime" href={targetPlan === "pro" ? "/library" : "/dashboard"}>Open {targetPlan === "pro" ? "the library" : "dashboard"}</Link>
          </div>
        ) : targetPlan === "pro" && account.chatgpt.connected && account.chatgpt.legacyPro ? (
          <div className="checkout-stack">
            <button className="button button-lime" type="button" disabled={busy} onClick={linkChatGPT}>
              {busy ? "Linking access…" : "Move existing Pro access here"}
            </button>
            <small>Links the currently connected ChatGPT identity to this verified TokenGauge account.</small>
          </div>
        ) : (
          <div className="checkout-stack">
            <button className="button button-lime" type="button" disabled={busy || !checkoutConfigured} onClick={checkout}>
              {busy ? "Opening secure checkout…" : checkoutConfigured ? `${account.accessPlan === "free" ? "Get" : "Upgrade to"} ${target.name} — £${checkoutPrice} once` : "Checkout setup in progress"}
            </button>
            <small>{account.stripeMode === "test" ? "Test mode — no real charges" : usesLaunchOffer ? `Launch offer secured as signup ${account.launchOffer.ordinal} of ${account.launchOffer.limit}` : account.accessPlan === "free" ? "One-time payment via Stripe" : "Your existing paid tier is credited automatically"}</small>
          </div>
        )
      ) : targetPlan === "pro" && account?.pro && account.chatgpt.legacyPro ? (
        <div className="checkout-stack">
          <span className="status-chip">Pro currently attached to ChatGPT</span>
          <Link className="button button-lime" href="/account">Create an account and move access</Link>
        </div>
      ) : (
        <div className="checkout-stack">
          <Link className="button button-lime" href="/account">{account?.accountSystemReady ? "Create or sign in" : "TokenGauge account"}</Link>
          <small>{account?.accountSystemReady ? "Continue with ChatGPT or verified email before checkout" : "ChatGPT sign-in is available"}</small>
        </div>
      )}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}

async function loadAccount(): Promise<Account | undefined> {
  const response = await fetch("/api/account", { cache: "no-store" });
  return response.ok ? (await response.json()) as Account : undefined;
}
