export const serviceEnquiryKinds = [
  "attribution",
  "budget_guard",
  "static_form",
  "cms_form",
  "booking_selection",
  "publii_theme",
  "publii_plugin",
  "private_room",
  "private_team_threads",
  "alert_feed",
  "other",
] as const;
export type ServiceEnquiryKind = (typeof serviceEnquiryKinds)[number];

export type ServiceEnquiryCopy = {
  stackLabel: string;
  stackPlaceholder: string;
  providerLabel: string;
  providerPlaceholder: string;
  summaryLabel: string;
  summaryPlaceholder: string;
  acceptancePlaceholder: string;
  acceptanceRequired: boolean;
};

const aiServiceCopy = {
  stackLabel: "Application stack",
  stackPlaceholder: "For example, Node.js/TypeScript or Python",
  providerLabel: "Model provider",
  providerPlaceholder: "For example, OpenAI",
} as const;

export const serviceEnquiryCopy: Record<ServiceEnquiryKind, ServiceEnquiryCopy> = {
  attribution: {
    ...aiServiceCopy,
    summaryLabel: "Requested attribution outcome",
    summaryPlaceholder: "Which workflow should be attributed, and what must the export prove?",
    acceptancePlaceholder: "Optional: which observable checks would prove the agreed result works?",
    acceptanceRequired: false,
  },
  budget_guard: {
    ...aiServiceCopy,
    summaryLabel: "Requested budget boundary",
    summaryPlaceholder: "Which request path needs a budget boundary, and what should happen when the allowance is insufficient?",
    acceptancePlaceholder: "Optional: which observable checks would prove the agreed result works?",
    acceptanceRequired: false,
  },
  static_form: {
    stackLabel: "Site stack or builder",
    stackPlaceholder: "For example, static HTML, GitHub Pages, or a Webflow export",
    providerLabel: "Current delivery route or Inspector rule",
    providerPlaceholder: "For example, no endpoint or cancelled-submit-without-delivery",
    summaryLabel: "Requested form outcome",
    summaryPlaceholder: "Name the exact public form, its owner-controlled delivery route, and the expected visitor result.",
    acceptancePlaceholder: "For example, a tagged synthetic message reaches the owner-controlled destination and failure stays visible.",
    acceptanceRequired: true,
  },
  cms_form: {
    stackLabel: "CMS and form plugin",
    stackPlaceholder: "For example, Craft CMS 5 with Formie, or WordPress with Gravity Forms",
    providerLabel: "Current delivery or mail route",
    providerPlaceholder: "For example, existing SMTP relay; form is currently disabled",
    summaryLabel: "Requested form outcome",
    summaryPlaceholder: "Identify one public form, its current failure, and the existing behavior that should be restored.",
    acceptancePlaceholder: "Describe the synthetic staging test and observable mail handoff that will prove the repair.",
    acceptanceRequired: true,
  },
  booking_selection: {
    stackLabel: "Booking platform or integration",
    stackPlaceholder: "For example, WordPress with an existing booking plugin",
    providerLabel: "Observed public state",
    providerPlaceholder: "For example, dates appear unavailable while selection controls remain active",
    summaryLabel: "Requested booking outcome",
    summaryPlaceholder: "Describe the one availability or selection step to restore, stopping at the existing checkout handoff.",
    acceptancePlaceholder: "For example, valid dates progress, invalid dates stop honestly, and no order or payment is placed.",
    acceptanceRequired: true,
  },
  publii_theme: {
    stackLabel: "Publii and theme version",
    stackPlaceholder: "For example, Publii 0.47 with the Simple theme",
    providerLabel: "Current theme behavior",
    providerPlaceholder: "Name the template, screen size, or output that needs changing",
    summaryLabel: "Requested theme outcome",
    summaryPlaceholder: "Describe the bounded visual or template change and where it must appear in the generated site.",
    acceptancePlaceholder: "List the generated pages and viewport checks that will prove the theme change works.",
    acceptanceRequired: true,
  },
  publii_plugin: {
    stackLabel: "Publii and plugin version",
    stackPlaceholder: "For example, Publii 0.47 and plugin release 1.2.0",
    providerLabel: "Current plugin behavior",
    providerPlaceholder: "Name the broken hook, generated file, or user-visible behavior",
    summaryLabel: "Requested plugin outcome",
    summaryPlaceholder: "Describe one repair or small feature and the generated-site behavior it must produce.",
    acceptancePlaceholder: "List the build, generated-file, or UI checks that will prove the plugin change works.",
    acceptanceRequired: true,
  },
  private_room: {
    stackLabel: "Current collaboration setup",
    stackPlaceholder: "For example, email plus shared files for a team of eight",
    providerLabel: "Customer-controlled deployment target",
    providerPlaceholder: "For example, an existing Ubuntu VPS and owned domain",
    summaryLabel: "Requested room workflow",
    summaryPlaceholder: "Describe the bounded private-room workflow, initial users, and handoff you need.",
    acceptancePlaceholder: "List the login, message, backup, and owner-admin checks that will prove the pilot works.",
    acceptanceRequired: true,
  },
  private_team_threads: {
    stackLabel: "Customer-controlled deployment target",
    stackPlaceholder: "For example, a fresh Ubuntu 24.04 x86_64 VM",
    providerLabel: "Public hostname, SMTP, and access route",
    providerPlaceholder: "For example, owned public DNS, inbound 80/443, Certbot, and customer SMTP",
    summaryLabel: "Requested threaded-team workflow",
    summaryPlaceholder: "Describe the initial accounts, private channels, guests, and topic-resolution workflow you need.",
    acceptancePlaceholder: "List the member/guest boundary, topic resolution, SMTP, backup, and owner-admin checks that must pass.",
    acceptanceRequired: true,
  },
  alert_feed: {
    stackLabel: "Consumer stack",
    stackPlaceholder: "For example, a static site, Slack-compatible webhook, or RSS reader",
    providerLabel: "Alert source and format",
    providerPlaceholder: "For example, official CAP, RSS, JSON, or webhook events",
    summaryLabel: "Requested alert outcome",
    summaryPlaceholder: "Describe the source, filter, and feed, webhook, or widget output you need.",
    acceptancePlaceholder: "List representative alerts and the observable filtering or delivery checks that will prove it works.",
    acceptanceRequired: true,
  },
  other: {
    stackLabel: "Relevant stack or platform",
    stackPlaceholder: "Name the existing software, language, or site builder",
    providerLabel: "Current behavior",
    providerPlaceholder: "Describe the public failure or missing workflow in one line",
    summaryLabel: "Requested outcome",
    summaryPlaceholder: "Describe one bounded result that can be assessed from public context.",
    acceptancePlaceholder: "List the observable checks that would prove the agreed result works.",
    acceptanceRequired: true,
  },
};

