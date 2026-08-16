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

  it("stores only daily aggregate funnel counts", () => {
    const first = Date.UTC(2026, 7, 16, 1, 2, 3);
    db.recordFunnelEvent("view_home", first);
    db.recordFunnelEvent("view_home", first + 1000);
    db.recordFunnelEvent("view_attribution_guide", first + 1500);
    db.recordFunnelEvent("cta_pricing", first + 2000);
    db.recordFunnelEvent("cta_service_email", first + 2500);
    expect(db.funnelDailyRows("2026-08-16")).toEqual([
      { day: "2026-08-16", event: "cta_pricing", count: 1 },
      { day: "2026-08-16", event: "cta_service_email", count: 1 },
      { day: "2026-08-16", event: "view_attribution_guide", count: 1 },
      { day: "2026-08-16", event: "view_home", count: 2 },
    ]);
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

  it("assigns exactly 100 launch places and carries one across an account link", () => {
    db.upsertUser({ accountId: "launch-chatgpt", billingUserId: "tg-launch-chatgpt" });
    db.upsertUser({ accountId: "launch-product", billingUserId: "tg-launch-product" });
    expect(db.ensureLaunchOffer("launch-chatgpt")).toMatchObject({ eligible: true, ordinal: 1, remaining: 99 });
    expect(db.linkChatGPTAccount({ chatgptAccountId: "launch-chatgpt", productAccountId: "launch-product" }).linked).toBe(true);
    expect(db.launchOfferStatus("launch-product")).toMatchObject({ eligible: true, ordinal: 1, joined: 1 });

    for (let ordinal = 2; ordinal <= 100; ordinal += 1) {
      const accountId = `launch-user-${ordinal}`;
      db.upsertUser({ accountId, billingUserId: `tg-${accountId}` });
      expect(db.ensureLaunchOffer(accountId)).toMatchObject({ eligible: true, ordinal });
    }
    db.upsertUser({ accountId: "launch-overflow", billingUserId: "tg-launch-overflow" });
    expect(db.ensureLaunchOffer("launch-overflow")).toMatchObject({ eligible: false, joined: 100, remaining: 0 });
  });

  it("exports user-visible data without credential material and clears optional workbench records", () => {
    db.upsertUser({ accountId: "privacy-user", billingUserId: "tg-privacy-user", name: "Privacy User", email: "privacy@example.test" });
    db.grantEntitlement({
      accountId: "privacy-user",
      checkoutSessionId: "cs_privacy",
      paymentIntentId: "pi_privacy",
      amountPaid: 500,
      currency: "gbp",
    });
    vault.saveProviderCredential({ accountId: "privacy-user", providerId: "openai", apiKey: "sk-private-export-secret" });
    db.saveExperiment({
      id: "privacy-experiment",
      accountId: "privacy-user",
      providerId: "openai",
      strategyId: "cap-output",
      model: "gpt-test",
      baseline: { input: 10, output: 20, total: 30 },
      optimized: { input: 10, output: 10, total: 20 },
    });
    db.setMethodProgress("privacy-user", "cap-output", "adopted");

    const exported = db.accountPrivacyExport("privacy-user");
    expect(exported.profile).toMatchObject({ name: "Privacy User", email: "privacy@example.test" });
    expect(exported.access[0]).toMatchObject({ plan: "pro", amountPaidMinor: 500, currency: "gbp" });
    expect(exported.providerConnections[0]).toMatchObject({ providerId: "openai", keyHint: "cret" });
    expect(exported.experiments).toHaveLength(1);
    expect(exported.methodProgress).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toContain("sk-private-export-secret");
    expect(JSON.stringify(exported)).not.toContain("encrypted_key");
    expect(JSON.stringify(exported)).not.toContain("cs_privacy");
    expect(JSON.stringify(exported)).not.toContain("pi_privacy");

    expect(db.clearAccountWorkbenchData("privacy-user")).toEqual({
      providerConnections: 1,
      experiments: 1,
      methodProgress: 1,
    });
    const cleared = db.accountPrivacyExport("privacy-user");
    expect(cleared.providerConnections).toEqual([]);
    expect(cleared.experiments).toEqual([]);
    expect(cleared.methodProgress).toEqual([]);
    expect(cleared.profile).not.toBeNull();
    expect(cleared.access).toHaveLength(1);
  });
});
