"use client";

import { LoginWithChatGPT } from "@opencoredev/loginwithchatgpt-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Account = {
  authenticated: boolean;
  user?: { name?: string; plan?: string };
  pro: boolean;
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

  return (
    <div className={`account-panel ${compact ? "compact" : ""}`}>
      <LoginWithChatGPT
        label="Sign in with ChatGPT"
        consent={{ appName: "TokenGauge", continueLabel: "Connect my ChatGPT plan", securityHref: "/privacy" }}
        onAuthenticated={() => { void loadAccount().then((nextAccount) => nextAccount && setAccount(nextAccount)); }}
      />
      {account?.authenticated ? (
        account.pro ? (
          <div className="entitled-note">
            <span>Pro access active</span>
            <Link className="button button-lime" href="/library">Open the library</Link>
          </div>
        ) : (
          <div className="checkout-stack">
            <button className="button button-lime" type="button" disabled={busy || !account.checkoutReady} onClick={checkout}>
              {busy ? "Opening secure checkout…" : account.checkoutReady ? "Get founding access — £9" : "Checkout setup in progress"}
            </button>
            <small>{account.stripeMode === "test" ? "Test mode — no real charges" : "One-time payment via Stripe"}</small>
          </div>
        )
      ) : <p className="account-explainer">Connect to purchase and run private A/B tests using your own ChatGPT allowance.</p>}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}

async function loadAccount(): Promise<Account | undefined> {
  const response = await fetch("/api/account", { cache: "no-store" });
  return response.ok ? (await response.json()) as Account : undefined;
}
