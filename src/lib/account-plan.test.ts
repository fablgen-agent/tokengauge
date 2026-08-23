import { describe, expect, it } from "vitest";

import { accountPlanCallbackUrl, accountPlanContext } from "@/lib/account-plan";
import { launchPricesGbp, paidPlans } from "@/lib/plans";

describe("account plan handoff", () => {
  it("shows the exact Launch 100 price for every paid plan while places remain", () => {
    for (const plan of paidPlans) {
      expect(accountPlanContext(plan.id, true)).toMatchObject({
        id: plan.id,
        name: plan.name,
        priceGbp: launchPricesGbp[plan.id],
        standardPriceGbp: plan.priceGbp,
        launchPrice: true,
      });
    }
  });

  it("returns every paid plan to its standard price after the launch offer is exhausted", () => {
    for (const plan of paidPlans) {
      expect(accountPlanContext(plan.id, false)).toMatchObject({
        id: plan.id,
        priceGbp: plan.priceGbp,
        standardPriceGbp: plan.priceGbp,
        launchPrice: false,
      });
    }
  });

  it("preserves the selected plan through account authentication", () => {
    expect(accountPlanCallbackUrl("pro")).toBe("/account?plan=pro");
    expect(accountPlanCallbackUrl("pro_plus")).toBe("/account?plan=pro_plus");
    expect(accountPlanCallbackUrl("ultimate")).toBe("/account?plan=ultimate");
  });
});

