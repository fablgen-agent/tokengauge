"use client";

import { useEffect, useState } from "react";

import { sendFunnelEvent } from "@/components/funnel-tracker";
import { orderedArmKeys, qualityVerdict, type ExperimentArmKey, type QualityChoice } from "@/lib/experiment-review";

type Usage = { input: number; cachedRead: number; cachedWrite: number; output: number; reasoning: number; total: number };
type Variant = { text: string; usage: Usage; settings: { maxOutputTokens: number; reasoningEffort: string; textVerbosity: string } };
type ExperimentResult = { baseline: Variant; candidate: Variant; executionOrder: string[] };
type StrategyOption = { id: string; title: string; action: string };
type LabSource = { id: string; label: string };

export function LabWorkbench({ strategies, sources }: { strategies: readonly StrategyOption[]; sources: readonly LabSource[] }) {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [providerId, setProviderId] = useState(sources[0]?.id ?? "chatgpt");
  const [strategyIds, setStrategyIds] = useState<string[]>([]);
  const [strategyId, setStrategyId] = useState(strategies[0]?.id ?? "");
  const [task, setTask] = useState("Explain why prompt-prefix stability matters to an engineering manager in three concise bullets.");
  const [baselineInstructions, setBaselineInstructions] = useState("You are a helpful AI assistant. Preserve every required fact.");
  const [result, setResult] = useState<ExperimentResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/models?provider=${encodeURIComponent(providerId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { models?: string[]; strategyIds?: string[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Models could not be loaded.");
        const nextModels = data.models ?? [];
        setModels(nextModels);
        setModel(nextModels[0] ?? "");
        const nextStrategyIds = data.strategyIds ?? [];
        setStrategyIds(nextStrategyIds);
        setStrategyId((current) => nextStrategyIds.includes(current) ? current : nextStrategyIds[0] ?? "");
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Models could not be loaded.");
      });
    return () => controller.abort();
  }, [providerId]);

  function changeProvider(nextProviderId: string) {
    setModels([]);
    setModel("");
    setStrategyIds([]);
    setError(undefined);
    setProviderId(nextProviderId);
  }

  async function run(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendFunnelEvent("lab_run_attempt");
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      const response = await fetch("/api/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, model, task, baselineInstructions, strategyId }),
      });
      const data = (await response.json()) as ExperimentResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Experiment failed.");
      setResult(data);
      sendFunnelEvent("lab_run_success");
    } catch (cause) {
      sendFunnelEvent("lab_run_failed");
      setError(cause instanceof Error ? cause.message : "Experiment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lab-workbench">
      <h2>Controlled request-setting test</h2>
      <p className="retention-note">The task and instructions stay byte-for-byte identical. Only the selected request setting changes between arms.</p>
      <form className="lab-form" onSubmit={run}>
        <label>Connection
          <select value={providerId} onChange={(event) => changeProvider(event.target.value)} required>
            {sources.map((source) => <option value={source.id} key={source.id}>{source.label}</option>)}
          </select>
        </label>
        <label>Strategy
          <select value={strategyId} onChange={(event) => setStrategyId(event.target.value)} required>
            {strategies.filter((strategy) => strategyIds.includes(strategy.id)).map((strategy) => <option value={strategy.id} key={strategy.id}>{strategy.title}</option>)}
          </select>
        </label>
        <label>Model
          <select value={model} onChange={(event) => setModel(event.target.value)} required disabled={!models.length}>
            {!models.length ? <option value="">Loading available models…</option> : null}
            {models.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label>Same task for both variants
          <textarea value={task} onChange={(event) => setTask(event.target.value)} minLength={10} maxLength={6000} required />
        </label>
        <label>Shared instructions for both variants
          <textarea value={baselineInstructions} onChange={(event) => setBaselineInstructions(event.target.value)} minLength={3} maxLength={6000} required />
        </label>
        <button className="button button-dark" type="submit" disabled={busy || !model || !strategyId}>{busy ? "Running two requests…" : "Run randomized A/B test"}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {result ? <ExperimentResults result={result} /> : null}
    </div>
  );
}

function ExperimentResults({ result }: { result: ExperimentResult }) {
  const [choice, setChoice] = useState<QualityChoice>();
  const [firstKey, secondKey] = orderedArmKeys(result.executionOrder);
  const first = result[firstKey];
  const second = result[secondKey];

  return (
    <section className="experiment-results" aria-live="polite">
      <div className="experiment-order">Outputs are blinded and shown in randomized execution order. Judge quality before seeing either strategy or token count.</div>
      <div className="result-grid">
        <VariantResult title={`Output A${choice ? ` · ${labelFor(firstKey)}` : ""}`} variant={first} revealed={Boolean(choice)} />
        <VariantResult title={`Output B${choice ? ` · ${labelFor(secondKey)}` : ""}`} variant={second} revealed={Boolean(choice)} />
      </div>
      <fieldset className="quality-review">
        <legend>Which output is better for the task?</legend>
        <p>Make a quality judgment before the cost reveal. This choice stays in this browser and is not uploaded or stored.</p>
        <div>
          <button type="button" aria-pressed={choice === "first"} onClick={() => setChoice("first")}>Output A</button>
          <button type="button" aria-pressed={choice === "tie"} onClick={() => setChoice("tie")}>Quality tie</button>
          <button type="button" aria-pressed={choice === "second"} onClick={() => setChoice("second")}>Output B</button>
        </div>
      </fieldset>
      {choice ? (
        <div className="quality-verdict" role="status">
          <strong>Blinding removed.</strong>
          <span>{qualityVerdict({
            choice,
            firstKey,
            baselineTokens: result.baseline.usage.total,
            candidateTokens: result.candidate.usage.total,
          })}</span>
        </div>
      ) : null}
      <p className="retention-note">TokenGauge returns both outputs to this browser but stores only model, strategy label, and usage totals.</p>
    </section>
  );
}

function labelFor(key: ExperimentArmKey): string {
  return key === "baseline" ? "Baseline" : "Candidate";
}

function VariantResult({ title, variant, revealed }: { title: string; variant: Variant; revealed: boolean }) {
  return (
    <article className="variant-result">
      <div><h3>{title}</h3>{revealed ? <strong>{variant.usage.total.toLocaleString()} tokens</strong> : <span className="blind-badge">Hidden</span>}</div>
      <pre>{variant.text}</pre>
      {revealed ? (
        <dl>
          <div><dt>Input</dt><dd>{variant.usage.input}</dd></div>
          <div><dt>Output</dt><dd>{variant.usage.output}</dd></div>
          <div><dt>Reasoning</dt><dd>{variant.usage.reasoning}</dd></div>
          <div><dt>Cache read</dt><dd>{variant.usage.cachedRead}</dd></div>
          <div><dt>Output cap</dt><dd>{variant.settings.maxOutputTokens}</dd></div>
          <div><dt>Effort</dt><dd>{variant.settings.reasoningEffort}</dd></div>
          <div><dt>Verbosity</dt><dd>{variant.settings.textVerbosity}</dd></div>
        </dl>
      ) : null}
    </article>
  );
}
