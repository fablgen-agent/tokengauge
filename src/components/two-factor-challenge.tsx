"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function TwoFactorChallenge() {
  const router = useRouter();
  const [backup, setBackup] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") || "").trim();
    const trustDevice = Boolean(new FormData(event.currentTarget).get("trustDevice"));
    setBusy(true); setError(undefined);
    const result = backup
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice, disableSession: false })
      : await authClient.twoFactor.verifyTotp({ code: code.replace(/\s/g, ""), trustDevice });
    setBusy(false);
    if (result.error) return setError(result.error.message || "That code was not accepted.");
    router.push("/account");
    router.refresh();
  }

  return <section className="account-card challenge-card"><span className="eyebrow eyebrow-lime">SECOND STEP</span><h1>Confirm it’s you.</h1><p>{backup ? "Enter one unused recovery code." : "Enter the current code from your authenticator app."}</p><form className="account-form" onSubmit={verify}><label>{backup ? "Recovery code" : "Authenticator code"}<input name="code" inputMode={backup ? "text" : "numeric"} autoComplete="one-time-code" required autoFocus /></label><label className="check-label"><input name="trustDevice" type="checkbox" /> Trust this device for 30 days</label><button className="button button-lime" type="submit" disabled={busy}>{busy ? "Checking…" : "Verify"}</button></form><button className="text-button" type="button" onClick={() => setBackup(!backup)}>{backup ? "Use authenticator code" : "Use a recovery code"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}</section>;
}
