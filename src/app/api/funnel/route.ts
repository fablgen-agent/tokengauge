import { recordFunnelEvent } from "@/lib/db";
import { getAppUrl } from "@/lib/env";
import { isFunnelEvent } from "@/lib/funnel-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(getAppUrl(request)).origin) {
    return Response.json({ error: "Same-origin request required." }, { status: 403 });
  }
  try {
    const text = await request.text();
    if (text.length > 128) {
      return Response.json({ error: "Request too large." }, { status: 413 });
    }
    const body = JSON.parse(text) as { event?: unknown };
    if (!isFunnelEvent(body.event) || body.event.startsWith("checkout_")) {
      return Response.json({ error: "Unknown funnel event." }, { status: 400 });
    }
    recordFunnelEvent(body.event);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
