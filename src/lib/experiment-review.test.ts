import { describe, expect, it } from "vitest";

import { orderedArmKeys, qualityVerdict } from "@/lib/experiment-review";

describe("experiment review", () => {
  it("preserves a valid randomized order", () => {
    expect(orderedArmKeys(["candidate", "baseline"])).toEqual(["candidate", "baseline"]);
  });

  it("falls back safely when an order is malformed", () => {
    expect(orderedArmKeys(["candidate", "candidate"])).toEqual(["baseline", "candidate"]);
  });

  it("reports a quality tie before the token reduction", () => {
    expect(qualityVerdict({ choice: "tie", firstKey: "baseline", baselineTokens: 200, candidateTokens: 150 }))
      .toBe("You judged quality a tie. The candidate used 50 fewer tokens.");
  });

  it("does not call a cheaper candidate the winner when baseline quality wins", () => {
    expect(qualityVerdict({ choice: "first", firstKey: "baseline", baselineTokens: 200, candidateTokens: 150 }))
      .toBe("You preferred the baseline output. The candidate used 50 fewer tokens, so token count alone does not make it the winner.");
  });

  it("maps the blinded second output back to the candidate", () => {
    expect(qualityVerdict({ choice: "second", firstKey: "baseline", baselineTokens: 150, candidateTokens: 180 }))
      .toBe("You preferred the candidate output. It used 30 more tokens.");
  });
});