export const portfolioServiceOptions: readonly { id: ServiceEnquiryKind; label: string; price: string; scopeUrl?: string }[] = [
  { id: "static_form", label: "Static contact-form repair", price: "£35 fixed", scopeUrl: "https://fablgen-agent.github.io/fablgen-agent/contact-form-repair/" },
  { id: "cms_form", label: "CMS contact-form restoration", price: "£75 fixed", scopeUrl: "https://fablgen-agent.github.io/fablgen-agent/cms-form-repair/" },
  { id: "booking_selection", label: "Booking availability / selection repair", price: "£75 fixed", scopeUrl: "https://fablgen-agent.github.io/fablgen-agent/booking-selection-repair/" },
  { id: "publii_theme", label: "Publii theme customization", price: "£25 / £45 / £75 scopes", scopeUrl: "https://fablgen-agent.github.io/fablgen-agent/publii-theme-customization/" },
  { id: "publii_plugin", label: "Publii plugin repair or feature", price: "£45 / £75 fixed", scopeUrl: "https://fablgen-agent.github.io/fablgen-agent/publii-plugin-repair/" },
  { id: "attribution", label: "AI cost-attribution setup", price: "£75 fixed", scopeUrl: "https://tokengauge.enby.fish/services/attribution" },
  { id: "budget_guard", label: "AI application budget guard", price: "£75 fixed", scopeUrl: "https://tokengauge.enby.fish/services/budget-guard" },
  { id: "private_room", label: "Private Client Room pilot", price: "£199 fixed pilot", scopeUrl: "https://room.enby.fish/" },
  { id: "private_team_threads", label: "Private Team Threads pilot", price: "£199 fixed pilot", scopeUrl: "https://threads.enby.fish/" },
  { id: "alert_feed", label: "Alert feed, webhook, or widget", price: "£15 / £45 / £75 scopes", scopeUrl: "https://fablgen-agent.github.io/uk-alert-watch/global/" },
  { id: "other", label: "Another small software request", price: "Written scope first" },
] as const;

export type ServiceEnquiry = {
  service: ServiceEnquiryKind;
  email: string;
  publicUrl: string;
  stack: string;
  provider: string;
  summary: string;
  acceptanceChecks?: string;
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
  const acceptanceChecks = typeof body.acceptanceChecks === "string" && body.acceptanceChecks.trim()
    ? clean(body.acceptanceChecks, 1_000)
    : undefined;
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
  if (!(["attribution", "budget_guard"] as ServiceEnquiryKind[]).includes(service) && (!acceptanceChecks || acceptanceChecks.length < 20)) {
    return { success: false, error: "Describe the acceptance checks in at least 20 characters." };
  }
  if (!Number.isFinite(startedAt) || now - startedAt < 3_000 || now - startedAt > 86_400_000) {
    return { success: false, error: "Refresh the page and try again." };
  }
  return { success: true, data: { service, email, publicUrl, stack, provider, summary, acceptanceChecks, timing, website, startedAt, measurementOff } };
}
