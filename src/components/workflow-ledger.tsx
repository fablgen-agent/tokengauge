"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatUsd, getSelectableModelPrices } from "@/lib/costs";
import { calculateWorkflowLedger, parseWorkflowLedgerCsv, workflowLedgerCsvHeaders } from "@/lib/workflow-ledger";

type EditableRow = {
  id: string;
  project: string;
  workflow: string;
  priceId: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  attempts: number;
  acceptedAnswers: number;
};

const prices = getSelectableModelPrices();
const defaultPriceId = prices.find((price) => price.id === "openai:gpt-5.6-terra:standard:short")?.id ?? prices[0].id;
const secondaryPriceId = prices.find((price) => price.id === "anthropic:claude-haiku-4.5:standard")?.id ?? defaultPriceId;
const priceIds = new Set(prices.map((price) => price.id));

function sampleRows(): EditableRow[] {
  return [
    { id: "sample-support", project: "Example SaaS", workflow: "Support replies", priceId: defaultPriceId, inputTokens: 2_000_000, cachedInputTokens: 600_000, outputTokens: 300_000, attempts: 1_000, acceptedAnswers: 850 },
    { id: "sample-extraction", project: "Example SaaS", workflow: "Document extraction", priceId: secondaryPriceId, inputTokens: 1_200_000, cachedInputTokens: 0, outputTokens: 120_000, attempts: 500, acceptedAnswers: 470 },
  ];
}

