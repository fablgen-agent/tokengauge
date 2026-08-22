import { beforeEach, describe, expect, it, vi } from "vitest";

const requireOwnerAccount = vi.fn();
const recordFunnelEvent = vi.fn();

vi.mock("@/lib/access", () => ({ requireOwnerAccount }));
vi.mock("@/lib/db", () => ({ recordFunnelEvent }));
vi.mock("@/lib/env", () => ({
  getAppUrl: () => "https://tokengauge.enby.fish",
}));

const { GET } = await import("./route");

describe("checkout cancellation return", () => {
  beforeEach(() => {
    requireOwnerAccount.mockReset();
    recordFunnelEvent.mockReset();
  });

  it("preserves a valid selected plan and counts an authenticated cancellation", async () => {
    requireOwnerAccount.mockResolvedValue({ accountId: "account-one" });

    const response = await GET(new Request("https://tokengauge.enby.fish/api/checkout/cancel?plan=ultimate"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://tokengauge.enby.fish/?checkout=cancelled&plan=ultimate#pricing");
    expect(recordFunnelEvent).toHaveBeenCalledOnce();
    expect(recordFunnelEvent).toHaveBeenCalledWith("checkout_cancelled");
  });

  it("falls back to Pro and does not count an unauthenticated visit", async () => {
    requireOwnerAccount.mockRejectedValue(new Response("Sign in first.", { status: 401 }));

    const response = await GET(new Request("https://tokengauge.enby.fish/api/checkout/cancel?plan=bogus"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://tokengauge.enby.fish/?checkout=cancelled&plan=pro#pricing");
    expect(recordFunnelEvent).not.toHaveBeenCalled();
  });
});
