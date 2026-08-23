export interface AgentBudgetScenario {
  readonly totalTokens: number;
  readonly coordinatorTokens: number;
  readonly workerCount: number;
  readonly attemptsPerWorker: number;
  readonly safetyReservePercent: number;
}

export interface AgentBudgetResult {
  readonly totalTokens: number;
  readonly coordinatorTokens: number;
  readonly safetyReserveTokens: number;
  readonly workerPoolTokens: number;
  readonly perWorkerTokens: number;
  readonly perAttemptTokens: number;
  readonly unallocatedTokens: number;
  readonly overallocatedTokens: number;
  readonly valid: boolean;
}

function wholeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function calculateAgentBudget(scenario: AgentBudgetScenario): AgentBudgetResult {
  const totalTokens = wholeNonNegative(scenario.totalTokens);
  const coordinatorTokens = wholeNonNegative(scenario.coordinatorTokens);
  const workerCount = Math.max(1, wholeNonNegative(scenario.workerCount));
  const attemptsPerWorker = Math.max(1, wholeNonNegative(scenario.attemptsPerWorker));
  const safetyReservePercent = Number.isFinite(scenario.safetyReservePercent)
    ? Math.min(100, Math.max(0, scenario.safetyReservePercent))
    : 0;
  const safetyReserveTokens = Math.floor(totalTokens * safetyReservePercent / 100);
  const overallocatedTokens = Math.max(0, coordinatorTokens + safetyReserveTokens - totalTokens);
  const workerPoolTokens = Math.max(0, totalTokens - coordinatorTokens - safetyReserveTokens);
  const perWorkerTokens = Math.floor(workerPoolTokens / workerCount);
  const perAttemptTokens = Math.floor(perWorkerTokens / attemptsPerWorker);
  const unallocatedTokens = Math.max(0, workerPoolTokens - perWorkerTokens * workerCount);

  return {
    totalTokens,
    coordinatorTokens,
    safetyReserveTokens,
    workerPoolTokens,
    perWorkerTokens,
    perAttemptTokens,
    unallocatedTokens,
    overallocatedTokens,
    valid: totalTokens > 0 && workerPoolTokens > 0 && perAttemptTokens > 0,
  };
}
