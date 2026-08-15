"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProviderView = {
  id: string;
  label: string;
  minimumPlan: "pro_plus" | "ultimate";
  keyUrl: string;
  allowed: boolean;
  connection?: { keyHint: string; configuration: Record<string, string>; updatedAt: number };
  configuration?: {
    name: "region";
    label: string;
    options: readonly { value: string; label: string }[];
    defaultValue: string;
  };
};

type ProviderResponse = { plan: string; providers: ProviderView[]; error?: string };

export function ProviderSettings() {
  const [data, setData] = useState<ProviderResponse>();
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  async function load() {
    const response = await fetch("/api/account/providers", { cache: "no-store" });
    const next = await response.json() as ProviderResponse;
    if (!response.ok) throw new Error(next.error || "Provider connections could not be loaded.");
    setData(next);
  }

  useEffect(() => {
    let ignored = false;
    void fetch("/api/account/providers", { cache: "no-store" })
      .then(async (response) => {
        const next = await response.json() as ProviderResponse;
        if (!response.ok) throw new Error(next.error || "Provider connections could not be loaded.");
        if (!ignored) setData(next);
      })
      .catch((cause) => {
        if (!ignored) setError(cause instanceof Error ? cause.message : "Provider connections could not be loaded.");
      });
    return () => { ignored = true; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>, providerId: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const apiKey = String(form.get("apiKey") || "");
    const region = String(form.get("region") || "");
    setBusy(providerId); setError(undefined); setNotice(undefined);
    try {
      const response = await fetch("/api/account/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey, configuration: region ? { region } : undefined }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Connection could not be saved.");
      formElement.reset();
      await load();
      setNotice("Connection saved. The plaintext key is no longer available to this browser.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection could not be saved.");
    } finally {
      setBusy(undefined);
    }
  }

  async function remove(providerId: string) {
    setBusy(providerId); setError(undefined); setNotice(undefined);
    try {
      const response = await fetch("/api/account/providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Connection could not be removed.");
      await load();
      setNotice("Provider credential removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection could not be removed.");
    } finally {
      setBusy(undefined);
    }
  }

  if (!data && !error) return <section className="settings-card"><p>Loading provider connections…</p></section>;

  return (
    <section className="settings-stack" aria-labelledby="provider-settings-title">
      <div className="settings-intro">
        <div><span className="eyebrow">MODEL PROVIDERS</span><h2 id="provider-settings-title">Bring your own API access.</h2></div>
        <p>Keys are encrypted with AES-256-GCM before storage, never returned by the API, and used only for lab requests you initiate. Provider usage is billed directly by the provider.</p>
      </div>
      {notice ? <p className="form-notice" role="status">{notice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="provider-settings-grid">
        {data?.providers.map((provider) => (
          <article className={`provider-setting-card ${provider.connection ? "connected" : ""}`} key={provider.id}>
            <div className="provider-setting-heading">
              <div><h3>{provider.label}</h3><span>{provider.minimumPlan === "ultimate" ? "Ultimate" : "Pro+"}</span></div>
              {provider.connection ? <strong>Connected · ••••{provider.connection.keyHint}</strong> : <strong>Not connected</strong>}
            </div>
            {provider.allowed ? (
              <form className="account-form" onSubmit={(event) => void save(event, provider.id)}>
                {provider.configuration ? (
                  <label>{provider.configuration.label}
                    <select name="region" defaultValue={provider.connection?.configuration[provider.configuration.name] ?? provider.configuration.defaultValue}>
                      {provider.configuration.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ) : null}
                <label>{provider.connection ? "Replace API key" : "API key"}
                  <input name="apiKey" type="password" autoComplete="off" spellCheck={false} minLength={12} maxLength={1000} required />
                </label>
                <div className="provider-setting-actions">
                  <button className="button button-dark" type="submit" disabled={busy === provider.id}>{busy === provider.id ? "Saving…" : provider.connection ? "Replace key" : "Save connection"}</button>
                  {provider.connection ? <button className="text-button danger" type="button" disabled={busy === provider.id} onClick={() => void remove(provider.id)}>Remove</button> : null}
                  <a className="text-link" href={provider.keyUrl} target="_blank" rel="noreferrer">Provider console <span>↗</span></a>
                </div>
              </form>
            ) : (
              <div className="provider-upgrade"><p>Upgrade to {provider.minimumPlan === "ultimate" ? "Ultimate" : "Pro+"} to use this adapter.</p><Link className="button button-dark" href="/#pricing">Compare plans</Link></div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
