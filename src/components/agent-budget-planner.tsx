"use client";

import { useMemo, useState } from "react";

import { calculateAgentBudget } from "@/lib/agent-budget";

export function AgentBudgetPlanner() {
  const [totalTokens, setTotalTokens] = useState(1_000_000);
  const [coordinatorTokens, setCoordinatorTokens] = useState(120_000);
  const [workerCount, setWorkerCount] = useState(8);
  const [attemptsPerWorker, setAttemptsPerWorker] = useState(2);
  const [safetyReservePercent, setSafetyReservePercent] = useState(10);
  const result = useMemo(() => calculateAgentBudget({
    totalTokens,
    coordinatorTokens,
    workerCount,
    attemptsPerWorker,
    safetyReservePercent,
  }), [attemptsPerWorker, coordinatorTokens, safetyReservePercent, totalTokens, workerCount]);
  const policy = JSON.stringify({
    run_token_budget: result.totalTokens,
    coordinator_reserve: result.coordinatorTokens,
    safety_reserve: result.safetyReserveTokens,
    worker_count: Math.max(1, Math.floor(workerCount || 1)),
    per_worker_budget: result.perWorkerTokens,
    max_attempts_per_worker: Math.max(1, Math.floor(attemptsPerWorker || 1)),
    per_attempt_budget: result.perAttemptTokens,
    exhaustion: "stop_before_request",
  }, null, 2);

  return (
    <div className="calculator-shell agent-budget-planner">
      <div className="calculator-controls">
        <BudgetNumberField label="Total run budget (tokens)" value={totalTokens} min={0} step={10_000} onChange={setTotalTokens} />
        <BudgetNumberField label="Coordinator reserve (tokens)" value={coordinatorTokens} min={0} step={10_000} onChange={setCoordinatorTokens} />
        <BudgetNumberField label="Parallel workers" value={workerCount} min={1} step={1} onChange={setWorkerCount} />
        <BudgetNumberField label="Maximum attempts / worker" value={attemptsPerWorker} min={1} step={1} onChange={setAttemptsPerWorker} />
        <BudgetNumberField label="Safety reserve (%)" value={safetyReservePercent} min={0} max={100} step={1} onChange={setSafetyReservePercent} />
        <p className="agent-budget-note">The attempt allowance must cover the serialized request and its maximum output together. Tool, image, audio, and provider-specific charges need separate limits.</p>
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">DETERMINISTIC RUN ALLOCATION</span>
        <div className="agent-budget-primary">
          <small>Maximum tokens per worker attempt</small>
          <strong>{result.perAttemptTokens.toLocaleString("en-US")}</strong>
          <span>{result.valid ? "Worker pool fits inside the declared run budget" : "No safe worker request fits these reserves"}</span>
        </div>
        <dl className="agent-budget-breakdown">
          <div><dt>Coordinator</dt><dd>{result.coordinatorTokens.toLocaleString("en-US")}</dd></div>
          <div><dt>Safety reserve</dt><dd>{result.safetyReserveTokens.toLocaleString("en-US")}</dd></div>
          <div><dt>Worker pool</dt><dd>{result.workerPoolTokens.toLocaleString("en-US")}</dd></div>
          <div><dt>Per worker</dt><dd>{result.perWorkerTokens.toLocaleString("en-US")}</dd></div>
        </dl>
        {result.overallocatedTokens > 0 ? <p className="agent-budget-warning"><strong>Reserves exceed the run budget by {result.overallocatedTokens.toLocaleString("en-US")} tokens.</strong> Reduce the coordinator or safety reserve before dispatching any worker.</p> : null}
        <div className="agent-budget-policy"><span>Copyable policy shape</span><pre><code>{policy}</code></pre></div>
        <p>This is a token-allocation plan, not a monetary invoice cap. Enforce it at the shared provider-call seam and reconcile provider-reported usage afterward.</p>
      </div>
    </div>
  );
}

function BudgetNumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max?: number; step: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min={min} max={max} step={step} value={value} onChange={(event) => {
    const parsed = Number(event.target.value);
    onChange(Number.isFinite(parsed) ? Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, parsed)) : min);
  }} /></label>;
}
