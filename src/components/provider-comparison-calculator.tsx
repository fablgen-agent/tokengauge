"use client";

import { useMemo, useState } from "react";

import {
  calculateCompatibilityGate,
  calculateOperationalCostScenario,
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
  const [leftRetryOverhead, setLeftRetryOverhead] = useState(5);
  const [rightRetryOverhead, setRightRetryOverhead] = useState(5);
  const [leftP95Latency, setLeftP95Latency] = useState(1_500);
  const [rightP95Latency, setRightP95Latency] = useState(1_500);
  const [latencyCeiling, setLatencyCeiling] = useState(3_000);
  const [requiredCompatibilityChecks, setRequiredCompatibilityChecks] = useState(0);
  const [leftPassedCompatibilityChecks, setLeftPassedCompatibilityChecks] = useState(0);
  const [rightPassedCompatibilityChecks, setRightPassedCompatibilityChecks] = useState(0);

  const result = useMemo(() => {
    const leftSelected = leftPrices.find((price) => price.id === leftPriceId) ?? leftPrices[0];
    const rightSelected = rightPrices.find((price) => price.id === rightPriceId) ?? rightPrices[0];
    const left = priceScenario(leftSelected, calls, inputTokens, outputTokens, cachedShare, leftPassRate, leftRetryOverhead, leftP95Latency, latencyCeiling, requiredCompatibilityChecks, leftPassedCompatibilityChecks);
    const right = priceScenario(rightSelected, calls, inputTokens, outputTokens, cachedShare, rightPassRate, rightRetryOverhead, rightP95Latency, latencyCeiling, requiredCompatibilityChecks, rightPassedCompatibilityChecks);
    return { left, right };
  }, [cachedShare, calls, inputTokens, latencyCeiling, leftP95Latency, leftPassRate, leftPassedCompatibilityChecks, leftPriceId, leftPrices, leftRetryOverhead, outputTokens, requiredCompatibilityChecks, rightP95Latency, rightPassRate, rightPassedCompatibilityChecks, rightPriceId, rightPrices, rightRetryOverhead]);

  const error = result.left.error ?? result.right.error;
  const eligible = [result.left, result.right].filter((scenario) => scenario.meetsLatencyCeiling && scenario.compatibility.meetsRequirement && scenario.acceptedCost !== null);
  const winner = !error && eligible.length > 0
    ? eligible.length === 1
      ? eligible[0]
      : eligible[0].acceptedCost === eligible[1].acceptedCost
      ? undefined
      : eligible[0].acceptedCost! < eligible[1].acceptedCost! ? eligible[0] : eligible[1]
    : undefined;

  return (
    <div className="calculator-shell comparison-calculator">
      <div className="calculator-controls">
        <ModelField label={`${leftPrices[0].providerLabel} model and tier`} prices={leftPrices} value={leftPriceId} onChange={setLeftPriceId} />
        <ModelField label={`${rightPrices[0].providerLabel} model and tier`} prices={rightPrices} value={rightPriceId} onChange={setRightPriceId} />
        <NumberField label="Tasks / month" value={calls} min={1} onChange={setCalls} />
        <NumberField label="Input tokens / request" value={inputTokens} min={0} onChange={setInputTokens} />
        <NumberField label="Output tokens / request" value={outputTokens} min={0} onChange={setOutputTokens} />
        <RangeField label="Warm cache-read share" value={cachedShare} min={0} max={90} onChange={setCachedShare} />
        <RangeField label={`${result.left.price.providerLabel} quality pass rate`} value={leftPassRate} min={1} max={100} onChange={setLeftPassRate} />
        <RangeField label={`${result.right.price.providerLabel} quality pass rate`} value={rightPassRate} min={1} max={100} onChange={setRightPassRate} />
        <RangeField label={`${result.left.price.providerLabel} retry overhead`} value={leftRetryOverhead} min={0} max={100} onChange={setLeftRetryOverhead} />
        <RangeField label={`${result.right.price.providerLabel} retry overhead`} value={rightRetryOverhead} min={0} max={100} onChange={setRightRetryOverhead} />
        <NumberField label={`${result.left.price.providerLabel} observed p95 latency (ms)`} value={leftP95Latency} min={0} onChange={setLeftP95Latency} />
        <NumberField label={`${result.right.price.providerLabel} observed p95 latency (ms)`} value={rightP95Latency} min={0} onChange={setRightP95Latency} />
        <NumberField label="Required p95 latency ceiling (ms)" value={latencyCeiling} min={0} onChange={setLatencyCeiling} />
        <NumberField label="Required OpenAI-client checks (0 disables)" value={requiredCompatibilityChecks} min={0} max={20} onChange={(value) => { setRequiredCompatibilityChecks(value); setLeftPassedCompatibilityChecks((current) => Math.min(current, value)); setRightPassedCompatibilityChecks((current) => Math.min(current, value)); }} />
        <NumberField label={`${result.left.price.providerLabel} checks passed`} value={leftPassedCompatibilityChecks} min={0} max={requiredCompatibilityChecks} disabled={requiredCompatibilityChecks === 0} onChange={setLeftPassedCompatibilityChecks} />
        <NumberField label={`${result.right.price.providerLabel} checks passed`} value={rightPassedCompatibilityChecks} min={0} max={requiredCompatibilityChecks} disabled={requiredCompatibilityChecks === 0} onChange={setRightPassedCompatibilityChecks} />
        <p className="comparison-observation-note"><strong>Use your own observations.</strong> TokenGauge does not invent provider latency, retry, or compatibility benchmarks. Compatibility checks can cover the endpoints, streaming events, tool calls, structured output, usage fields, and error behavior your existing OpenAI-style client actually requires. Set the required count to zero until you have run them.</p>
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">SAME WORKLOAD · TWO API RATE CARDS</span>
        {error ? <p className="form-error" role="alert">{error}</p> : <>
          <div className="comparison-result-grid">
            <ResultCard result={result.left} passRate={leftPassRate} retryOverhead={leftRetryOverhead} p95Latency={leftP95Latency} latencyCeiling={latencyCeiling} />
            <ResultCard result={result.right} passRate={rightPassRate} retryOverhead={rightRetryOverhead} p95Latency={rightP95Latency} latencyCeiling={latencyCeiling} />
          </div>
          <div className="comparison-verdict">
            <span className="eyebrow">OPERATIONAL RESULT</span>
            <strong>{winner ? `${winner.price.providerLabel} is the lower eligible scenario.` : eligible.length === 0 ? "Neither scenario meets every required gate." : "The eligible costs are equal."}</strong>
            {winner ? <p>It meets the entered p95 ceiling and client-check requirement; its retry- and quality-adjusted cost per accepted answer is {formatAcceptedUsd(winner.acceptedCost!)}. This is scenario math, not evidence that the selected models have equal capabilities.</p> : null}
          </div>
        </>}
        <p>API rates are USD per one million tokens. Retry overhead is a uniform-attempt estimate. The calculation excludes cache writes or storage, tools, partial failed-call billing differences, regional uplifts, taxes, and consumer-plan quotas.</p>
      </div>
    </div>
  );
}

