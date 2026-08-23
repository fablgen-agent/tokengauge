import { createHmac } from "node:crypto";

import { sendServiceEnquiry } from "@/lib/auth-email";
import { recordFunnelEvent } from "@/lib/db";
import { getAppUrl, getProductAuthSecret } from "@/lib/env";
import { parseServiceEnquiry } from "@/lib/service-enquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, number[]>();

function rateLimited(request: Request, now = Date.now()): boolean {
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHmac("sha256", getProductAuthSecret()).update(`service-enquiry:${address}`).digest("base64url");
  const recent = (attempts.get(key) || []).filter((time) => now - time < 60 * 60 * 1_000);
  if (recent.length >= 3) return true;
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 1_000) {
    for (const [candidate, times] of attempts) {
      if (!times.some((time) => now - time < 60 * 60 * 1_000)) attempts.delete(candidate);
    }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(getAppUrl(request)).origin) {
    return Response.json({ error: "Same-origin request required." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return Response.json({ error: "Request too large." }, { status: 413 });
  if (rateLimited(request)) return Response.json({ error: "Too many requests. Try again in an hour or use email." }, { status: 429 });

  try {
    const text = await request.text();
    if (text.length > 12_000) return Response.json({ error: "Request too large." }, { status: 413 });
    const parsed = parseServiceEnquiry(JSON.parse(text));
    if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });
    await sendServiceEnquiry(parsed.data);
    recordFunnelEvent(parsed.data.service === "attribution" ? "service_attribution_enquiry_sent" : "service_budget_guard_enquiry_sent");
    return Response.json({ ok: true });
  } catch {
    console.error("TokenGauge service enquiry delivery failed.");
    return Response.json({ error: "The request could not be sent. Use the email link instead." }, { status: 502 });
  }
}
