import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountPanel } from "@/components/account-panel";
import { paidPlans } from "@/lib/plans";

describe("account panel purchase handoff", () => {
  it("server-renders a specific purchase path for every paid plan", () => {
    for (const plan of paidPlans) {
      const markup = renderToStaticMarkup(createElement(AccountPanel, { targetPlan: plan.id }));

      expect(markup).toContain(`href="/account?plan=${plan.id}"`);
      expect(markup).toContain(`Continue to ${plan.name}`);
      expect(markup).toContain(`before ${plan.name} checkout`);
      expect(markup).not.toContain("TokenGauge account");
    }
  });
});
