#!/usr/bin/env node

import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.TOKEN_GAUGE_DB_PATH || "/home/admin/.local/share/tokengauge/tokengauge.sqlite";
const requestedDays = Number.parseInt(process.argv[2] || "30", 10);
const days = Number.isFinite(requestedDays) ? Math.min(365, Math.max(1, requestedDays)) : 30;
const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
const database = new DatabaseSync(databasePath, { readOnly: true });
const rows = database.prepare("SELECT day, event, count FROM funnel_daily WHERE day >= ? ORDER BY day, event").all(since);

if (!rows.length) {
  console.log(`No aggregate funnel events recorded since ${since}.`);
} else {
  console.table(rows);
}
