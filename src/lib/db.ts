import "server-only";

import type { KeyValueStore } from "@opencoredev/loginwithchatgpt-core";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

let singleton: DatabaseSync | undefined;

function databasePath(): string {
  return process.env.TOKEN_GAUGE_DB_PATH?.trim() || resolve(process.cwd(), ".data/tokengauge.sqlite");
}

export function getDatabase(): DatabaseSync {
  if (singleton) return singleton;

  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  singleton = new DatabaseSync(path);
  singleton.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  singleton.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      namespace TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER,
      PRIMARY KEY (namespace, key)
    );
    CREATE TABLE IF NOT EXISTS users (
      account_id TEXT PRIMARY KEY,
      billing_user_id TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      stripe_customer_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      account_id TEXT NOT NULL,
      entitlement_key TEXT NOT NULL,
      checkout_session_id TEXT NOT NULL UNIQUE,
      payment_intent_id TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      granted_at INTEGER NOT NULL,
      revoked_at INTEGER,
      PRIMARY KEY (account_id, entitlement_key),
      FOREIGN KEY (account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS stripe_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      processed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      strategy_id TEXT NOT NULL,
      model TEXT NOT NULL,
      baseline_input INTEGER NOT NULL,
      baseline_output INTEGER NOT NULL,
      baseline_total INTEGER NOT NULL,
      optimized_input INTEGER NOT NULL,
      optimized_output INTEGER NOT NULL,
      optimized_total INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS chatgpt_links (
      chatgpt_account_id TEXT PRIMARY KEY,
      product_account_id TEXT NOT NULL UNIQUE,
      linked_at INTEGER NOT NULL,
      FOREIGN KEY (chatgpt_account_id) REFERENCES users(account_id) ON DELETE CASCADE,
      FOREIGN KEY (product_account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
  `);
  return singleton;
}

export class SqliteKeyValueStore<T> implements KeyValueStore<T> {
  constructor(private readonly namespace: string) {}

  get(key: string): T | undefined {
    const db = getDatabase();
    db.prepare(`
      DELETE FROM kv_store
      WHERE namespace = ? AND key = ? AND expires_at IS NOT NULL AND expires_at <= ?
    `).run(this.namespace, key, Date.now());
    const row = db
      .prepare("SELECT value, expires_at FROM kv_store WHERE namespace = ? AND key = ?")
      .get(this.namespace, key) as { value: string; expires_at: number | null } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.value) as T;
  }

  set(key: string, value: T, options?: { ttlMs?: number }): void {
    const expiresAt = options?.ttlMs ? Date.now() + options.ttlMs : null;
    getDatabase()
      .prepare(`
        INSERT INTO kv_store (namespace, key, value, expires_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at
      `)
      .run(this.namespace, key, JSON.stringify(value), expiresAt);
  }

  delete(key: string): void {
    getDatabase().prepare("DELETE FROM kv_store WHERE namespace = ? AND key = ?").run(this.namespace, key);
  }
}

export function upsertUser(input: {
  accountId: string;
  billingUserId: string;
  name?: string;
  email?: string;
}): void {
  const now = Date.now();
  getDatabase()
    .prepare(`
      INSERT INTO users (account_id, billing_user_id, name, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        billing_user_id = excluded.billing_user_id,
        name = excluded.name,
        email = excluded.email,
        updated_at = excluded.updated_at
    `)
    .run(input.accountId, input.billingUserId, input.name ?? null, input.email ?? null, now, now);
}

export function hasEntitlement(accountId: string, key = "pro"): boolean {
  const row = getDatabase()
    .prepare("SELECT active FROM entitlements WHERE account_id = ? AND entitlement_key = ?")
    .get(accountId, key) as { active: number } | undefined;
  return row?.active === 1;
}

export function grantEntitlement(input: {
  accountId: string;
  checkoutSessionId: string;
  paymentIntentId?: string;
  key?: string;
}): void {
  getDatabase()
    .prepare(`
      INSERT INTO entitlements (
        account_id, entitlement_key, checkout_session_id, payment_intent_id, active, granted_at
      ) VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(account_id, entitlement_key) DO UPDATE SET
        checkout_session_id = excluded.checkout_session_id,
        payment_intent_id = excluded.payment_intent_id,
        active = 1,
        granted_at = excluded.granted_at,
        revoked_at = NULL
    `)
    .run(
      input.accountId,
      input.key ?? "pro",
      input.checkoutSessionId,
      input.paymentIntentId ?? null,
      Date.now(),
    );
}

export function markStripeEvent(eventId: string, eventType: string): boolean {
  const result = getDatabase()
    .prepare("INSERT OR IGNORE INTO stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)")
    .run(eventId, eventType, Date.now());
  return result.changes === 1;
}

export function findAccountByBillingId(billingUserId: string): string | undefined {
  const row = getDatabase()
    .prepare("SELECT account_id FROM users WHERE billing_user_id = ?")
    .get(billingUserId) as { account_id: string } | undefined;
  return row?.account_id;
}

export function setStripeCustomer(accountId: string, customerId: string): void {
  getDatabase()
    .prepare("UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE account_id = ?")
    .run(customerId, Date.now(), accountId);
}

export function revokeEntitlementByPaymentIntent(paymentIntentId: string): void {
  getDatabase()
    .prepare(`
      UPDATE entitlements
      SET active = 0, revoked_at = ?
      WHERE payment_intent_id = ?
    `)
    .run(Date.now(), paymentIntentId);
}

export function saveExperiment(input: {
  id: string;
  accountId: string;
  strategyId: string;
  model: string;
  baseline: { input: number; output: number; total: number };
  optimized: { input: number; output: number; total: number };
}): void {
  getDatabase()
    .prepare(`
      INSERT INTO experiments (
        id, account_id, strategy_id, model,
        baseline_input, baseline_output, baseline_total,
        optimized_input, optimized_output, optimized_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.id,
      input.accountId,
      input.strategyId,
      input.model,
      input.baseline.input,
      input.baseline.output,
      input.baseline.total,
      input.optimized.input,
      input.optimized.output,
      input.optimized.total,
      Date.now(),
    );
}

export function linkChatGPTAccount(input: {
  chatgptAccountId: string;
  productAccountId: string;
}): { linked: boolean; entitlementMoved: boolean; reason?: string } {
  const db = getDatabase();
  const existingChatGPT = db
    .prepare("SELECT product_account_id FROM chatgpt_links WHERE chatgpt_account_id = ?")
    .get(input.chatgptAccountId) as { product_account_id: string } | undefined;
  if (existingChatGPT && existingChatGPT.product_account_id !== input.productAccountId) {
    return { linked: false, entitlementMoved: false, reason: "That ChatGPT account is already linked elsewhere." };
  }
  const existingProduct = db
    .prepare("SELECT chatgpt_account_id FROM chatgpt_links WHERE product_account_id = ?")
    .get(input.productAccountId) as { chatgpt_account_id: string } | undefined;
  if (existingProduct && existingProduct.chatgpt_account_id !== input.chatgptAccountId) {
    return { linked: false, entitlementMoved: false, reason: "This TokenGauge account already has a ChatGPT connection." };
  }

  let moved = false;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`
      INSERT OR IGNORE INTO chatgpt_links (chatgpt_account_id, product_account_id, linked_at)
      VALUES (?, ?, ?)
    `).run(input.chatgptAccountId, input.productAccountId, Date.now());

    const legacyEntitlement = db
      .prepare("SELECT 1 AS present FROM entitlements WHERE account_id = ? AND entitlement_key = 'pro' AND active = 1")
      .get(input.chatgptAccountId) as { present: number } | undefined;
    const productEntitlement = db
      .prepare("SELECT 1 AS present FROM entitlements WHERE account_id = ? AND entitlement_key = 'pro' AND active = 1")
      .get(input.productAccountId) as { present: number } | undefined;
    if (legacyEntitlement && !productEntitlement) {
      db.prepare("UPDATE entitlements SET account_id = ? WHERE account_id = ? AND entitlement_key = 'pro'")
        .run(input.productAccountId, input.chatgptAccountId);
      moved = true;
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { linked: true, entitlementMoved: moved };
}

export function linkedChatGPTAccount(productAccountId: string): string | undefined {
  const row = getDatabase()
    .prepare("SELECT chatgpt_account_id FROM chatgpt_links WHERE product_account_id = ?")
    .get(productAccountId) as { chatgpt_account_id: string } | undefined;
  return row?.chatgpt_account_id;
}
