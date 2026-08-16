export const funnelEvents = [
  "view_home",
  "view_pricing",
  "view_provider_pricing",
  "view_compare",
  "view_atlas",
  "view_library",
  "view_lab",
  "view_account",
  "view_dashboard",
  "view_settings",
  "cta_account",
  "cta_pricing",
  "cta_atlas",
  "cta_lab",
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
