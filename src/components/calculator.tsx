"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  calculateBreakEvenAcceptanceRate,
  calculateCostPerAcceptedAnswer,
  calculateCostUsd,
  calculateSavings,
  formatRate,
  formatUsd,
  getSelectableModelPrices,
  resolvePriceForInput,
  type ProviderId,
} from "@/lib/costs";

const allSelectableModels = getSelectableModelPrices();
const allDefaultModel = allSelectableModels.find((model) => model.modelId === "gpt-5.6-terra") ?? allSelectableModels[0];

export function CostCalculator({ providerId }: { providerId?: ProviderId } = {}) {
  const selectableModels = useMemo(
    () => providerId ? allSelectableModels.filter((model) => model.provider === providerId) : allSelectableModels,
    [providerId],
  );
  const defaultModel = useMemo(
    () => providerId ? selectableModels[0] : allDefaultModel,
    [providerId, selectableModels],
  );
  const groupedModels = useMemo(
    () => Array.from(selectableModels.reduce((groups, model) => {
      const entries = groups.get(model.providerLabel) ?? [];
      entries.push(model);
      groups.set(model.providerLabel, entries);
      return groups;
    }, new Map<string, typeof selectableModels[number][]>())),
    [selectableModels],
  );
  const [priceId, setPriceId] = useState(defaultModel.id);
  const [calls, setCalls] = useState(10_000);
  const [inputTokens, setInputTokens] = useState(3_000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [inputReduction, setInputReduction] = useState(25);
  const [outputReduction, setOutputReduction] = useState(20);
  const [cachedShare, setCachedShare] = useState(30);
  const [baselinePassRate, setBaselinePassRate] = useState(90);
  const [candidatePassRate, setCandidatePassRate] = useState(85);

  const result = useMemo(() => {
    const selectedPrice = selectableModels.find((candidate) => candidate.id === priceId) ?? defaultModel;
    const optimizedInput = Math.round(inputTokens * (1 - inputReduction / 100));
    const optimizedOutput = Math.round(outputTokens * (1 - outputReduction / 100));
    const baselinePrice = resolvePriceForInput(selectedPrice, inputTokens);
    const optimizedPrice = resolvePriceForInput(selectedPrice, optimizedInput);
    if (!baselinePrice || !optimizedPrice) {
      return { baseline: 0, optimized: 0, amountUsd: 0, percentage: 0, baselinePrice: selectedPrice, optimizedPrice: selectedPrice, error: `The entered input does not fit ${selectedPrice.label}'s published context or price bands.` };
    }
    const baseline = calls * calculateCostUsd(baselinePrice, { inputTokens, outputTokens, cachedInputTokens: 0 });
    const optimized = calls * calculateCostUsd(optimizedPrice, {
      inputTokens: optimizedInput,
      cachedInputTokens: Math.round(optimizedInput * (cachedShare / 100)),
      outputTokens: optimizedOutput,
    });
    return { baseline, optimized, baselinePrice, optimizedPrice, error: undefined, ...calculateSavings(baseline, optimized) };
  }, [calls, cachedShare, defaultModel, inputReduction, inputTokens, outputReduction, outputTokens, priceId, selectableModels]);

  const baselineAcceptedCost = result.error ? null : calculateCostPerAcceptedAnswer(result.baseline, calls, baselinePassRate);
  const candidateAcceptedCost = result.error ? null : calculateCostPerAcceptedAnswer(result.optimized, calls, candidatePassRate);
  const acceptedSavings = baselineAcceptedCost !== null && candidateAcceptedCost !== null
    ? calculateSavings(baselineAcceptedCost, candidateAcceptedCost)
    : null;
  const breakEvenPassRate = result.error
    ? null
    : calculateBreakEvenAcceptanceRate(result.baseline, result.optimized, baselinePassRate);

  return (
    <div className="calculator-shell">
      <div className="calculator-controls">
        <label>
          Provider and model tier
          <select value={priceId} onChange={(event) => setPriceId(event.target.value)}>
            {groupedModels.map(([provider, models]) => (
              <optgroup label={provider} key={provider}>
                {models.map((model) => <option key={model.id} value={model.id}>{model.label} · {model.tierLabel}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <NumberField label="Requests / month" value={calls} min={1} onChange={setCalls} />
        <NumberField label="Input tokens / request" value={inputTokens} min={0} onChange={setInputTokens} />
        <NumberField label="Output tokens / request" value={outputTokens} min={0} onChange={setOutputTokens} />
        <RangeField label="Input reduction" value={inputReduction} onChange={setInputReduction} />
        <RangeField label="Output reduction" value={outputReduction} onChange={setOutputReduction} />
        <RangeField label="Warm cache-read share" value={cachedShare} onChange={setCachedShare} />
        <RangeField label="Baseline quality pass rate" value={baselinePassRate} min={1} max={100} step={1} onChange={setBaselinePassRate} />
        <RangeField label="Candidate quality pass rate" value={candidatePassRate} min={1} max={100} step={1} onChange={setCandidatePassRate} />
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">Estimated monthly API spend · {result.baselinePrice.providerLabel}</span>
        <div className="selected-rate">
          <strong>{result.baselinePrice.label}</strong>
          <span>Before · {result.baselinePrice.tierLabel}: {formatRate(result.baselinePrice.inputPerMillionUsd)} input · {formatRate(result.baselinePrice.cachedInputPerMillionUsd)} cache read · {formatRate(result.baselinePrice.outputPerMillionUsd)} output / 1M</span>
          <span>After · {result.optimizedPrice.tierLabel}: {formatRate(result.optimizedPrice.inputPerMillionUsd)} input · {formatRate(result.optimizedPrice.cachedInputPerMillionUsd)} cache read · {formatRate(result.optimizedPrice.outputPerMillionUsd)} output / 1M</span>
          <small>{result.baselinePrice.region} · price bands selected automatically from input size</small>
        </div>
        {result.error ? <p className="form-error" role="alert">{result.error}</p> : <><div className="cost-comparison">
          <div><small>Before</small><strong>{formatUsd(result.baseline)}</strong></div>
          <span aria-hidden="true">→</span>
          <div><small>After</small><strong>{formatUsd(result.optimized)}</strong></div>
        </div>
        <div className={`savings-pill ${result.amountUsd < 0 ? "negative" : ""}`}>
          {result.amountUsd >= 0 ? "Potential saving" : "Potential increase"}: {formatUsd(Math.abs(result.amountUsd))}
          {result.baseline > 0 ? ` (${Math.abs(result.percentage).toFixed(1)}%)` : ""}
        </div>
        {baselineAcceptedCost !== null && candidateAcceptedCost !== null && acceptedSavings && breakEvenPassRate !== null ? (
          <div className="accepted-economics">
            <span className="eyebrow">QUALITY-ADJUSTED COST</span>
            <div className="accepted-cost-grid">
              <div><small>Before / accepted answer</small><strong>{formatAcceptedUsd(baselineAcceptedCost)}</strong><span>{baselinePassRate}% pass assumption</span></div>
              <div><small>After / accepted answer</small><strong>{formatAcceptedUsd(candidateAcceptedCost)}</strong><span>{candidatePassRate}% pass assumption</span></div>
            </div>
            <p className={acceptedSavings.amountUsd < 0 ? "quality-loses" : "quality-wins"}>
              {breakEvenPassRate > 100
                ? `No candidate pass rate up to 100% breaks even against the ${baselinePassRate}% baseline assumption.`
                : `Candidate break-even: ${breakEvenPassRate.toFixed(1)}% pass rate. Your scenario assumes ${candidatePassRate}%.`}
            </p>
          </div>
        ) : null}</>}
        <p>Warm cache-read scenario, not general ROI. It excludes cache writes/storage, tools, regional uplifts, retries, and quality failures. A dash means no published cache-read rate.</p>
        <a className="rate-source" href={result.baselinePrice.sourceUrl} target="_blank" rel="noreferrer">{result.baselinePrice.sourceLabel} ↗</a>
        <div className="calculator-next-step">
          <span className="eyebrow">NEXT STEP</span>
          <strong>
            {result.error
              ? "Bring the scenario back inside the published model limits."
              : acceptedSavings && acceptedSavings.amountUsd > 0
                ? `Validate the ${acceptedSavings.percentage.toFixed(1)}% accepted-answer advantage.`
                : acceptedSavings && acceptedSavings.amountUsd < 0
                  ? "The token-saving arm loses after quality adjustment."
                  : "Test a different intervention before changing production."}
          </strong>
          <p>The estimate is not a saving until the same workload still passes its quality bar. Compare a supported recipe in the lab, or use the evidence library to design a provider-specific test.</p>
          <div>
            <Link className="button button-lime" href="/lab">Run a controlled test</Link>
            <Link className="text-link" href="/library">Browse evidence methods <span aria-hidden="true">→</span></Link>
            <Link className="text-link" href="/#pricing">See one-time access <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" min={min} step="1" value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} />
    </label>
  );
}

function RangeField({ label, value, min = 0, max = 90, step = 5, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="range-label">
      <span>{label}<b>{value}%</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function formatAcceptedUsd(value: number): string {
  if (value > 0 && value < 1) return `$${value.toFixed(4)}`;
  return formatUsd(value);
}
