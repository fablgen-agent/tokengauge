export const funnelEvents = [
  "view_home",
  "view_pricing",
  "view_pricing_changes",
  "view_provider_pricing",
  "view_compare",
  "view_atlas",
  "view_library",
  "view_lab",
  "view_account",
  "view_dashboard",
  "view_settings",
  "view_audit",
  "view_ledger",
  "view_attribution_guide",
  "view_service_attribution",
  "view_service_budget_guard",
  "cta_account",
  "cta_pricing",
  "cta_atlas",
  "cta_lab",
  "cta_audit",
  "cta_ledger",
  "cta_service_attribution",
  "cta_service_budget_guard",
  "cta_service_email",
  "account_signup_attempt",
  "account_signin_attempt",
  "account_reset_attempt",
  "checkout_created",
  "checkout_failed",
] as const;

export type FunnelEvent = (typeof funnelEvents)[number];

const allowedEvents = new Set<string>(funnelEvents);

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === "string" && allowedEvents.has(value);
}
