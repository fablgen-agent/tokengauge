export const serviceEnquiryKinds = ["attribution", "budget_guard"] as const;
export type ServiceEnquiryKind = (typeof serviceEnquiryKinds)[number];

export type ServiceEnquiry = {
  service: ServiceEnquiryKind;
  email: string;
  publicUrl: string;
  stack: string;
  provider: string;
  summary: string;
  timing?: string;
  website: string;
  startedAt: number;
  measurementOff: boolean;
};

type ParseResult = { success: true; data: ServiceEnquiry } | { success: false; error: string };

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.trim();
  if (!result || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) return undefined;
  return result;
}

export function parseServiceEnquiry(value: unknown, now = Date.now()): ParseResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { success: false, error: "Invalid request." };
  const body = value as Record<string, unknown>;
  const service = typeof body.service === "string" && serviceEnquiryKinds.includes(body.service as ServiceEnquiryKind)
    ? body.service as ServiceEnquiryKind
    : undefined;
  const email = clean(body.email, 254);
  const publicUrl = clean(body.publicUrl, 500);
  const stack = clean(body.stack, 120);
  const provider = clean(body.provider, 120);
  const summary = clean(body.summary, 2_000);
  const timing = typeof body.timing === "string" && body.timing.trim() ? clean(body.timing, 120) : undefined;
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : Number.NaN;
  const measurementOff = body.measurementOff === true;

  if (website) return { success: false, error: "Unable to send this request." };
  if (!service || !email || !publicUrl || !stack || !provider || !summary) {
    return { success: false, error: "Complete every required field." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: "Enter a valid reply email." };
  try {
    const url = new URL(publicUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    return { success: false, error: "Enter a public http or https URL." };
  }
  if (summary.length < 40) return { success: false, error: "Describe the requested outcome in at least 40 characters." };
  if (!Number.isFinite(startedAt) || now - startedAt < 3_000 || now - startedAt > 86_400_000) {
    return { success: false, error: "Refresh the page and try again." };
  }
  return { success: true, data: { service, email, publicUrl, stack, provider, summary, timing, website, startedAt, measurementOff } };
}
