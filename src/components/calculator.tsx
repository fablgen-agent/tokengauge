"use client";

import { useMemo, useState } from "react";

import { calculateCostUsd, calculateSavings, formatUsd, modelPrices } from "@/lib/costs";

export function CostCalculator() {
  const [modelId, setModelId] = useState(modelPrices[1].id);
  const [calls, setCalls] = useState(10_000);
  const [inputTokens, setInputTokens] = useState(3_000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [inputReduction, setInputReduction] = useState(25);
  const [outputReduction, setOutputReduction] = useState(20);
  const [cachedShare, setCachedShare] = useState(30);

  const result = useMemo(() => {
    const price = modelPrices.find((candidate) => candidate.id === modelId) ?? modelPrices[1];
    const baseline = calls * calculateCostUsd(price, { inputTokens, outputTokens, cachedInputTokens: 0 });
    const optimizedInput = Math.round(inputTokens * (1 - inputReduction / 100));
    const optimizedOutput = Math.round(outputTokens * (1 - outputReduction / 100));
    const optimized = calls * calculateCostUsd(price, {
      inputTokens: optimizedInput,
      cachedInputTokens: Math.round(optimizedInput * (cachedShare / 100)),
      outputTokens: optimizedOutput,
    });
    return { baseline, optimized, ...calculateSavings(baseline, optimized) };
  }, [calls, cachedShare, inputReduction, inputTokens, modelId, outputReduction, outputTokens]);

  return (
    <div className="calculator-shell">
      <div className="calculator-controls">
        <label>
          Model
          <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
            {modelPrices.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
          </select>
        </label>
        <NumberField label="Requests / month" value={calls} min={1} onChange={setCalls} />
        <NumberField label="Input tokens / request" value={inputTokens} min={0} onChange={setInputTokens} />
        <NumberField label="Output tokens / request" value={outputTokens} min={0} onChange={setOutputTokens} />
        <RangeField label="Input reduction" value={inputReduction} onChange={setInputReduction} />
        <RangeField label="Output reduction" value={outputReduction} onChange={setOutputReduction} />
        <RangeField label="Cache-read share" value={cachedShare} onChange={setCachedShare} />
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">Estimated monthly API spend</span>
        <div className="cost-comparison">
          <div><small>Before</small><strong>{formatUsd(result.baseline)}</strong></div>
          <span aria-hidden="true">→</span>
          <div><small>After</small><strong>{formatUsd(result.optimized)}</strong></div>
        </div>
        <div className={`savings-pill ${result.amountUsd < 0 ? "negative" : ""}`}>
          {result.amountUsd >= 0 ? "Potential saving" : "Potential increase"}: {formatUsd(Math.abs(result.amountUsd))}
          {result.baseline > 0 ? ` (${Math.abs(result.percentage).toFixed(1)}%)` : ""}
        </div>
        <p>Scenario math, not a promise. Validate quality, retries, tool fees, and actual cache hits before changing production traffic.</p>
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
