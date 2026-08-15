import { describe, expect, it } from "vitest";

import { highestPlan, isPaidPlanId, planAtLeast, planDefinition } from "./plans";
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
});
