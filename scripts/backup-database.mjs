#!/usr/bin/env node

import { backup, DatabaseSync } from "node:sqlite";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_RETENTION_DAYS = 14;

export async function createRotatingBackup({
  sourcePath,
  backupDirectory,
  retentionDays = DEFAULT_RETENTION_DAYS,
  now = Date.now(),
} = {}) {
  const source = resolve(sourcePath || process.env.TOKEN_GAUGE_DB_PATH || "/home/admin/.local/share/tokengauge/tokengauge.sqlite");
  const destinationDirectory = resolve(backupDirectory || process.env.TOKEN_GAUGE_BACKUP_DIR || join(dirname(source), "backups"));
  const days = Number(retentionDays ?? process.env.TOKEN_GAUGE_BACKUP_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new RangeError("Backup retention must be an integer from 1 to 365 days.");
  if (!existsSync(source) || !statSync(source).isFile()) throw new Error("TokenGauge database does not exist.");

  mkdirSync(destinationDirectory, { recursive: true, mode: 0o700 });
  chmodSync(destinationDirectory, 0o700);

  const timestamp = new Date(now).toISOString().replaceAll(/[-:]/g, "").replace(".000", "");
  const destination = join(destinationDirectory, `tokengauge-automatic-${timestamp}.sqlite`);
  const partialDestination = `${destination}.partial-${process.pid}`;
  try {
    const sourceDatabase = new DatabaseSync(source, { readOnly: true });
    try {
      const sourceCheck = sourceDatabase.prepare("PRAGMA quick_check").get();
      if (sourceCheck.quick_check !== "ok") throw new Error("Source database integrity check failed.");
      await backup(sourceDatabase, partialDestination);
    } finally {
      sourceDatabase.close();
    }

    chmodSync(partialDestination, 0o600);
    const destinationDatabase = new DatabaseSync(partialDestination);
    let destinationCheck;
    try {
      destinationDatabase.exec("PRAGMA journal_mode = DELETE;");
      destinationCheck = destinationDatabase.prepare("PRAGMA quick_check").get();
    } finally {
      destinationDatabase.close();
    }
    if (destinationCheck?.quick_check !== "ok") throw new Error("Backup database integrity check failed.");
    chmodSync(partialDestination, 0o600);

    let backupFd;
    try {
      backupFd = openSync(partialDestination, "r");
      fsyncSync(backupFd);
    } finally {
      if (backupFd !== undefined) closeSync(backupFd);
    }
    renameSync(partialDestination, destination);
    chmodSync(destination, 0o600);
  } catch (error) {
    for (const candidate of [partialDestination, `${partialDestination}-wal`, `${partialDestination}-shm`, `${partialDestination}-journal`]) {
      if (existsSync(candidate)) unlinkSync(candidate);
    }
    throw error;
  }

  const cutoff = now - days * 24 * 60 * 60 * 1_000;
  const removed = [];
  const entries = readdirSync(destinationDirectory);
  const expiredSnapshots = new Set(entries
    .filter((name) => name.startsWith("tokengauge-") && name.endsWith(".sqlite"))
    .map((name) => join(destinationDirectory, name))
    .filter((path) => path !== destination && statSync(path).mtimeMs < cutoff));
  for (const name of entries) {
    if (!name.startsWith("tokengauge-")) continue;
    const path = join(destinationDirectory, name);
    if (path === destination) continue;
    const isSnapshot = name.endsWith(".sqlite");
    const sidecarSuffix = ["-wal", "-shm", "-journal"].find((suffix) => name.endsWith(`.sqlite${suffix}`));
    const isSidecar = sidecarSuffix !== undefined;
    const isPartial = name.includes(".sqlite.partial-");
    const relatedSnapshot = sidecarSuffix ? path.slice(0, -sidecarSuffix.length) : path;
    const expired = expiredSnapshots.has(relatedSnapshot) || statSync(path).mtimeMs < cutoff;
    if ((!isSnapshot && !isSidecar && !isPartial) || !expired) continue;
    unlinkSync(path);
    removed.push(path);
  }

  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const sidecar = `${destination}${suffix}`;
    if (existsSync(sidecar)) unlinkSync(sidecar);
  }

  // Persist directory-entry changes where the filesystem supports it.
  let directoryFd;
  try {
    directoryFd = openSync(destinationDirectory, "r");
    fsyncSync(directoryFd);
  } catch {
    // The SQLite backup itself is already complete and integrity checked.
  } finally {
    if (directoryFd !== undefined) closeSync(directoryFd);
  }

  return { destination, retentionDays: days, removed: removed.length, quickCheck: "ok" };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createRotatingBackup({ retentionDays: process.env.TOKEN_GAUGE_BACKUP_RETENTION_DAYS })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Database backup failed.");
      process.exitCode = 1;
    });
}
