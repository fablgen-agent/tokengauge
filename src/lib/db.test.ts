import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const testDirectory = mkdtempSync(join(tmpdir(), "tokengauge-test-"));
process.env.TOKEN_GAUGE_DB_PATH = join(testDirectory, "test.sqlite");
process.env.LWC_SECRET = "test-secret-that-is-long-enough-for-token-gauge-auth-and-vault";

const db = await import("./db");
const vault = await import("./provider-vault");

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

  it("moves a legacy ChatGPT entitlement only after an explicit account link", () => {
    db.upsertUser({ accountId: "chatgpt-legacy", billingUserId: "tg-chatgpt-legacy" });
    db.upsertUser({ accountId: "product-user", billingUserId: "tg-product-user" });
    db.grantEntitlement({ accountId: "chatgpt-legacy", checkoutSessionId: "cs_test_legacy" });

    const result = db.linkChatGPTAccount({
      chatgptAccountId: "chatgpt-legacy",
      productAccountId: "product-user",
    });
    expect(result).toEqual({ linked: true, entitlementMoved: true });
    expect(db.hasEntitlement("chatgpt-legacy")).toBe(false);
    expect(db.hasEntitlement("product-user")).toBe(true);
    expect(db.linkedChatGPTAccount("product-user")).toBe("chatgpt-legacy");
  });

  it("consolidates a legacy entitlement when the product account has an older tier row", () => {
    db.upsertUser({ accountId: "chatgpt-repurchase", billingUserId: "tg-chatgpt-repurchase" });
    db.upsertUser({ accountId: "product-repurchase", billingUserId: "tg-product-repurchase" });
    db.grantEntitlement({ accountId: "product-repurchase", checkoutSessionId: "cs_old_product", paymentIntentId: "pi_old_product" });
    db.revokeEntitlementByPaymentIntent("pi_old_product");
    db.grantEntitlement({ accountId: "chatgpt-repurchase", checkoutSessionId: "cs_new_chatgpt", paymentIntentId: "pi_new_chatgpt" });

    expect(db.linkChatGPTAccount({ chatgptAccountId: "chatgpt-repurchase", productAccountId: "product-repurchase" }))
      .toEqual({ linked: true, entitlementMoved: true });
    expect(db.hasEntitlement("chatgpt-repurchase")).toBe(false);
    expect(db.hasEntitlement("product-repurchase")).toBe(true);
  });

  it("selects the highest active paid plan and falls back after a refund", () => {
    db.upsertUser({ accountId: "tier-user", billingUserId: "tg-tier-user" });
    db.grantEntitlement({ accountId: "tier-user", checkoutSessionId: "cs_pro", paymentIntentId: "pi_pro", key: "pro" });
    db.grantEntitlement({ accountId: "tier-user", checkoutSessionId: "cs_plus", paymentIntentId: "pi_plus", key: "pro_plus" });
    expect(db.planForAccount("tier-user")).toBe("pro_plus");
    db.revokeEntitlementByPaymentIntent("pi_plus");
    expect(db.planForAccount("tier-user")).toBe("pro");
  });

  it("encrypts provider credentials and never stores the plaintext key", () => {
    db.upsertUser({ accountId: "vault-user", billingUserId: "tg-vault-user" });
    const apiKey = "sk-test-provider-secret-value";
    vault.saveProviderCredential({ accountId: "vault-user", providerId: "openai", apiKey });
    const stored = db.providerConnectionRecord("vault-user", "openai");
    expect(stored?.encrypted_key).not.toContain(apiKey);
    expect(stored?.key_hint).toBe("alue");
    expect(vault.getProviderCredential("vault-user", "openai")?.apiKey).toBe(apiKey);
    expect(vault.deleteProviderCredential("vault-user", "openai")).toBe(true);
  });

  it("summarizes experiment deltas and persists optional method status", () => {
    db.upsertUser({ accountId: "dashboard-user", billingUserId: "tg-dashboard-user" });
    db.saveExperiment({
      id: "experiment-one",
      accountId: "dashboard-user",
      providerId: "openai",
      strategyId: "cap-output",
      model: "gpt-5.6-luna",
      baseline: { input: 20, output: 40, total: 60 },
      optimized: { input: 20, output: 25, total: 45 },
    });
    expect(db.experimentSummaries("dashboard-user")[0]).toMatchObject({ providerId: "openai", tokenDelta: 15 });
    db.setMethodProgress("dashboard-user", "cap-output", "testing");
    expect(db.methodProgress("dashboard-user")).toEqual({ "cap-output": "testing" });
    db.setMethodProgress("dashboard-user", "cap-output", "none");
    expect(db.methodProgress("dashboard-user")).toEqual({});
  });
});