type Scenario = { price: ModelPrice; monthlyCost: number; acceptedCost: number | null; billedAttempts: number; meetsLatencyCeiling: boolean; compatibility: ReturnType<typeof calculateCompatibilityGate>; error?: string };

function priceScenario(selected: ModelPrice, calls: number, inputTokens: number, outputTokens: number, cachedShare: number, passRate: number, retryOverhead: number, observedP95LatencyMs: number, latencyCeilingMs: number, requiredCompatibilityChecks: number, passedCompatibilityChecks: number): Scenario {
  const price = resolvePriceForInput(selected, inputTokens);
  const compatibility = calculateCompatibilityGate(requiredCompatibilityChecks, passedCompatibilityChecks);
  if (!price) return { price: selected, monthlyCost: 0, acceptedCost: null, billedAttempts: 0, meetsLatencyCeiling: false, compatibility, error: `${selected.label} does not cover the entered input size in its published price bands.` };
  const operational = calculateOperationalCostScenario({
    tasks: calls,
    costPerAttemptUsd: calculateCostUsd(price, {
    inputTokens,
    cachedInputTokens: Math.round(inputTokens * cachedShare / 100),
    outputTokens,
    }),
    retryOverheadPercentage: retryOverhead,
    qualityPassRatePercentage: passRate,
    observedP95LatencyMs,
    latencyCeilingMs,
  });
  return { price, monthlyCost: operational.monthlyCostUsd, acceptedCost: operational.costPerAcceptedAnswerUsd, billedAttempts: operational.billedAttempts, meetsLatencyCeiling: operational.meetsLatencyCeiling, compatibility };
}

function ModelField({ label, prices, value, onChange }: { label: string; prices: readonly ModelPrice[]; value: string; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{prices.map((price) => <option key={price.id} value={price.id}>{price.label} · {price.tierLabel}</option>)}</select></label>;
}

function NumberField({ label, value, min, max, disabled = false, onChange }: { label: string; value: number; min: number; max?: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min={min} max={max} step="1" value={value} disabled={disabled} onChange={(event) => onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, Number(event.target.value) || 0)))} /></label>;
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="range-label"><span>{label}<b>{value}%</b></span><input type="range" min={min} max={max} step={min === 1 ? 1 : 5} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function ResultCard({ result, passRate, retryOverhead, p95Latency, latencyCeiling }: { result: Scenario; passRate: number; retryOverhead: number; p95Latency: number; latencyCeiling: number }) {
  return <article><span>{result.price.providerLabel}</span><h3>{result.price.label}</h3><small>{result.price.tierLabel} · {result.price.region}</small><dl><div><dt>Monthly API spend</dt><dd>{formatUsd(result.monthlyCost)}</dd></div><div><dt>Estimated billed attempts</dt><dd>{Math.round(result.billedAttempts).toLocaleString()}</dd></div><div><dt>Cost / accepted answer</dt><dd>{result.acceptedCost === null ? "—" : formatAcceptedUsd(result.acceptedCost)}</dd></div><div><dt>Quality / retry</dt><dd>{passRate}% / +{retryOverhead}%</dd></div><div><dt>Observed p95 / ceiling</dt><dd>{p95Latency.toLocaleString()} / {latencyCeiling.toLocaleString()} ms</dd></div><div><dt>Latency gate</dt><dd>{result.meetsLatencyCeiling ? "Meets" : "Misses"}</dd></div><div><dt>Client checks</dt><dd>{result.compatibility.applied ? `${result.compatibility.passedChecks}/${result.compatibility.requiredChecks} · ${result.compatibility.meetsRequirement ? "Meets" : "Misses"}` : "Not applied"}</dd></div></dl><p>{formatRate(result.price.inputPerMillionUsd)} input · {formatRate(result.price.cachedInputPerMillionUsd)} cache read · {formatRate(result.price.outputPerMillionUsd)} output / 1M</p><a href={result.price.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></article>;
}

function formatAcceptedUsd(value: number): string {
  if (value > 0 && value < 1) return `$${value.toFixed(4)}`;
  return formatUsd(value);
}
