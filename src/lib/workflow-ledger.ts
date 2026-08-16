import type { ModelPrice } from "@/lib/costs";

export const workflowLedgerCsvHeaders = [
  "project",
  "workflow",
  "rate_card_id",
  "input_tokens",
  "cached_input_tokens",
  "output_tokens",
  "attempts",
  "accepted_answers",
] as const;

export type WorkflowLedgerInput = {
  id: string;
  project: string;
  workflow: string;
  price: ModelPrice;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  attempts: number;
  acceptedAnswers: number;
};

export type WorkflowLedgerCsvRow = Omit<WorkflowLedgerInput, "price"> & { priceId: string };

export type WorkflowLedgerRowResult = {
  id: string;
  project: string;
  workflow: string;
  priceId: string;
  providerLabel: string;
  modelLabel: string;
  modeledCostUsd: number;
  acceptedAnswers: number;
  acceptanceRatePercentage: number;
  costPerAcceptedAnswerUsd: number | null;
  nonAcceptedAttemptCostUsd: number;
};

export type WorkflowLedgerResult = {
  rows: WorkflowLedgerRowResult[];
  projects: Array<{ project: string; modeledCostUsd: number; sharePercentage: number }>;
  modeledCostUsd: number;
  totalAttempts: number;
  totalAcceptedAnswers: number;
  acceptanceRatePercentage: number;
  costPerAcceptedAnswerUsd: number | null;
  nonAcceptedAttemptCostUsd: number;
  largestWorkflow: WorkflowLedgerRowResult | null;
};

function finite(value: number): number {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function tokenCost(price: ModelPrice, inputTokens: number, cachedInputTokens: number, outputTokens: number): number {
  const input = finite(inputTokens);
  const cached = Math.min(finite(cachedInputTokens), input);
  const uncached = input - cached;
  const cacheRate = price.cachedInputPerMillionUsd ?? price.inputPerMillionUsd;
  return (
    uncached * price.inputPerMillionUsd +
    cached * cacheRate +
    finite(outputTokens) * price.outputPerMillionUsd
  ) / 1_000_000;
}

export function calculateWorkflowLedger(inputs: readonly WorkflowLedgerInput[]): WorkflowLedgerResult {
  const rows = inputs.map((input): WorkflowLedgerRowResult => {
    const attempts = Math.trunc(finite(input.attempts));
    const acceptedAnswers = Math.min(Math.trunc(finite(input.acceptedAnswers)), attempts);
    const modeledCostUsd = tokenCost(input.price, input.inputTokens, input.cachedInputTokens, input.outputTokens);
    const acceptanceRatePercentage = attempts > 0 ? acceptedAnswers / attempts * 100 : 0;
    return {
      id: input.id,
      project: input.project.trim() || "Unlabelled project",
      workflow: input.workflow.trim() || "Unlabelled workflow",
      priceId: input.price.id,
      providerLabel: input.price.providerLabel,
      modelLabel: input.price.label,
      modeledCostUsd,
      acceptedAnswers,
      acceptanceRatePercentage,
      costPerAcceptedAnswerUsd: acceptedAnswers > 0 ? modeledCostUsd / acceptedAnswers : null,
      nonAcceptedAttemptCostUsd: attempts > 0 ? modeledCostUsd * ((attempts - acceptedAnswers) / attempts) : 0,
    };
  });
  const modeledCostUsd = rows.reduce((total, row) => total + row.modeledCostUsd, 0);
  const totalAttempts = inputs.reduce((total, input) => total + Math.trunc(finite(input.attempts)), 0);
  const totalAcceptedAnswers = rows.reduce((total, row) => total + row.acceptedAnswers, 0);
  const projectCosts = new Map<string, number>();
  for (const row of rows) projectCosts.set(row.project, (projectCosts.get(row.project) ?? 0) + row.modeledCostUsd);
  const projects = [...projectCosts.entries()]
    .map(([project, cost]) => ({ project, modeledCostUsd: cost, sharePercentage: modeledCostUsd > 0 ? cost / modeledCostUsd * 100 : 0 }))
    .sort((left, right) => right.modeledCostUsd - left.modeledCostUsd);
  const largestWorkflow = rows.reduce<WorkflowLedgerRowResult | null>(
    (largest, row) => !largest || row.modeledCostUsd > largest.modeledCostUsd ? row : largest,
    null,
  );

  return {
    rows: [...rows].sort((left, right) => right.modeledCostUsd - left.modeledCostUsd),
    projects,
    modeledCostUsd,
    totalAttempts,
    totalAcceptedAnswers,
    acceptanceRatePercentage: totalAttempts > 0 ? totalAcceptedAnswers / totalAttempts * 100 : 0,
    costPerAcceptedAnswerUsd: totalAcceptedAnswers > 0 ? modeledCostUsd / totalAcceptedAnswers : null,
    nonAcceptedAttemptCostUsd: rows.reduce((total, row) => total + row.nonAcceptedAttemptCostUsd, 0),
    largestWorkflow,
  };
}

export function parseWorkflowLedgerCsv(csv: string, allowedPriceIds: ReadonlySet<string>): WorkflowLedgerCsvRow[] {
  if (new TextEncoder().encode(csv).byteLength > 500_000) throw new RangeError("CSV must be 500 KB or smaller.");
  const records = parseCsvRecords(csv);
  if (records.length < 2) throw new RangeError("CSV must contain a header and at least one data row.");
  const headers = records[0].map((value) => value.trim());
  if (headers.join(",") !== workflowLedgerCsvHeaders.join(",")) {
    throw new RangeError(`CSV header must be: ${workflowLedgerCsvHeaders.join(",")}`);
  }
  const dataRows = records.slice(1).filter((record) => record.some((value) => value.trim() !== ""));
  if (dataRows.length > 500) throw new RangeError("CSV supports at most 500 workflow rows.");

  return dataRows.map((record, index) => {
    const line = index + 2;
    if (record.length !== workflowLedgerCsvHeaders.length) throw new RangeError(`Line ${line} must have ${workflowLedgerCsvHeaders.length} columns.`);
    const [project, workflow, priceId, ...numericValues] = record.map((value) => value.trim());
    if (!project || !workflow) throw new RangeError(`Line ${line} needs both project and workflow names.`);
    if (project.length > 80 || workflow.length > 80) throw new RangeError(`Line ${line} names must be 80 characters or fewer.`);
    if (!allowedPriceIds.has(priceId)) throw new RangeError(`Line ${line} uses an unknown or inactive rate_card_id: ${priceId}`);
    const numbers = numericValues.map((value) => Number(value));
    if (numbers.some((value) => !Number.isSafeInteger(value) || value < 0)) throw new RangeError(`Line ${line} token and answer fields must be non-negative integers.`);
    const [inputTokens, cachedInputTokens, outputTokens, attempts, acceptedAnswers] = numbers;
    if (cachedInputTokens > inputTokens) throw new RangeError(`Line ${line} cached_input_tokens cannot exceed input_tokens.`);
    if (acceptedAnswers > attempts) throw new RangeError(`Line ${line} accepted_answers cannot exceed attempts.`);
    return {
      id: `csv-${line}-${project}-${workflow}`,
      project,
      workflow,
      priceId,
      inputTokens,
      cachedInputTokens,
      outputTokens,
      attempts,
      acceptedAnswers,
    };
  });
}

function parseCsvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new RangeError("CSV contains an unclosed quoted field.");
  if (field !== "" || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }
  return records;
}
