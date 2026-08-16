"use client";

import { useMemo, useState } from "react";

import {
  calculateCostPerAcceptedAnswer,
  calculateCostUsd,
  formatRate,
  formatUsd,
  getSelectableModelPrices,
  resolvePriceForInput,
  type ModelPrice,
  type ProviderId,
} from "@/lib/costs";

const selectablePrices = getSelectableModelPrices();

export function ProviderComparisonCalculator({ leftId, rightId }: { leftId: ProviderId; rightId: ProviderId }) {
  const leftPrices = useMemo(() => selectablePrices.filter((price) => price.provider === leftId), [leftId]);
  const rightPrices = useMemo(() => selectablePrices.filter((price) => price.provider === rightId), [rightId]);
  const [leftPriceId, setLeftPriceId] = useState(leftPrices[0].id);
  const [rightPriceId, setRightPriceId] = useState(rightPrices[0].id);
  const [calls, setCalls] = useState(10_000);
  const [inputTokens, setInputTokens] = useState(3_000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [cachedShare, setCachedShare] = useState(0);
  const [leftPassRate, setLeftPassRate] = useState(90);
  const [rightPassRate, setRightPassRate] = useState(90);

  const result = useMemo(() => {
    const leftSelected = leftPrices.find((price) => price.id === leftPriceId) ?? leftPrices[0];
    const rightSelected = rightPrices.find((price) => price.id === rightPriceId) ?? rightPrices[0];
    const left = priceScenario(leftSelected, calls, inputTokens, outputTokens, cachedShare, leftPassRate);
    const right = priceScenario(rightSelected, calls, inputTokens, outputTokens, cachedShare, rightPassRate);
    return { left, right };
  }, [cachedShare, calls, inputTokens, leftPassRate, leftPriceId, leftPrices, outputTokens, rightPassRate, rightPriceId, rightPrices]);

  const error = result.left.error ?? result.right.error;
  const winner = !error && result.left.acceptedCost !== null && result.right.acceptedCost !== null
    ? result.left.acceptedCost === result.right.acceptedCost
      ? undefined
      : result.left.acceptedCost < result.right.acceptedCost ? result.left : result.right
    : undefined;

  return (
    <div className="calculator-shell comparison-calculator">
      <div className="calculator-controls">
        <ModelField label={`${leftPrices[0].providerLabel} model and tier`} prices={leftPrices} value={leftPriceId} onChange={setLeftPriceId} />
        <ModelField label={`${rightPrices[0].providerLabel} model and tier`} prices={rightPrices} value={rightPriceId} onChange={setRightPriceId} />
        <NumberField label="Requests / month" value={calls} min={1} onChange={setCalls} />
        <NumberField label="Input tokens / request" value={inputTokens} min={0} onChange={setInputTokens} />
        <NumberField label="Output tokens / request" value={outputTokens} min={0} onChange={setOutputTokens} />
        <RangeField label="Warm cache-read share" value={cachedShare} min={0} max={90} onChange={setCachedShare} />
        <RangeField label={`${result.left.price.providerLabel} quality pass rate`} value={leftPassRate} min={1} max={100} onChange={setLeftPassRate} />
        <RangeField label={`${result.right.price.providerLabel} quality pass rate`} value={rightPassRate} min={1} max={100} onChange={setRightPassRate} />
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">SAME WORKLOAD · TWO API RATE CARDS</span>
        {error ? <p className="form-error" role="alert">{error}</p> : <>
          <div className="comparison-result-grid">
            <ResultCard result={result.left} passRate={leftPassRate} />
            <ResultCard result={result.right} passRate={rightPassRate} />
          </div>
          <div className="comparison-verdict">
            <span className="eyebrow">QUALITY-ADJUSTED RESULT</span>
            <strong>{winner ? `${winner.price.providerLabel} is lower in this scenario.` : "The configured costs are equal."}</strong>
            {winner ? <p>At the entered pass rates, its estimated cost per accepted answer is {formatAcceptedUsd(winner.acceptedCost!)}. This is scenario math, not evidence that the selected models have equal capabilities.</p> : null}
          </div>
        </>}
        <p>API rates are USD per one million tokens. The estimate excludes cache writes or storage, tools, retries, regional uplifts, taxes, latency failures, and consumer-plan quotas.</p>
      </div>
    </div>
  );
}

type Scenario = { price: ModelPrice; monthlyCost: number; acceptedCost: number | null; error?: string };

function priceScenario(selected: ModelPrice, calls: number, inputTokens: number, outputTokens: number, cachedShare: number, passRate: number): Scenario {
  const price = resolvePriceForInput(selected, inputTokens);
  if (!price) return { price: selected, monthlyCost: 0, acceptedCost: null, error: `${selected.label} does not cover the entered input size in its published price bands.` };
  const monthlyCost = calls * calculateCostUsd(price, {
    inputTokens,
    cachedInputTokens: Math.round(inputTokens * cachedShare / 100),
    outputTokens,
  });
  return { price, monthlyCost, acceptedCost: calculateCostPerAcceptedAnswer(monthlyCost, calls, passRate) };
}

function ModelField({ label, prices, value, onChange }: { label: string; prices: readonly ModelPrice[]; value: string; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{prices.map((price) => <option key={price.id} value={price.id}>{price.label} · {price.tierLabel}</option>)}</select></label>;
}

function NumberField({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min={min} step="1" value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} /></label>;
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="range-label"><span>{label}<b>{value}%</b></span><input type="range" min={min} max={max} step={min === 1 ? 1 : 5} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function ResultCard({ result, passRate }: { result: Scenario; passRate: number }) {
  return <article><span>{result.price.providerLabel}</span><h3>{result.price.label}</h3><small>{result.price.tierLabel} · {result.price.region}</small><dl><div><dt>Monthly API spend</dt><dd>{formatUsd(result.monthlyCost)}</dd></div><div><dt>Cost / accepted answer</dt><dd>{result.acceptedCost === null ? "—" : formatAcceptedUsd(result.acceptedCost)}</dd></div><div><dt>Quality assumption</dt><dd>{passRate}%</dd></div></dl><p>{formatRate(result.price.inputPerMillionUsd)} input · {formatRate(result.price.cachedInputPerMillionUsd)} cache read · {formatRate(result.price.outputPerMillionUsd)} output / 1M</p><a href={result.price.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></article>;
}

function formatAcceptedUsd(value: number): string {
  if (value > 0 && value < 1) return `$${value.toFixed(4)}`;
  return formatUsd(value);
}
