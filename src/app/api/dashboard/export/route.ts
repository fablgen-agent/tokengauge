import { requireOwnerAccount } from "@/lib/access";
import { experimentSummaries } from "@/lib/db";
import { planAtLeast } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const account = await requireOwnerAccount(request);
    if (!planAtLeast(account.accessPlan, "pro_plus")) {
      return Response.json({ error: "CSV export requires Pro+." }, { status: 403 });
    }
    const rows = experimentSummaries(account.accountId, account.accessPlan === "ultimate" ? 1_000 : 250);
    const lines = [
      ["experiment_id", "date_utc", "provider", "model", "strategy", "baseline_tokens", "candidate_tokens", "measured_delta_tokens"],
      ...rows.map((row) => [row.id, new Date(row.createdAt).toISOString(), row.providerId, row.model, row.strategyId, row.baselineTotal, row.optimizedTotal, row.tokenDelta]),
    ];
    return new Response(lines.map((line) => line.map(csvCell).join(",")).join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=tokengauge-experiments.csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Experiment export could not be created." }, { status: 500 });
  }
}
