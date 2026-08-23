import { describe, expect, it } from "vitest";

import { modelPrices } from "@/lib/costs";
import { calculateWorkflowLedger, parseWorkflowLedgerCsv } from "@/lib/workflow-ledger";

const terra = modelPrices.find((price) => price.id === "openai:gpt-5.6-terra:standard:short")!;
const cohere = modelPrices.find((price) => price.id === "cohere:command-a-03-2025:standard")!;

describe("workflow ledger", () => {
  it("attributes modeled spend and quality-adjusted economics by workflow and project", () => {
    const result = calculateWorkflowLedger([
      { id: "support", project: "Product", workflow: "Support", price: terra, inputTokens: 1_000_000, cachedInputTokens: 200_000, outputTokens: 100_000, attempts: 100, acceptedAnswers: 80 },
      { id: "extract", project: "Operations", workflow: "Extraction", price: terra, inputTokens: 500_000, cachedInputTokens: 0, outputTokens: 50_000, attempts: 50, acceptedAnswers: 50 },
    ]);

    expect(result.modeledCostUsd).toBeCloseTo(4.44);
    expect(result.totalAttempts).toBe(150);
    expect(result.totalAcceptedAnswers).toBe(130);
    expect(result.acceptanceRatePercentage).toBeCloseTo(86.6667);
    expect(result.costPerAcceptedAnswerUsd).toBeCloseTo(4.44 / 130);
    expect(result.nonAcceptedAttemptCostUsd).toBeCloseTo(.568);
    expect(result.cacheFallbackRowCount).toBe(0);
    expect(result.rows.find((row) => row.id === "support")?.cacheTreatment).toBe("published-rate");
    expect(result.rows.find((row) => row.id === "extract")?.cacheTreatment).toBe("not-used");
    expect(result.largestWorkflow?.workflow).toBe("Support");
    expect(result.projects[0]).toMatchObject({ project: "Product", modeledCostUsd: 2.84 });
  });

  it("labels ordinary-input fallback only when cached tokens use an unpublished cache rate", () => {
    const result = calculateWorkflowLedger([
      { id: "cached", project: "Product", workflow: "Cached search", price: cohere, inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 0, attempts: 10, acceptedAnswers: 10 },
      { id: "uncached", project: "Product", workflow: "Fresh search", price: cohere, inputTokens: 1_000_000, cachedInputTokens: 0, outputTokens: 0, attempts: 10, acceptedAnswers: 10 },
    ]);

    expect(result.modeledCostUsd).toBeCloseTo(2 * cohere.inputPerMillionUsd);
    expect(result.cacheFallbackRowCount).toBe(1);
    expect(result.rows.find((row) => row.id === "cached")?.cacheTreatment).toBe("ordinary-input-fallback");
    expect(result.rows.find((row) => row.id === "uncached")?.cacheTreatment).toBe("not-used");
  });

  it("parses the exact portable CSV schema including quoted names", () => {
    const csv = [
      "project,workflow,rate_card_id,input_tokens,cached_input_tokens,output_tokens,attempts,accepted_answers",
      `"Product, EU","Support ""brief""",${terra.id},1000,200,100,10,8`,
    ].join("\r\n");
    const rows = parseWorkflowLedgerCsv(csv, new Set([terra.id]));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ project: "Product, EU", workflow: 'Support "brief"', inputTokens: 1000, cachedInputTokens: 200, acceptedAnswers: 8 });
  });

  it("rejects invalid cache, acceptance, and rate-card data rather than silently changing it", () => {
    const header = "project,workflow,rate_card_id,input_tokens,cached_input_tokens,output_tokens,attempts,accepted_answers";
    expect(() => parseWorkflowLedgerCsv(`${header}\nP,W,unknown,10,0,1,1,1`, new Set([terra.id]))).toThrow(/unknown or inactive/);
    expect(() => parseWorkflowLedgerCsv(`${header}\nP,W,${terra.id},10,11,1,1,1`, new Set([terra.id]))).toThrow(/cannot exceed input/);
    expect(() => parseWorkflowLedgerCsv(`${header}\nP,W,${terra.id},10,0,1,1,2`, new Set([terra.id]))).toThrow(/cannot exceed attempts/);
  });
});
