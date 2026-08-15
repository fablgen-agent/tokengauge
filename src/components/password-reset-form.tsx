"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function PasswordResetForm({ token }: { token?: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setError("This password-reset link is missing its token.");
    const password = String(new FormData(event.currentTarget).get("password") || "");
    const confirmation = String(new FormData(event.currentTarget).get("confirmation") || "");
    if (password !== confirmation) return setError("The two passwords do not match.");
    setBusy(true); setError(undefined);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (result.error) return setError(result.error.message || "The password could not be reset.");
    setDone(true);
  }

  if (done) return <section className="account-card challenge-card"><h1>Password changed.</h1><p>All other sessions were revoked.</p><Link className="button button-lime" href="/account">Sign in</Link></section>;
  return <section className="account-card challenge-card"><span className="eyebrow eyebrow-lime">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1><form className="account-form" onSubmit={reset}><label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><label>Repeat password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className="button button-lime" type="submit" disabled={busy || !token}>{busy ? "Changing…" : "Change password"}</button></form>{error ? <p className="form-error" role="alert">{error}</p> : null}</section>;
}
