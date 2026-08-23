import { describe, expect, it } from "vitest";

import { funnelOriginAllowed } from "./funnel-origin";

describe("funnel origin allowlist", () => {
  it("accepts the configured application and branded work origins", () => {
    expect(funnelOriginAllowed("https://tokengauge.enby.fish", "https://tokengauge.enby.fish")).toBe(true);
    expect(funnelOriginAllowed("https://work.enby.fish", "https://tokengauge.enby.fish")).toBe(true);
  });

  it("rejects missing, malformed, and unrelated origins", () => {
    expect(funnelOriginAllowed(null, "https://tokengauge.enby.fish")).toBe(false);
    expect(funnelOriginAllowed("not-an-origin", "https://tokengauge.enby.fish")).toBe(false);
    expect(funnelOriginAllowed("https://example.com", "https://tokengauge.enby.fish")).toBe(false);
  });
});
