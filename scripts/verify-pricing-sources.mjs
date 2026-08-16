import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const snapshotPath = resolve(projectRoot, "src/data/pricing-snapshot.json");
const reportPath = resolve(projectRoot, "research/pricing-source-check.json");
const writeSnapshot = process.argv.includes("--write");

const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const sourceGroups = new Map();
const checkedAt = new Date().toISOString();
const checkedAtMs = Date.parse(checkedAt);

for (const model of snapshot.models) {
  const url = model.sourceUrl.split("#")[0];
  const rows = sourceGroups.get(url) ?? [];
  rows.push(model);
  sourceGroups.set(url, rows);
}

const results = [];
const errors = [];

for (const [url, models] of sourceGroups) {
  const fetchedUrl = machineReadableUrl(url);
  const response = await fetch(fetchedUrl, {
    headers: {
      accept: fetchedUrl.includes("docs.cohere.com/")
        ? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
        : "text/markdown,text/html;q=0.9,*/*;q=0.8",
      "user-agent": "TokenGauge pricing verifier (+https://tokengauge.enby.fish)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    errors.push(`${fetchedUrl}: HTTP ${response.status}`);
    continue;
  }

  const body = await response.text();
  const normalized = normalize(body);
  const rowResults = models.map((model) => {
    if (model.effectiveUntil && Date.parse(model.effectiveUntil) <= checkedAtMs) {
      return {
        modelId: model.modelId,
        ok: true,
        skipped: "expired-historical",
        effectiveUntil: model.effectiveUntil,
        missing: [],
      };
    }
    return verifyRow(model, normalized);
  });
  for (const row of rowResults) {
    if (!row.ok) errors.push(`${url}: ${row.modelId} missing ${row.missing.join(", ")}`);
  }

  results.push({
    url,
    fetchedUrl,
    status: response.status,
    contentType: response.headers.get("content-type"),
    sha256: createHash("sha256").update(body).digest("hex"),
    checkedRows: rowResults,
  });
}

await writeFile(reportPath, `${JSON.stringify({ checkedAt, errors, sources: results }, null, 2)}\n`);

if (errors.length > 0) {
  console.error(`Pricing verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  if (writeSnapshot) {
    snapshot.observedAt = checkedAt;
    await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  }
  const expiredRows = snapshot.models.filter(
    (model) => model.effectiveUntil && Date.parse(model.effectiveUntil) <= checkedAtMs,
  ).length;
  console.log(
    `Verified ${snapshot.models.length - expiredRows} current/future rate rows against ${results.length} official source pages at ${checkedAt}; retained ${expiredRows} expired historical row(s).`,
  );
}

function verifyRow(model, source) {
  const needles = [model.modelId, model.label].map(normalize).filter(Boolean);
  const positions = needles.flatMap((needle) => findAll(source, needle));
  const missing = [];

  if (positions.length === 0) {
    return { modelId: model.modelId, ok: false, missing: ["model identifier/label"] };
  }

  const windows = model.provider === "cohere"
    ? [source]
    : positions.map((position) => source.slice(Math.max(0, position - 1_000), position + 24_000));
  const rates = [
    ["input rate", model.inputPerMillionUsd],
    ["cached-input rate", model.cachedInputPerMillionUsd],
    ["output rate", model.outputPerMillionUsd],
  ];

  for (const [label, value] of rates) {
    if (value === null || value === undefined) continue;
    if (model.provider === "mistral" && label === "cached-input rate") continue;
    if (!windows.some((window) => containsNumber(window, value))) missing.push(`${label} ${value}`);
  }

  return { modelId: model.modelId, ok: missing.length === 0, missing };
}

function machineReadableUrl(url) {
  if (url.includes("ai.google.dev/gemini-api/docs/pricing")) {
    return `${url}${url.includes("?") ? "&" : "?"}hl=en`;
  }
  if (
    (url.includes("developers.openai.com/") ||
      url.includes("platform.claude.com/") ||
      url.includes("platform.kimi.ai/")) &&
    !url.endsWith(".md")
  ) {
    return `${url.replace(/\/$/, "")}.md`;
  }
  return url;
}

function findAll(haystack, needle) {
  const positions = [];
  let cursor = 0;
  while (cursor < haystack.length) {
    const position = haystack.indexOf(needle, cursor);
    if (position < 0) break;
    positions.push(position);
    cursor = position + Math.max(needle.length, 1);
  }
  return positions;
}

function containsNumber(text, value) {
  const raw = String(value);
  const fixed = Number(value).toFixed(Math.max(2, decimalPlaces(value)));
  const candidates = new Set([
    raw,
    fixed,
    fixed.replace(/0+$/, "").replace(/\.$/, ""),
    `$${raw}`,
    `$${fixed}`,
  ]);
  return Array.from(candidates).some((candidate) => text.includes(normalize(candidate)));
}

function decimalPlaces(value) {
  const text = String(value);
  return text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replaceAll("\\u0024", "$")
    .replaceAll("&dollar;", "$")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&#x2f;", "/")
    .replace(/<!--.*?-->/gs, " ")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/\\n|\\t|\s+/g, " ")
    .trim();
}
