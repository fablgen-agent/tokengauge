"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
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
        </div></>}
        <p>Warm cache-read scenario, not general ROI. It excludes cache writes/storage, tools, regional uplifts, retries, and quality failures. A dash means no published cache-read rate.</p>
        <a className="rate-source" href={result.baselinePrice.sourceUrl} target="_blank" rel="noreferrer">{result.baselinePrice.sourceLabel} ↗</a>
        <div className="calculator-next-step">
          <span className="eyebrow">NEXT STEP</span>
          <strong>
            {result.error
              ? "Bring the scenario back inside the published model limits."
              : result.amountUsd > 0
                ? `Validate the ${formatUsd(result.amountUsd)} monthly hypothesis.`
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

function RangeField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="range-label">
      <span>{label}<b>{value}%</b></span>
      <input type="range" min="0" max="90" step="5" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
