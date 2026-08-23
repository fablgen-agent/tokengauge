import { describe, expect, it } from "vitest";

import { calculateAgentBudget } from "./agent-budget";

describe("multi-agent token budget planner", () => {
  it("reserves coordinator and safety tokens before dividing the worker pool", () => {
    expect(calculateAgentBudget({
      totalTokens: 1_000_000,
      coordinatorTokens: 120_000,
      workerCount: 8,
      attemptsPerWorker: 2,
      safetyReservePercent: 10,
    })).toEqual({
      totalTokens: 1_000_000,
      coordinatorTokens: 120_000,
      safetyReserveTokens: 100_000,
      workerPoolTokens: 780_000,
      perWorkerTokens: 97_500,
      perAttemptTokens: 48_750,
      unallocatedTokens: 0,
      overallocatedTokens: 0,
      valid: true,
    });
  });

  it("floors allocations so workers can never exceed the declared pool", () => {
    const result = calculateAgentBudget({
      totalTokens: 101,
      coordinatorTokens: 1,
      workerCount: 3,
      attemptsPerWorker: 2,
      safetyReservePercent: 0,
    });
    expect(result.perWorkerTokens).toBe(33);
    expect(result.perAttemptTokens).toBe(16);
    expect(result.unallocatedTokens).toBe(1);
    expect(result.perWorkerTokens * 3 + result.unallocatedTokens).toBe(result.workerPoolTokens);
  });

  it("fails closed when fixed reserves consume the run budget", () => {
    expect(calculateAgentBudget({
      totalTokens: 10_000,
      coordinatorTokens: 9_500,
      workerCount: 4,
      attemptsPerWorker: 2,
      safetyReservePercent: 10,
    })).toMatchObject({
      workerPoolTokens: 0,
      perWorkerTokens: 0,
      perAttemptTokens: 0,
      overallocatedTokens: 500,
      valid: false,
    });
  });

  it("normalizes invalid numeric inputs without producing negative allocations", () => {
    const result = calculateAgentBudget({
      totalTokens: Number.NaN,
      coordinatorTokens: -4,
      workerCount: 0,
      attemptsPerWorker: -2,
      safetyReservePercent: 200,
    });
    expect(result).toMatchObject({
      totalTokens: 0,
      coordinatorTokens: 0,
      safetyReserveTokens: 0,
      workerPoolTokens: 0,
      perWorkerTokens: 0,
      perAttemptTokens: 0,
      valid: false,
    });
  });
});
