import { describe, expect, it } from "vitest";

import { highestPlan, isPaidPlanId, launchPricesGbp, planAtLeast, planDefinition } from "./plans";
import { providerDefinitions } from "./providers";

describe("plan catalogue", () => {
  it("keeps rank comparisons and prices explicit", () => {
    expect(planAtLeast("ultimate", "pro_plus")).toBe(true);
    expect(planAtLeast("pro", "pro_plus")).toBe(false);
    expect(planDefinition("pro_plus").priceGbp).toBe(19);
    expect(planDefinition("ultimate").priceGbp).toBe(39);
  });

  it("rejects free and unknown checkout entitlements", () => {
    expect(isPaidPlanId("pro")).toBe(true);
    expect(isPaidPlanId("free")).toBe(false);
    expect(isPaidPlanId("enterprise")).toBe(false);
    expect(highestPlan(["pro", "ultimate", "unknown"])).toBe("ultimate");
  });

  it("includes every provider adapter with Pro", () => {
    expect(providerDefinitions).toHaveLength(9);
    expect(providerDefinitions.every((provider) => provider.minimumPlan === "pro")).toBe(true);
  });

  it("keeps the launch offer explicit and cheaper than standard access", () => {
    expect(launchPricesGbp).toEqual({ pro: 5, pro_plus: 15, ultimate: 20 });
    expect(launchPricesGbp.pro).toBeLessThan(planDefinition("pro").priceGbp);
    expect(launchPricesGbp.pro_plus).toBeLessThan(planDefinition("pro_plus").priceGbp);
    expect(launchPricesGbp.ultimate).toBeLessThan(planDefinition("ultimate").priceGbp);
  });
});
