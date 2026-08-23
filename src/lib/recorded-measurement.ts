import { labStarter } from "@/lib/lab-starter";

export type RecordedMeasurementUsage = Readonly<{
  input: number;
  output: number;
  reasoning: number;
  total: number;
}>;

export type RecordedMeasurementMetric = Readonly<{
  id: "a" | "b";
  publishedSetting: string;
  usage: RecordedMeasurementUsage;
}>;

/**
 * The public 2026-08-16 demonstration publishes token metrics, but not its
 * prompt/output payloads. Keep this audit honest: it exposes the committed
 * context and metrics without reconstructing an output from token counts.
 */
export const recordedMeasurement = {
  date: "2026-08-16",
  model: "GPT-5.5",
  task: labStarter.task,
  instructions: labStarter.instructions,
  taskProvenance: "Current committed lab starter wording shown for context only; the exact 2026-08-16 demonstration prompt was not published.",
  originalOutputs: "not-retained" as const,
  metrics: [
    {
      id: "a" as const,
      publishedSetting: "Medium reasoning effort",
      usage: { input: 63, output: 109, reasoning: 20, total: 172 },
    },
    {
      id: "b" as const,
      publishedSetting: "Low reasoning effort",
      usage: { input: 63, output: 94, reasoning: 0, total: 157 },
    },
  ] satisfies readonly RecordedMeasurementMetric[],
} as const;
