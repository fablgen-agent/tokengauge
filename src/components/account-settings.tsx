"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

function messageOf(error: { message?: string } | null | undefined, fallback: string): string {
  return error?.message || fallback;
}

export function AccountSettings({ currentName }: { currentName: string }) {
  const session = authClient.useSession();
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") || "").trim();
    setBusy("profile"); setError(undefined); setNotice(undefined);
    const result = await authClient.updateUser({ name });
    setBusy(undefined);
    if (result.error) return setError(messageOf(result.error, "Profile could not be updated."));
    await session.refetch();
    setNotice("Profile updated.");
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    setBusy("password"); setError(undefined); setNotice(undefined);
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setBusy(undefined);
    if (result.error) return setError(messageOf(result.error, "Password could not be changed."));
    formElement.reset();
    setNotice("Password changed. Other sessions were signed out.");
  }

  async function revokeSessions() {
    setBusy("sessions"); setError(undefined); setNotice(undefined);
    const result = await authClient.revokeOtherSessions();
    setBusy(undefined);
    if (result.error) return setError(messageOf(result.error, "Other sessions could not be signed out."));
    setNotice("All other sessions were signed out.");
  }

  return (
    <section className="settings-stack" aria-labelledby="account-settings-title">
      <div className="settings-intro"><div><span className="eyebrow">ACCOUNT SETTINGS</span><h2 id="account-settings-title">Profile and sessions.</h2></div><p>Update your display name, rotate your password, or invalidate other browser sessions.</p></div>
      {notice ? <p className="form-notice" role="status">{notice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="settings-grid">
        <form className="settings-card account-form" onSubmit={updateProfile}><h3>Profile</h3><label>Display name<input name="name" defaultValue={currentName} minLength={2} maxLength={80} required /></label><button className="button button-dark" type="submit" disabled={busy === "profile"}>Save name</button></form>
        <form className="settings-card account-form" onSubmit={changePassword}><h3>Change password</h3><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className="button button-dark" type="submit" disabled={busy === "password"}>Change password</button></form>
        <div className="settings-card"><h3>Active sessions</h3><p>Keep this browser signed in and invalidate every other TokenGauge session.</p><button className="button button-dark" type="button" disabled={busy === "sessions"} onClick={() => void revokeSessions()}>Sign out other sessions</button></div>
      </div>
    </section>
  );
}
