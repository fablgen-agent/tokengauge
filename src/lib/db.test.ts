import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const testDirectory = mkdtempSync(join(tmpdir(), "tokengauge-test-"));
process.env.TOKEN_GAUGE_DB_PATH = join(testDirectory, "test.sqlite");

const db = await import("./db");

describe("durable state", () => {
  it("round-trips namespaced values and expires stale ones", async () => {
    const store = new db.SqliteKeyValueStore<{ answer: number }>("test");
    store.set("live", { answer: 42 });
    expect(store.get("live")).toEqual({ answer: 42 });

    store.set("short", { answer: 1 }, { ttlMs: 1 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(store.get("short")).toBeUndefined();
  });

  it("grants and revokes the same entitlement idempotently", () => {
    db.upsertUser({ accountId: "account-1", billingUserId: "tg-billing-1" });
    db.grantEntitlement({ accountId: "account-1", checkoutSessionId: "cs_test_one", paymentIntentId: "pi_test_one" });
    db.grantEntitlement({ accountId: "account-1", checkoutSessionId: "cs_test_one", paymentIntentId: "pi_test_one" });
    expect(db.hasEntitlement("account-1")).toBe(true);
    expect(db.findAccountByBillingId("tg-billing-1")).toBe("account-1");

    db.revokeEntitlementByPaymentIntent("pi_test_one");
    expect(db.hasEntitlement("account-1")).toBe(false);
  });

  it("deduplicates Stripe event identifiers", () => {
    expect(db.markStripeEvent("evt_one", "checkout.session.completed")).toBe(true);
    expect(db.markStripeEvent("evt_one", "checkout.session.completed")).toBe(false);
  });
});
