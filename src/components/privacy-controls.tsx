"use client";

import { useState } from "react";

const confirmationPhrase = "DELETE MY WORKBENCH DATA";

export function PrivacyControls() {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();

  async function clearWorkbenchData(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice(undefined); setError(undefined);
    try {
      const response = await fetch("/api/account/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json() as {
        error?: string;
        deleted?: { providerConnections: number; experiments: number; methodProgress: number };
      };
      if (!response.ok || !result.deleted) throw new Error(result.error || "Workbench data could not be deleted.");
      const total = result.deleted.providerConnections + result.deleted.experiments + result.deleted.methodProgress;
      setConfirmation("");
      setNotice(`${total} optional record${total === 1 ? "" : "s"} deleted. Account and payment records were retained.`);
      window.dispatchEvent(new Event("tokengauge:workbench-cleared"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workbench data could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-stack" aria-labelledby="privacy-controls-title">
      <div className="settings-intro">
        <div><span className="eyebrow">PRIVACY CONTROLS</span><h2 id="privacy-controls-title">Export it or erase it.</h2></div>
        <p>Download the account data TokenGauge can associate with you, or remove every optional provider connection, experiment total, and method status from the active database in one operation.</p>
      </div>
      {notice ? <p className="form-notice" role="status">{notice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="settings-grid privacy-settings-grid">
        <article className="settings-card">
          <h3>Download my data</h3>
          <p>The JSON export includes profile data, plan history, key hints and non-secret provider configuration, experiment totals, and method statuses. It never contains an API key or its encrypted value.</p>
          <a className="button button-dark" href="/api/account/data" download>Download JSON</a>
        </article>
        <form className="settings-card account-form privacy-delete-card" onSubmit={(event) => void clearWorkbenchData(event)}>
          <h3>Clear workbench data</h3>
          <p>This removes provider credentials, experiment metadata, and method statuses from the active database. Mode-600 operational backups follow a 14-day retention schedule and are pruned daily. Login security, plan/payment records, and your Launch 100 place remain.</p>
          <label>Type <code>{confirmationPhrase}</code>
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} required />
          </label>
          <button className="button button-danger" type="submit" disabled={busy || confirmation !== confirmationPhrase}>{busy ? "Deleting…" : "Delete workbench data"}</button>
        </form>
        <article className="settings-card">
          <h3>Delete the whole account</h3>
          <p>Full account deletion may require separating records retained for refunds, fraud prevention, accounting, or legal obligations. Email from the address on the account and we will confirm the exact deletion scope.</p>
          <a className="text-link" href="mailto:accounts@enby.fish?subject=TokenGauge%20account%20deletion">Request full deletion <span>→</span></a>
        </article>
      </div>
    </section>
  );
}
