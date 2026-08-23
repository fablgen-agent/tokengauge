import { describe, expect, it } from "vitest";

import { labStarter } from "@/lib/lab-starter";
import { recordedMeasurement } from "@/lib/recorded-measurement";

describe("recorded measurement audit fixture", () => {
  it("keeps the published demonstration metrics exact", () => {
    expect(recordedMeasurement.date).toBe("2026-08-16");
    expect(recordedMeasurement.model).toBe("GPT-5.5");
    expect(recordedMeasurement.metrics.map((metric) => metric.usage)).toEqual([
      { input: 63, output: 109, reasoning: 20, total: 172 },
      { input: 63, output: 94, reasoning: 0, total: 157 },
    ]);
  });

  it("never presents missing output text as a reconstructed result", () => {
    expect(recordedMeasurement.originalOutputs).toBe("not-retained");
    expect(recordedMeasurement.taskProvenance).toContain("not published");
    expect(recordedMeasurement.task).toBe(labStarter.task);
    expect(recordedMeasurement.instructions).toBe(labStarter.instructions);
    expect(recordedMeasurement.metrics.every((metric) => metric.usage.total === metric.usage.input + metric.usage.output)).toBe(true);
  });
});
