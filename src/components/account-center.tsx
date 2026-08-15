"use client";

import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { AccountPanel } from "@/components/account-panel";
import { ChatGPTPanel } from "@/components/chatgpt-panel";

type Enrollment = { totpURI: string; backupCodes: string[] };

function messageOf(error: { message?: string; code?: string } | null | undefined, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "EMAIL_NOT_VERIFIED") return "Verify your email before signing in. A fresh link has been requested.";
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") return "Email or password is incorrect.";
  return error.message || fallback;
}

export function AccountCenter({ accountSystemReady }: { accountSystemReady: boolean }) {
  const session = authClient.useSession();
  const [mode, setMode] = useState<"sign-in" | "create" | "forgot">("sign-in");
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment>();
  const [qrCode, setQrCode] = useState<string>();

  useEffect(() => {
    if (!enrollment) return;
    void QRCode.toDataURL(enrollment.totpURI, { width: 220, margin: 1, color: { dark: "#151816", light: "#fffef8" } })
      .then(setQrCode)
      .catch(() => setQrCode(undefined));
  }, [enrollment]);

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    setBusy(true); setError(undefined); setNotice(undefined);
    try {
      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/account/reset-password" });
        if (result.error) throw result.error;
        setNotice("If that address has an account, a password-reset link is on its way.");
      } else if (mode === "create") {
        const result = await authClient.signUp.email({ email, password, name, callbackURL: "/account" });
        if (result.error) throw result.error;
        setNotice("Check your inbox for the verification link. It expires in one hour.");
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/account" });
        if (result.error) {
          throw result.error;
        }
        await session.refetch();
      }
    } catch (cause) {
      setError(messageOf(cause as { message?: string; code?: string }, "The account request failed."));
    } finally {
      setBusy(false);
    }
  }

  async function enableTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") || "");
    setBusy(true); setError(undefined); setNotice(undefined);
    const result = await authClient.twoFactor.enable({ password, issuer: "TokenGauge" });
    setBusy(false);
    if (result.error) return setError(messageOf(result.error, "Two-factor setup could not start."));
    setEnrollment(result.data);
  }

  async function verifyEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") || "").replace(/\s/g, "");
    setBusy(true); setError(undefined);
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setBusy(false);
    if (result.error) return setError(messageOf(result.error, "That code was not accepted."));
    setEnrollment(enrollment ? { totpURI: "", backupCodes: enrollment.backupCodes } : undefined);
    setQrCode(undefined); setNotice("Two-factor authentication is active. Store the recovery codes somewhere safe.");
    await session.refetch();
  }

  async function manageTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const action = form.get("action") === "disable" ? "disable" : "backup";
    setBusy(true); setError(undefined); setNotice(undefined);
    const result = action === "disable"
      ? await authClient.twoFactor.disable({ password })
      : await authClient.twoFactor.generateBackupCodes({ password });
    setBusy(false);
    if (result.error) return setError(messageOf(result.error, "The security change failed."));
    if (action === "backup" && "backupCodes" in result.data) {
      setEnrollment({ totpURI: "", backupCodes: result.data.backupCodes as string[] });
      setNotice("New recovery codes created. All previous recovery codes are now invalid.");
    } else {
      setEnrollment(undefined); setNotice("Two-factor authentication is disabled.");
      await session.refetch();
    }
  }

  if (session.isPending) return <div className="account-card"><p>Loading account…</p></div>;

  if (!session.data?.user) {
    return (
      <div className="account-layout">
        <section className="account-card auth-card">
          <div className="account-tabs" role="tablist" aria-label="Account action">
            <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => setMode("sign-in")}>Sign in</button>
            <button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>Create account</button>
          </div>
          <h2>{mode === "create" ? "Create your TokenGauge account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
          {mode === "create" && !accountSystemReady ? <p className="form-error">Verified-email signup is not live yet. The account UI and security layer are ready; outbound mail is awaiting its enby.fish sender.</p> : null}
          <form className="account-form" onSubmit={submitCredentials}>
            {mode === "create" ? <label>Name<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label> : null}
            <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
            {mode !== "forgot" ? <label>Password<input name="password" type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={12} maxLength={128} required /><small>At least 12 characters.</small></label> : null}
            <button className="button button-lime" type="submit" disabled={busy || (mode === "create" && !accountSystemReady)}>{busy ? "Working…" : mode === "create" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</button>
          </form>
          <button className="text-button" type="button" onClick={() => setMode(mode === "forgot" ? "sign-in" : "forgot")}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</button>
          {notice ? <p className="form-notice" role="status">{notice}</p> : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </section>
        <aside className="account-card security-summary"><span className="eyebrow eyebrow-lime">ACCOUNT SECURITY</span><h2>One identity for access and billing.</h2><ul><li>Verified email before sign-in</li><li>12-character minimum password with scrypt hashing</li><li>Authenticator-app 2FA and one-use recovery codes</li><li>Rate-limited sign-in and recovery endpoints</li></ul></aside>
      </div>
    );
  }

  const user = session.data.user as typeof session.data.user & { twoFactorEnabled?: boolean };
  return (
    <div className="account-layout">
      <section className="account-card account-profile">
        <span className="eyebrow eyebrow-lime">TOKEN GAUGE ACCOUNT</span>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <div className="account-badges"><span>✓ Email verified</span><span>{user.twoFactorEnabled ? "✓ 2FA active" : "2FA optional"}</span></div>
        <div className="security-actions"><Link className="button button-lime" href="/dashboard">Dashboard</Link><Link className="button button-dark" href="/settings">Settings</Link><button className="text-button" type="button" onClick={() => void authClient.signOut().then(() => session.refetch())}>Sign out</button></div>
      </section>

      <section className="account-card security-card">
        <span className="eyebrow">TWO-FACTOR AUTHENTICATION</span>
        <h2>{user.twoFactorEnabled ? "Authenticator protection is on." : "Add an authenticator app."}</h2>
        {!user.twoFactorEnabled && !enrollment ? (
          <form className="account-form" onSubmit={enableTwoFactor}><label>Confirm password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button button-lime" type="submit" disabled={busy}>Start 2FA setup</button></form>
        ) : null}
        {enrollment?.totpURI ? (
          <div className="two-factor-enrollment">
            <p>Scan this code, save every recovery code, then enter the six-digit code from your app.</p>
            {qrCode ? <Image src={qrCode} alt="TokenGauge authenticator setup QR code" width={220} height={220} unoptimized /> : <code>{enrollment.totpURI}</code>}
            <RecoveryCodes codes={enrollment.backupCodes} />
            <form className="account-form inline-form" onSubmit={verifyEnrollment}><label>Authenticator code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" required /></label><button className="button button-lime" type="submit" disabled={busy}>Verify and enable</button></form>
          </div>
        ) : null}
        {user.twoFactorEnabled ? (
          <form className="account-form" onSubmit={manageTwoFactor}><label>Confirm password<input name="password" type="password" autoComplete="current-password" required /></label><div className="security-actions"><button className="button button-dark" type="submit" name="action" value="backup" disabled={busy}>Replace recovery codes</button><button className="text-button danger" type="submit" name="action" value="disable" disabled={busy}>Disable 2FA</button></div></form>
        ) : null}
        {enrollment && !enrollment.totpURI ? <RecoveryCodes codes={enrollment.backupCodes} /> : null}
        {notice ? <p className="form-notice" role="status">{notice}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </section>

      <section className="account-card connection-card"><span className="eyebrow">OPTIONAL LAB CONNECTION</span><h2>ChatGPT is separate.</h2><p>Connect only when you want the A/B lab to use models available on your ChatGPT plan. If your earlier test purchase belongs to ChatGPT, explicitly move it to this verified account here.</p><ChatGPTPanel compact /><AccountPanel compact /></section>
    </div>
  );
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  return <div className="recovery-codes"><strong>Recovery codes — each works once</strong><ul>{codes.map((code) => <li key={code}><code>{code}</code></li>)}</ul><p>Copy these now. TokenGauge will not email them to you.</p></div>;
}
