import { describe, expect, it } from "vitest";

import { isFunnelEvent } from "./funnel-events";

describe("funnel events", () => {
  it("accepts each privacy-safe budget-guard conversion step", () => {
    expect(isFunnelEvent("cta_budget_guide_service")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_email")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_telegram")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_github")).toBe(true);
  });

  it("rejects arbitrary event names", () => {
    expect(isFunnelEvent("cta_service_budget_guard_customer_123")).toBe(false);
  });
});
