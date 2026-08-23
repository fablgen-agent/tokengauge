"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildBillAuditReport, calculateBillAudit } from "@/lib/bill-audit";
import { formatRate, formatUsd, getSelectableModelPrices, priceSnapshotDate } from "@/lib/costs";
import { sendFunnelEvent } from "@/components/funnel-tracker";

const selectablePrices = getSelectableModelPrices();
const defaultPrice = selectablePrices.find((price) => price.id === "openai:gpt-5.6-terra:standard:short") ?? selectablePrices[0];

export function BillAudit() {
  const [priceId, setPriceId] = useState(defaultPrice.id);
  const [inputTokens, setInputTokens] = useState(30_000_000);
  const [cachedInputTokens, setCachedInputTokens] = useState(9_000_000);
  const [outputTokens, setOutputTokens] = useState(5_000_000);
  const [attempts, setAttempts] = useState(10_000);
  const [acceptedAnswers, setAcceptedAnswers] = useState(8_500);
  const [reportedBillUsd, setReportedBillUsd] = useState(110);
  const [reportStatus, setReportStatus] = useState<string>();

  const price = selectablePrices.find((candidate) => candidate.id === priceId) ?? defaultPrice;
  const result = useMemo(() => calculateBillAudit(price, {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    attempts,
    acceptedAnswers,
    reportedBillUsd,
  }), [acceptedAnswers, attempts, cachedInputTokens, inputTokens, outputTokens, price, reportedBillUsd]);
  const unexplained = Math.abs(result.invoiceVarianceUsd);
  const varianceLabel = result.invoiceVarianceUsd >= 0 ? "Bill above token model" : "Bill below token model";
  const report = useMemo(() => buildBillAuditReport({
    providerLabel: price.providerLabel,
    modelLabel: price.label,
    tierLabel: price.tierLabel,
    region: price.region,
    snapshotDate: priceSnapshotDate,
  }, { inputTokens, cachedInputTokens, outputTokens, attempts, acceptedAnswers, reportedBillUsd }, result), [acceptedAnswers, attempts, cachedInputTokens, inputTokens, outputTokens, price, reportedBillUsd, result]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setReportStatus("Handoff copied. Review it before sharing.");
      sendFunnelEvent("audit_report_copy");
    } catch {
      setReportStatus("Copy was blocked by the browser. Download the text report instead.");
    }
  }

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([`${report}\n`], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tokengauge-bill-audit.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setReportStatus("Text report downloaded. Review it before sharing.");
    sendFunnelEvent("audit_report_download");
  }

  return (
    <div className="calculator-shell bill-audit-shell">
      <div className="calculator-controls">
        <label className="audit-wide-field">Provider and exact rate card<select value={priceId} onChange={(event) => setPriceId(event.target.value)}>{selectablePrices.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.providerLabel} · {candidate.label} · {candidate.tierLabel}</option>)}</select></label>
        <AuditNumberField label="Total billed input tokens" value={inputTokens} onChange={setInputTokens} />
        <AuditNumberField label="Cached input tokens" value={cachedInputTokens} onChange={setCachedInputTokens} />
        <AuditNumberField label="Output tokens" value={outputTokens} onChange={setOutputTokens} />
        <AuditNumberField label="Total model attempts" value={attempts} onChange={setAttempts} />
        <AuditNumberField label="Accepted answers" value={acceptedAnswers} onChange={setAcceptedAnswers} />
        <AuditNumberField label="Provider bill in USD" value={reportedBillUsd} step="0.01" onChange={setReportedBillUsd} />
        <p className="audit-local-note"><strong>Browser-local calculation.</strong> Token totals and bill values are not submitted to TokenGauge or stored.</p>
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">AGGREGATE BILL RECONCILIATION</span>
        <div className="selected-rate"><strong>{price.providerLabel} · {price.label}</strong><span>{price.tierLabel}: {formatRate(price.inputPerMillionUsd)} input · {formatRate(price.cachedInputPerMillionUsd)} cache read · {formatRate(price.outputPerMillionUsd)} output / 1M</span><small>{price.region} · choose the rate card that actually covered each request</small></div>
        <div className="cost-comparison"><div><small>Modeled token spend</small><strong>{formatUsd(result.modeledTokenCostUsd)}</strong></div><span aria-hidden="true">↔</span><div><small>Reported provider bill</small><strong>{formatUsd(reportedBillUsd)}</strong></div></div>
        <div className={`savings-pill ${result.invoiceVarianceUsd > 0 ? "negative" : ""}`}>{varianceLabel}: {formatUsd(unexplained)}{result.invoiceVariancePercentage !== null ? ` (${Math.abs(result.invoiceVariancePercentage).toFixed(1)}%)` : ""}</div>
        <div className="audit-breakdown">
          <span className="eyebrow">MODELED COST DRIVERS</span>
          <dl><div><dt>Uncached input</dt><dd>{formatUsd(result.uncachedInputCostUsd)}</dd></div><div><dt>Cached input</dt><dd>{formatUsd(result.cachedInputCostUsd)}</dd></div><div><dt>Output</dt><dd>{formatUsd(result.outputCostUsd)}</dd></div><div><dt>Cache share</dt><dd>{result.cacheSharePercentage.toFixed(1)}%</dd></div></dl>
          <p><strong>{sentenceCase(result.dominantDriver)} is the largest modeled token-cost bucket.</strong> {!result.cacheRatePublished ? "This rate card does not publish a cache-read price, so cached tokens are conservatively priced as ordinary input." : "A published cache-read rate is applied only to the cached-input bucket."}</p>
        </div>
        <div className="accepted-economics">
          <span className="eyebrow">QUALITY AND RETRIES</span>
          <div className="accepted-cost-grid"><div><small>Accepted-answer rate</small><strong>{result.acceptanceRatePercentage.toFixed(1)}%</strong><span>{Math.min(acceptedAnswers, attempts).toLocaleString()} accepted of {attempts.toLocaleString()} attempts</span></div><div><small>Modeled cost / accepted answer</small><strong>{result.costPerAcceptedAnswerUsd === null ? "—" : formatSmallUsd(result.costPerAcceptedAnswerUsd)}</strong><span>{result.costPerAttemptUsd === null ? "No attempts entered" : `${formatSmallUsd(result.costPerAttemptUsd)} per attempt`}</span></div></div>
          <p className="quality-loses">Uniform-attempt estimate: {formatUsd(result.nonAcceptedAttemptCostUsd)} of modeled spend sits on non-accepted attempts. Real retry cost needs retry-specific token buckets.</p>
        </div>
        <p>The variance is a diagnostic gap, not proof of overbilling. Tools, cache writes/storage, images, audio, regional or priority uplifts, taxes, credits, rounding, and mixed price bands can explain it.</p>
        <a className="rate-source" href={price.sourceUrl} target="_blank" rel="noreferrer">{price.sourceLabel} ↗</a>
        <div className="audit-handoff">
          <div><span className="eyebrow">PRIVATE HANDOFF</span><strong>Take the diagnosis with you.</strong><p>Create a plain-text summary of the aggregate values and modeled result. It is generated in this browser; TokenGauge does not receive the report.</p></div>
          <div className="audit-handoff-actions">
            <button className="button button-dark" type="button" onClick={() => void copyReport()}>Copy handoff</button>
            <button className="text-button" type="button" onClick={downloadReport}>Download .txt</button>
          </div>
          {reportStatus ? <p className="audit-report-status" role="status">{reportStatus}</p> : null}
        </div>
        <div className="calculator-next-step"><span className="eyebrow">NEXT STEP</span><strong>Attribute the biggest bucket, then test it without relaxing quality.</strong><p>Split aggregate spend by project and workflow, choose a bounded intervention, then compare identical tasks before calling the modeled overhead a saving.</p><div><Link className="button button-lime" href="/ledger" data-funnel-event="cta_ledger">Attribute by workflow</Link><Link className="text-link" href="/lab" data-funnel-event="cta_lab">Run a controlled test <span aria-hidden="true">→</span></Link><Link className="text-link" href="/#pricing" data-funnel-event="cta_pricing">Unlock the complete workbench <span aria-hidden="true">→</span></Link></div></div>
        <div className="audit-service-path"><div><span className="eyebrow eyebrow-lime">FIXED-SCOPE IMPLEMENTATION</span><strong>Need this attribution inside the application?</strong><p>Add project and workflow labels to one authorized Node.js or Python model path, with a tested TokenGauge-compatible export.</p></div><Link className="button button-lime" href="/services/attribution" data-funnel-event="cta_audit_service">See the £75 scope</Link></div>
      </div>
    </div>
  );
}

function AuditNumberField({ label, value, step = "1", onChange }: { label: string; value: number; step?: string; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} /></label>;
}

function formatSmallUsd(value: number): string {
  return value > 0 && value < .01 ? `$${value.toFixed(4)}` : formatUsd(value);
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
