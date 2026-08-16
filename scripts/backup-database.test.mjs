import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdtempSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createRotatingBackup } from "./backup-database.mjs";

test("creates a mode-600 consistent backup and expires only old TokenGauge snapshots", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "tokengauge-backup-test-"));
  context.after(() => import("node:fs").then(({ rmSync }) => rmSync(root, { recursive: true, force: true })));
  const source = join(root, "live.sqlite");
  const destinationDirectory = join(root, "backups");
  const database = new DatabaseSync(source);
  database.exec("PRAGMA journal_mode = WAL; CREATE TABLE proof (value TEXT NOT NULL); INSERT INTO proof VALUES ('preserved');");
  database.close();

  const seed = new DatabaseSync(join(root, "old.sqlite"));
  seed.exec("CREATE TABLE old_data (value TEXT)");
  seed.close();
  await createRotatingBackup({ sourcePath: join(root, "old.sqlite"), backupDirectory: destinationDirectory, now: Date.UTC(2026, 6, 1), retentionDays: 14 });
  const oldBackup = join(destinationDirectory, "tokengauge-automatic-20260701T000000Z.sqlite");
  const oldTime = new Date(Date.UTC(2026, 6, 1));
  utimesSync(oldBackup, oldTime, oldTime);
  writeFileSync(`${oldBackup}-wal`, "old sidecar");
  writeFileSync(`${oldBackup}-shm`, "old sidecar");
  writeFileSync(`${oldBackup}-journal`, "old sidecar");
  const orphanSidecar = join(destinationDirectory, "tokengauge-orphan.sqlite-wal");
  writeFileSync(orphanSidecar, "orphaned pages");
  utimesSync(orphanSidecar, oldTime, oldTime);
  const interrupted = join(destinationDirectory, "tokengauge-interrupted.sqlite.partial-123");
  writeFileSync(interrupted, "partial backup");
  utimesSync(interrupted, oldTime, oldTime);
  const unrelated = join(destinationDirectory, "keep-me.sqlite");
  writeFileSync(unrelated, "not managed by this script");

  const result = await createRotatingBackup({
    sourcePath: source,
    backupDirectory: destinationDirectory,
    now: Date.UTC(2026, 7, 16, 15, 30),
    retentionDays: 14,
  });

  assert.equal(result.quickCheck, "ok");
  assert.equal(result.retentionDays, 14);
  assert.equal(result.removed, 6);
  assert.equal(statSync(result.destination).mode & 0o777, 0o600);
  assert.equal(existsSync(oldBackup), false);
  assert.equal(existsSync(`${oldBackup}-wal`), false);
  assert.equal(existsSync(`${oldBackup}-shm`), false);
  assert.equal(existsSync(`${oldBackup}-journal`), false);
  assert.equal(existsSync(orphanSidecar), false);
  assert.equal(existsSync(interrupted), false);
  assert.equal(existsSync(unrelated), true);
  assert.equal(existsSync(`${result.destination}-wal`), false);
  assert.equal(existsSync(`${result.destination}-shm`), false);
  assert.equal(existsSync(`${result.destination}-journal`), false);
  assert.equal(existsSync(`${result.destination}.partial-${process.pid}`), false);
  const copy = new DatabaseSync(result.destination, { readOnly: true });
  assert.equal(copy.prepare("SELECT value FROM proof").get().value, "preserved");
  assert.equal(copy.prepare("PRAGMA quick_check").get().quick_check, "ok");
  copy.close();
});

test("rejects invalid retention windows", async () => {
  await assert.rejects(() => createRotatingBackup({ retentionDays: 0 }), /1 to 365/);
  await assert.rejects(() => createRotatingBackup({ retentionDays: 366 }), /1 to 365/);
});
