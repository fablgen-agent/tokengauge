import { requireOwnerAccount } from "@/lib/access";
import { recordFunnelEvent } from "@/lib/db";
import { getAppUrl } from "@/lib/env";
import { isPaidPlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const requestedPlan = new URL(request.url).searchParams.get("plan");
  const plan = isPaidPlanId(requestedPlan) ? requestedPlan : "pro";
  try {
    await requireOwnerAccount(request);
    recordFunnelEvent("checkout_cancelled");
  } catch (error) {
    if (!(error instanceof Response)) {
      console.error("Unable to record aggregate checkout cancellation", error);
    }
  }

  const destination = new URL("/", getAppUrl(request));
  destination.searchParams.set("checkout", "cancelled");
  destination.searchParams.set("plan", plan);
  destination.hash = "pricing";
  return Response.redirect(destination, 303);
}
