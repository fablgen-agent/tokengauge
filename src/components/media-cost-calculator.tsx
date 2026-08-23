"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { calculateMediaCost, mediaRateCards, type MediaRateCard } from "@/lib/media-costs";

const defaultRate = mediaRateCards.find((card) => card.id === "xai-grok-imagine-image-2-low-1k") ?? mediaRateCards[0];

export function MediaCostCalculator() {
  const [rateId, setRateId] = useState(defaultRate.id);
  const [requests, setRequests] = useState(1_000);
  const [outputUnits, setOutputUnits] = useState(1);
  const [inputImages, setInputImages] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [budget, setBudget] = useState(50);
  const selectedRate = mediaRateCards.find((card) => card.id === rateId) ?? defaultRate;
  const result = useMemo(() => calculateMediaCost(selectedRate, {
    requests,
    outputUnitsPerRequest: outputUnits,
    inputImagesPerRequest: inputImages,
    otherCostPerRequestUsd: otherCost,
    monthlyBudgetUsd: budget,
  }), [budget, inputImages, otherCost, outputUnits, requests, selectedRate]);
  const groupedRates = useMemo(() => Array.from(mediaRateCards.reduce((groups, rate) => {
    const entries = groups.get(rate.providerLabel) ?? [];
    entries.push(rate);
    groups.set(rate.providerLabel, entries);
    return groups;
  }, new Map<string, MediaRateCard[]>())), []);
  const unitLabel = selectedRate.billingUnit === "image" ? "images" : "seconds";
  const overBudget = result.budgetDifferenceUsd < 0;

  return (
    <div className="calculator-shell media-calculator-shell">
      <div className="calculator-controls">
        <label>
          Provider, model, and output tier
          <select value={rateId} onChange={(event) => setRateId(event.target.value)}>
            {groupedRates.map(([provider, rates]) => (
              <optgroup label={provider} key={provider}>
                {rates.map((rate) => <option key={rate.id} value={rate.id}>{rate.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <MediaNumberField label="Requests / month" value={requests} min={0} step={1} onChange={setRequests} />
        <MediaNumberField label={`${unitLabel[0].toUpperCase()}${unitLabel.slice(1)} output / request`} value={outputUnits} min={0} step={selectedRate.billingUnit === "image" ? 1 : 0.1} onChange={setOutputUnits} />
        <MediaNumberField label="Input images / request" value={inputImages} min={0} step={1} onChange={setInputImages} />
        <MediaNumberField label="Other billable cost / request (USD)" value={otherCost} min={0} step={0.001} onChange={setOtherCost} />
        <MediaNumberField label="Monthly hard budget (USD)" value={budget} min={0} step={1} onChange={setBudget} />
        <p className="media-control-note">Use “other billable cost” for token-priced prompts, image-token inputs, tool calls, audio, or another category this per-unit card does not represent.</p>
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">MODELED MEDIA SPEND · {selectedRate.providerLabel}</span>
        <div className="selected-rate">
          <strong>{selectedRate.modelId}</strong>
          <span>{formatUnitRate(selectedRate.outputPriceUsd)} per output {selectedRate.billingUnit}{selectedRate.inputImagePriceUsd !== undefined ? ` · ${formatUnitRate(selectedRate.inputImagePriceUsd)} per input image` : " · input media priced separately"}</span>
          <small>{selectedRate.label} · verified {selectedRate.verifiedAt}</small>
        </div>
        <div className="media-total">
          <small>Estimated monthly total</small>
          <strong>{formatUsd(result.totalCostUsd)}</strong>
          <span className={overBudget ? "media-budget-over" : "media-budget-under"}>{overBudget ? `${formatUsd(Math.abs(result.budgetDifferenceUsd))} over budget` : `${formatUsd(result.budgetDifferenceUsd)} budget headroom`}</span>
        </div>
        <dl className="media-cost-breakdown">
          <div><dt>Output {unitLabel}</dt><dd>{formatUsd(result.outputCostUsd)}</dd></div>
          <div><dt>Input images</dt><dd>{formatUsd(result.inputImageCostUsd)}</dd></div>
          <div><dt>Other entered cost</dt><dd>{formatUsd(result.otherCostUsd)}</dd></div>
          <div><dt>Safe whole {unitLabel} / request</dt><dd>{result.maximumOutputUnitsPerRequest.toLocaleString("en-US")}</dd></div>
        </dl>
        <p><strong>{overBudget ? "This scenario breaches the entered hard budget." : "This scenario remains inside the entered hard budget."}</strong> The safe-unit figure reserves the input-image and other entered costs first, then floors the remaining output allowance.</p>
        <p>{selectedRate.caveat}</p>
        <a className="rate-source" href={selectedRate.sourceUrl} target="_blank" rel="noreferrer">{selectedRate.sourceLabel} ↗</a>
        <div className="calculator-next-step">
          <span className="eyebrow">ENFORCEMENT, NOT JUST ESTIMATION</span>
          <strong>Reject the request before the provider call when its worst-case cost exceeds the remaining budget.</strong>
          <p>Then reconcile the provider-reported usage or invoice after the call. A catalogue estimate should never silently become the billing authority.</p>
          <div>
            <Link className="button button-lime" href="/services/budget-guard" data-funnel-event="cta_service_budget_guard">See the fixed £75 implementation scope</Link>
            <Link className="text-link" href="/guides/autonomous-agent-token-budget">Read the budget-guard pattern <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaNumberField({ label, value, min, step, onChange }: { label: string; value: number; min: number; step: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} />
    </label>
  );
}

function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return `$${value.toFixed(4)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatUnitRate(value: number): string {
  return `$${value.toFixed(value < 0.01 ? 3 : 2)}`;
}