export function WorkflowLedger() {
  const [rows, setRows] = useState<EditableRow[]>(sampleRows);
  const [error, setError] = useState<string>();
  const ledger = useMemo(() => calculateWorkflowLedger(rows.map((row) => ({
    ...row,
    price: prices.find((price) => price.id === row.priceId) ?? prices[0],
  }))), [rows]);

  function updateRow(id: string, patch: Partial<EditableRow>) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  }

  function addRow() {
    setRows((current) => [...current, { id: `row-${Date.now()}`, project: "", workflow: "", priceId: defaultPriceId, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, attempts: 0, acceptedAnswers: 0 }]);
  }

  async function loadCsv(file: File | undefined) {
    if (!file) return;
    try {
      const imported = parseWorkflowLedgerCsv(await file.text(), priceIds);
      setRows(imported);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The CSV could not be read.");
    }
  }

  function exportCsv() {
    const body = [workflowLedgerCsvHeaders.join(","), ...rows.map((row) => [
      row.project,
      row.workflow,
      row.priceId,
      row.inputTokens,
      row.cachedInputTokens,
      row.outputTokens,
      row.attempts,
      row.acceptedAnswers,
    ].map(csvField).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tokengauge-workflow-ledger.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ledger-tool">
      <div className="ledger-toolbar">
        <div><strong>Replace the sample rows with aggregate workflow totals.</strong><p>Use one row per project, workflow, and exact price band. The values never leave this page.</p></div>
        <div className="ledger-toolbar-actions">
          <label className="button button-dark ledger-file-button">Import canonical CSV<input type="file" accept=".csv,text/csv" onChange={(event) => void loadCsv(event.target.files?.[0])} /></label>
          <button className="button ledger-outline-button" type="button" onClick={exportCsv}>Export current CSV</button>
          <button className="text-button" type="button" onClick={() => { setRows(sampleRows()); setError(undefined); }}>Reset sample</button>
        </div>
      </div>
      <details className="ledger-schema"><summary>Canonical CSV schema and provider-report limits</summary><p><code>{workflowLedgerCsvHeaders.join(",")}</code></p><p>OpenAI organization usage can group by project, user, API key, model, batch, and service tier. Anthropic can group by workspace, API key, model, service tier, and context window. Neither report supplies your application&apos;s workflow label, so add that label in your own request log before aggregating. TokenGauge does not pretend the provider exports are interchangeable.</p></details>
      {error ? <p className="ledger-error" role="alert">{error}</p> : null}
      <div className="ledger-row-list">
        {rows.map((row, index) => <article className="ledger-input-card" key={row.id}>
          <header><span>WORKFLOW {String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => setRows((current) => current.filter((candidate) => candidate.id !== row.id))} aria-label={`Remove ${row.workflow || `workflow ${index + 1}`}`}>Remove</button></header>
          <div className="ledger-fields">
            <LedgerTextField label="Project" value={row.project} onChange={(value) => updateRow(row.id, { project: value })} />
            <LedgerTextField label="Workflow / feature" value={row.workflow} onChange={(value) => updateRow(row.id, { workflow: value })} />
            <label className="ledger-rate-field">Exact provider rate card<select value={row.priceId} onChange={(event) => updateRow(row.id, { priceId: event.target.value })}>{prices.map((price) => <option key={price.id} value={price.id}>{price.providerLabel} · {price.label} · {price.tierLabel}</option>)}</select></label>
            <LedgerNumberField label="Input tokens" value={row.inputTokens} onChange={(value) => updateRow(row.id, { inputTokens: value, cachedInputTokens: Math.min(row.cachedInputTokens, value) })} />
            <LedgerNumberField label="Cached input" value={row.cachedInputTokens} onChange={(value) => updateRow(row.id, { cachedInputTokens: Math.min(value, row.inputTokens) })} />
            <LedgerNumberField label="Output tokens" value={row.outputTokens} onChange={(value) => updateRow(row.id, { outputTokens: value })} />
            <LedgerNumberField label="Attempts" value={row.attempts} onChange={(value) => updateRow(row.id, { attempts: value, acceptedAnswers: Math.min(row.acceptedAnswers, value) })} />
            <LedgerNumberField label="Accepted answers" value={row.acceptedAnswers} onChange={(value) => updateRow(row.id, { acceptedAnswers: Math.min(value, row.attempts) })} />
          </div>
        </article>)}
      </div>
      <button className="button ledger-add-button" type="button" onClick={addRow}>Add workflow row</button>
      <section className="ledger-results" aria-live="polite">
        <div className="ledger-result-heading"><div><span className="eyebrow">WORKFLOW COST LEDGER</span><h3>{formatUsd(ledger.modeledCostUsd)} modeled token spend</h3></div><p>{ledger.largestWorkflow ? <><strong>{ledger.largestWorkflow.workflow}</strong> is the largest row at {ledger.modeledCostUsd > 0 ? (ledger.largestWorkflow.modeledCostUsd / ledger.modeledCostUsd * 100).toFixed(1) : "0.0"}% of modeled spend.</> : "Add a workflow row to begin."}</p></div>
        <div className="ledger-kpis"><div><span>Accepted-answer rate</span><strong>{ledger.acceptanceRatePercentage.toFixed(1)}%</strong><small>{ledger.totalAcceptedAnswers.toLocaleString()} accepted / {ledger.totalAttempts.toLocaleString()} attempts</small></div><div><span>Cost / accepted answer</span><strong>{ledger.costPerAcceptedAnswerUsd === null ? "—" : formatSmallUsd(ledger.costPerAcceptedAnswerUsd)}</strong><small>Across every entered workflow</small></div><div><span>Non-accepted attempt estimate</span><strong>{formatUsd(ledger.nonAcceptedAttemptCostUsd)}</strong><small>Uniform-attempt approximation</small></div></div>
        <div className="ledger-attribution-grid">
          <div><span className="eyebrow">BY WORKFLOW</span>{ledger.rows.map((row) => <article key={row.id}><div><strong>{row.workflow}</strong><small>{row.project} · {row.providerLabel} {row.modelLabel}</small></div><div><b>{formatUsd(row.modeledCostUsd)}</b><small>{row.costPerAcceptedAnswerUsd === null ? "no accepted answers" : `${formatSmallUsd(row.costPerAcceptedAnswerUsd)} / accepted`}</small></div></article>)}</div>
          <div><span className="eyebrow">BY PROJECT</span>{ledger.projects.map((project) => <article key={project.project}><div><strong>{project.project}</strong><small>{project.sharePercentage.toFixed(1)}% of modeled spend</small></div><b>{formatUsd(project.modeledCostUsd)}</b></article>)}</div>
        </div>
        <p className="ledger-caveat">These are rate-card estimates, not an invoice. Map each aggregate to the price band that covered its individual requests. Tools, cache writes/storage, media, regional or priority uplifts, taxes, credits, and provider rounding remain outside rows that do not explicitly represent them.</p>
        <div className="calculator-next-step"><span className="eyebrow">NEXT STEP</span><strong>Test the largest controllable workflow, not the smallest sticker price.</strong><p>Reconcile the provider bill first, then use a bounded method and the same acceptance rule on both variants.</p><div><Link className="button button-lime" href="/audit" data-funnel-event="cta_audit">Reconcile the bill</Link><Link className="text-link" href="/lab" data-funnel-event="cta_lab">Open the A/B lab <span aria-hidden="true">→</span></Link><Link className="text-link" href="/#pricing" data-funnel-event="cta_pricing">Unlock the complete workbench <span aria-hidden="true">→</span></Link></div></div>
      </section>
    </div>
  );
}

function LedgerTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<input type="text" maxLength={80} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function LedgerNumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min="0" step="1" value={value} onChange={(event) => onChange(Math.max(0, Math.trunc(Number(event.target.value) || 0)))} /></label>;
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatSmallUsd(value: number): string {
  return value > 0 && value < .01 ? `$${value.toFixed(4)}` : formatUsd(value);
}
