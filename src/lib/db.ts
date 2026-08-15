import "server-only";

import type { KeyValueStore } from "@opencoredev/loginwithchatgpt-core";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { highestPlan, type PaidPlanId, type PlanId } from "@/lib/plans";

let singleton: DatabaseSync | undefined;

function databasePath(): string {
  return process.env.TOKEN_GAUGE_DB_PATH?.trim() || resolve(process.cwd(), ".data/tokengauge.sqlite");
}

export function getDatabase(): DatabaseSync {
  if (singleton) return singleton;

  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  chmodSync(dirname(path), 0o700);
  singleton = new DatabaseSync(path);
  singleton.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  chmodSync(path, 0o600);
  for (const suffix of ["-wal", "-shm"]) {
    try { chmodSync(`${path}${suffix}`, 0o600); } catch { /* SQLite creates sidecars lazily. */ }
  }
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
      amount_paid INTEGER NOT NULL DEFAULT 0,
      currency TEXT,
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
    CREATE TABLE IF NOT EXISTS provider_connections (
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      key_hint TEXT NOT NULL,
      configuration TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_id, provider_id),
      FOREIGN KEY (account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS method_progress (
      account_id TEXT NOT NULL,
      method_id TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_id, method_id),
      FOREIGN KEY (account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS launch_offer_members (
      account_id TEXT PRIMARY KEY,
      ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal BETWEEN 1 AND 100),
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES users(account_id) ON DELETE CASCADE
    );
  `);
  const experimentColumns = singleton.prepare("PRAGMA table_info(experiments)").all() as { name: string }[];
  if (!experimentColumns.some((column) => column.name === "provider_id")) {
    singleton.exec("ALTER TABLE experiments ADD COLUMN provider_id TEXT NOT NULL DEFAULT 'chatgpt'");
  }
  const entitlementColumns = singleton.prepare("PRAGMA table_info(entitlements)").all() as { name: string }[];
  if (!entitlementColumns.some((column) => column.name === "amount_paid")) {
    singleton.exec("ALTER TABLE entitlements ADD COLUMN amount_paid INTEGER NOT NULL DEFAULT 0");
  }
  if (!entitlementColumns.some((column) => column.name === "currency")) {
    singleton.exec("ALTER TABLE entitlements ADD COLUMN currency TEXT");
  }
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

export type UserRecord = {
  account_id: string;
  billing_user_id: string;
  name: string | null;
  email: string | null;
};

export function userRecord(accountId: string): UserRecord | undefined {
  return getDatabase()
    .prepare("SELECT account_id, billing_user_id, name, email FROM users WHERE account_id = ?")
    .get(accountId) as UserRecord | undefined;
}

export const LAUNCH_OFFER_LIMIT = 100;

export type LaunchOfferStatus = {
  limit: number;
  joined: number;
  remaining: number;
  eligible: boolean;
  ordinal?: number;
};

export function ensureLaunchOffer(accountId: string): LaunchOfferStatus {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    let member = db
      .prepare("SELECT ordinal FROM launch_offer_members WHERE account_id = ?")
      .get(accountId) as { ordinal: number } | undefined;
    const rows = db.prepare("SELECT ordinal FROM launch_offer_members ORDER BY ordinal").all() as { ordinal: number }[];
    if (!member && rows.length < LAUNCH_OFFER_LIMIT) {
      const occupied = new Set(rows.map((row) => row.ordinal));
      let ordinal = 1;
      while (occupied.has(ordinal) && ordinal <= LAUNCH_OFFER_LIMIT) ordinal += 1;
      if (ordinal <= LAUNCH_OFFER_LIMIT) {
        db.prepare("INSERT INTO launch_offer_members (account_id, ordinal, joined_at) VALUES (?, ?, ?)")
          .run(accountId, ordinal, Date.now());
        member = { ordinal };
      }
    }
    const joined = rows.length + (member && !rows.some((row) => row.ordinal === member?.ordinal) ? 1 : 0);
    db.exec("COMMIT");
    return {
      limit: LAUNCH_OFFER_LIMIT,
      joined,
      remaining: Math.max(0, LAUNCH_OFFER_LIMIT - joined),
      eligible: Boolean(member),
      ordinal: member?.ordinal,
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function launchOfferStatus(accountId?: string): LaunchOfferStatus {
  if (accountId) return ensureLaunchOffer(accountId);
  const db = getDatabase();
  const joined = (db.prepare("SELECT COUNT(*) AS count FROM launch_offer_members").get() as { count: number }).count;
  return {
    limit: LAUNCH_OFFER_LIMIT,
    joined,
    remaining: Math.max(0, LAUNCH_OFFER_LIMIT - joined),
    eligible: false,
  };
}

export function hasEntitlement(accountId: string, key = "pro"): boolean {
  const row = getDatabase()
    .prepare("SELECT active FROM entitlements WHERE account_id = ? AND entitlement_key = ?")
    .get(accountId, key) as { active: number } | undefined;
  return row?.active === 1;
}

export function planForAccount(accountId: string): PlanId {
  const rows = getDatabase()
    .prepare("SELECT entitlement_key FROM entitlements WHERE account_id = ? AND active = 1")
    .all(accountId) as { entitlement_key: string }[];
  return highestPlan(rows.map((row) => row.entitlement_key));
}

export function grantEntitlement(input: {
  accountId: string;
  checkoutSessionId: string;
  paymentIntentId?: string;
  key?: PaidPlanId;
  amountPaid?: number;
  currency?: string;
}): void {
  getDatabase()
    .prepare(`
      INSERT INTO entitlements (
        account_id, entitlement_key, checkout_session_id, payment_intent_id,
        amount_paid, currency, active, granted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(account_id, entitlement_key) DO UPDATE SET
        checkout_session_id = excluded.checkout_session_id,
        payment_intent_id = excluded.payment_intent_id,
        amount_paid = excluded.amount_paid,
        currency = excluded.currency,
        active = 1,
        granted_at = excluded.granted_at,
        revoked_at = NULL
    `)
    .run(
      input.accountId,
      input.key ?? "pro",
      input.checkoutSessionId,
      input.paymentIntentId ?? null,
      Math.max(0, Math.trunc(input.amountPaid ?? 0)),
      input.currency?.toLowerCase() ?? null,
      Date.now(),
    );
}

export function entitlementCredit(accountId: string): { plan: PlanId; amountPaid: number; currency?: string } {
  const plan = planForAccount(accountId);
  if (plan === "free") return { plan, amountPaid: 0 };
  const row = getDatabase()
    .prepare("SELECT amount_paid, currency FROM entitlements WHERE account_id = ? AND entitlement_key = ? AND active = 1")
    .get(accountId, plan) as { amount_paid: number; currency: string | null } | undefined;
  return { plan, amountPaid: Math.max(0, row?.amount_paid ?? 0), currency: row?.currency ?? undefined };
}

export function setEntitlementPaidAmountByPaymentIntent(paymentIntentId: string, amountPaid: number, currency: string): void {
  getDatabase()
    .prepare("UPDATE entitlements SET amount_paid = ?, currency = ? WHERE payment_intent_id = ?")
    .run(Math.max(0, Math.trunc(amountPaid)), currency.toLowerCase(), paymentIntentId);
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
  providerId?: string;
  baseline: { input: number; output: number; total: number };
  optimized: { input: number; output: number; total: number };
}): void {
  getDatabase()
    .prepare(`
      INSERT INTO experiments (
        id, account_id, strategy_id, model, provider_id,
        baseline_input, baseline_output, baseline_total,
        optimized_input, optimized_output, optimized_total, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.id,
      input.accountId,
      input.strategyId,
      input.model,
      input.providerId ?? "chatgpt",
      input.baseline.input,
      input.baseline.output,
      input.baseline.total,
      input.optimized.input,
      input.optimized.output,
      input.optimized.total,
      Date.now(),
    );
}

export type ProviderConnectionRecord = {
  account_id: string;
  provider_id: string;
  encrypted_key: string;
  key_hint: string;
  configuration: string;
  created_at: number;
  updated_at: number;
};

export function listProviderConnectionRecords(accountId: string): ProviderConnectionRecord[] {
  return getDatabase()
    .prepare("SELECT * FROM provider_connections WHERE account_id = ? ORDER BY provider_id")
    .all(accountId) as ProviderConnectionRecord[];
}

export function providerConnectionRecord(accountId: string, providerId: string): ProviderConnectionRecord | undefined {
  return getDatabase()
    .prepare("SELECT * FROM provider_connections WHERE account_id = ? AND provider_id = ?")
    .get(accountId, providerId) as ProviderConnectionRecord | undefined;
}

export function saveProviderConnectionRecord(input: {
  accountId: string;
  providerId: string;
  encryptedKey: string;
  keyHint: string;
  configuration?: Record<string, string>;
}): void {
  const now = Date.now();
  getDatabase().prepare(`
    INSERT INTO provider_connections (
      account_id, provider_id, encrypted_key, key_hint, configuration, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, provider_id) DO UPDATE SET
      encrypted_key = excluded.encrypted_key,
      key_hint = excluded.key_hint,
      configuration = excluded.configuration,
      updated_at = excluded.updated_at
  `).run(
    input.accountId,
    input.providerId,
    input.encryptedKey,
    input.keyHint,
    JSON.stringify(input.configuration ?? {}),
    now,
    now,
  );
}

export function deleteProviderConnectionRecord(accountId: string, providerId: string): boolean {
  return getDatabase()
    .prepare("DELETE FROM provider_connections WHERE account_id = ? AND provider_id = ?")
    .run(accountId, providerId).changes === 1;
}

export type ExperimentSummary = {
  id: string;
  providerId: string;
  model: string;
  strategyId: string;
  baselineTotal: number;
  optimizedTotal: number;
  tokenDelta: number;
  createdAt: number;
};

export function experimentSummaries(accountId: string, limit = 100): ExperimentSummary[] {
  const boundedLimit = Math.max(1, Math.min(1_000, Math.trunc(limit)));
  const rows = getDatabase().prepare(`
    SELECT id, provider_id, model, strategy_id, baseline_total, optimized_total, created_at
    FROM experiments
    WHERE account_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(accountId, boundedLimit) as Array<{
    id: string;
    provider_id: string;
    model: string;
    strategy_id: string;
    baseline_total: number;
    optimized_total: number;
    created_at: number;
  }>;
  return rows.map((row) => ({
    id: row.id,
    providerId: row.provider_id,
    model: row.model,
    strategyId: row.strategy_id,
    baselineTotal: row.baseline_total,
    optimizedTotal: row.optimized_total,
    tokenDelta: row.baseline_total - row.optimized_total,
    createdAt: row.created_at,
  }));
}

export function methodProgress(accountId: string): Record<string, string> {
  const rows = getDatabase()
    .prepare("SELECT method_id, status FROM method_progress WHERE account_id = ?")
    .all(accountId) as { method_id: string; status: string }[];
  return Object.fromEntries(rows.map((row) => [row.method_id, row.status]));
}

export function setMethodProgress(accountId: string, methodId: string, status: "planned" | "testing" | "adopted" | "dismissed" | "none"): void {
  if (status === "none") {
    getDatabase().prepare("DELETE FROM method_progress WHERE account_id = ? AND method_id = ?").run(accountId, methodId);
    return;
  }
  getDatabase().prepare(`
    INSERT INTO method_progress (account_id, method_id, status, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(account_id, method_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
  `).run(accountId, methodId, status, Date.now());
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

    const legacyEntitlements = db
      .prepare("SELECT entitlement_key FROM entitlements WHERE account_id = ? AND active = 1")
      .all(input.chatgptAccountId) as { entitlement_key: string }[];
    for (const entitlement of legacyEntitlements) {
      const productEntitlement = db
        .prepare("SELECT active FROM entitlements WHERE account_id = ? AND entitlement_key = ?")
        .get(input.productAccountId, entitlement.entitlement_key) as { active: number } | undefined;
      if (!productEntitlement) {
        db.prepare("UPDATE entitlements SET account_id = ? WHERE account_id = ? AND entitlement_key = ?")
          .run(input.productAccountId, input.chatgptAccountId, entitlement.entitlement_key);
        moved = true;
      } else if (productEntitlement.active === 0) {
        db.prepare("DELETE FROM entitlements WHERE account_id = ? AND entitlement_key = ?")
          .run(input.productAccountId, entitlement.entitlement_key);
        db.prepare("UPDATE entitlements SET account_id = ? WHERE account_id = ? AND entitlement_key = ?")
          .run(input.productAccountId, input.chatgptAccountId, entitlement.entitlement_key);
        moved = true;
      } else {
        db.prepare("UPDATE entitlements SET active = 0, revoked_at = ? WHERE account_id = ? AND entitlement_key = ?")
          .run(Date.now(), input.chatgptAccountId, entitlement.entitlement_key);
        moved = true;
      }
    }
    const chatgptOffer = db
      .prepare("SELECT ordinal FROM launch_offer_members WHERE account_id = ?")
      .get(input.chatgptAccountId) as { ordinal: number } | undefined;
    const productOffer = db
      .prepare("SELECT ordinal FROM launch_offer_members WHERE account_id = ?")
      .get(input.productAccountId) as { ordinal: number } | undefined;
    if (chatgptOffer && !productOffer) {
      db.prepare("UPDATE launch_offer_members SET account_id = ? WHERE account_id = ?")
        .run(input.productAccountId, input.chatgptAccountId);
    } else if (chatgptOffer && productOffer) {
      db.prepare("DELETE FROM launch_offer_members WHERE account_id = ?").run(input.chatgptAccountId);
    }
    db.prepare("UPDATE experiments SET account_id = ? WHERE account_id = ?")
      .run(input.productAccountId, input.chatgptAccountId);
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

export function linkedProductAccount(chatgptAccountId: string): string | undefined {
  const row = getDatabase()
    .prepare("SELECT product_account_id FROM chatgpt_links WHERE chatgpt_account_id = ?")
    .get(chatgptAccountId) as { product_account_id: string } | undefined;
  return row?.product_account_id;
}
