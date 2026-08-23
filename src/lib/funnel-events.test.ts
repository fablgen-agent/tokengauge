import { describe, expect, it } from "vitest";

import { isFunnelEvent } from "./funnel-events";

describe("funnel events", () => {
  it("accepts each privacy-safe attribution-service enquiry channel", () => {
    expect(isFunnelEvent("cta_service_attribution_email")).toBe(true);
    expect(isFunnelEvent("cta_service_attribution_telegram")).toBe(true);
    expect(isFunnelEvent("cta_service_attribution_github")).toBe(true);
  });

  it("accepts each privacy-safe budget-guard conversion step", () => {
    expect(isFunnelEvent("cta_budget_guide_service")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_email")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_telegram")).toBe(true);
    expect(isFunnelEvent("cta_service_budget_guard_github")).toBe(true);
  });

  it("accepts the portfolio work-desk view and aggregate success", () => {
    expect(isFunnelEvent("view_work_request")).toBe(true);
    expect(isFunnelEvent("service_portfolio_enquiry_sent")).toBe(true);
  });

  it("rejects arbitrary event names", () => {
    expect(isFunnelEvent("cta_service_attribution_customer_123")).toBe(false);
    expect(isFunnelEvent("cta_service_budget_guard_customer_123")).toBe(false);
  });
});
