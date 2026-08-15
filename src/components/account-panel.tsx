"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Account = {
  authenticated: boolean;
  user?: { name?: string; email?: string; emailVerified?: boolean; twoFactorEnabled?: boolean };
  pro: boolean;
  accountSystemReady: boolean;
  chatgpt: { connected: boolean; plan?: string; linked: boolean; legacyPro: boolean };
  stripeMode: "test" | "live";
  checkoutReady: boolean;
};

export function AccountPanel({ compact = false }: { compact?: boolean }) {
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

  async function checkout() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
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
        account.pro ? (
          <div className="entitled-note">
            <span>Pro access active</span>
            <Link className="button button-lime" href="/library">Open the library</Link>
          </div>
        ) : account.chatgpt.connected && account.chatgpt.legacyPro ? (
          <div className="checkout-stack">
            <button className="button button-lime" type="button" disabled={busy} onClick={linkChatGPT}>
              {busy ? "Linking access…" : "Move existing Pro access here"}
            </button>
            <small>Links the currently connected ChatGPT identity to this verified TokenGauge account.</small>
          </div>
        ) : (
          <div className="checkout-stack">
            <button className="button button-lime" type="button" disabled={busy || !account.checkoutReady} onClick={checkout}>
              {busy ? "Opening secure checkout…" : account.checkoutReady ? "Get Pro access — £9 once" : "Checkout setup in progress"}
            </button>
            <small>{account.stripeMode === "test" ? "Test mode — no real charges" : "One-time payment via Stripe"}</small>
          </div>
        )
      ) : account?.pro && account.chatgpt.legacyPro ? (
        <div className="checkout-stack">
          <span className="status-chip">Pro currently attached to ChatGPT</span>
          <Link className="button button-lime" href="/account">Create an account and move access</Link>
        </div>
      ) : (
        <div className="checkout-stack">
          <Link className="button button-lime" href="/account">{account?.accountSystemReady ? "Create or sign in" : "TokenGauge account"}</Link>
          <small>{account?.accountSystemReady ? "Verified email required before checkout" : "Verified-email signup is being connected"}</small>
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
