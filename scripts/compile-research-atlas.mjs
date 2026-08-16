import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const records = [];

for (const file of ["10-luna-core-scale.md", "13-luna-core-expansion.md"]) {
  const markdown = await researchFile(file);
  for (const line of markdown.split("\n")) {
    const match = line.match(/^- \*\*(luna2?-\d+) — (.+?)\*\* — (.+)$/);
    if (!match) continue;
    const fields = fieldsFromSemicolons(match[3]);
    records.push({
      id: match[1],
      kind: "atomic",
      title: clean(match[2]),
      category: clean(field(fields, "category")),
      provider: clean(field(fields, "provider scope")),
      scope: "Provider-agnostic candidate",
      summary: clean(field(fields, "summary")),
      action: clean(field(fields, "exact action")),
      measurement: clean(fieldAny(fields, ["measurement", "measurement/experiment"])),
      caveat: clean(fieldAny(fields, ["caveat", "constraint/caveat"])),
      grade: normalizeGrade(field(fields, "evidence grade")),
      support: "research-candidate",
      source: sourceFrom(field(fields, "source url")),
      provenance: githubResearchUrl(file),
      lastVerified: "2026-08-15",
    });
  }
}

for (const file of ["11-luna-provider-scale.md", "14-luna-provider-expansion.md"]) {
  const markdown = await researchFile(file);
  for (const line of markdown.split("\n")) {
    const match = line.match(/^- (L(?:PS|PE)-[A-Z0-9-]+) \| (.+)$/);
    if (!match) continue;
    const fields = fieldsFromPipes(match[2]);
    records.push({
      id: match[1],
      kind: "atomic",
      title: clean(field(fields, "title")),
      category: titleCase(clean(field(fields, "category"))),
      provider: clean(field(fields, "provider")),
      scope: clean(field(fields, "exact")),
      summary: clean(field(fields, "summary")),
      action: clean(field(fields, "action")),
      measurement: clean(field(fields, "measurement")),
      caveat: clean(field(fields, "caveat")),
      grade: normalizeGrade(field(fields, "grade")),
      support: "provider-profile-candidate",
      source: sourceFrom(field(fields, "source")),
      provenance: githubResearchUrl(file),
      lastVerified: clean(field(fields, "effective")) || "2026-08-15",
    });
  }
}

{
  const file = "12-luna-recipe-engine.md";
  const markdown = await researchFile(file);
  for (const line of markdown.split("\n")) {
    if (!/^\| R\d{3} \|/.test(line)) continue;
    const columns = tableColumns(line);
    const id = columns[0];
    const [scope = "", workload = "", atoms = ""] = columns[1].split(" · ").map(clean);
    const support = /;\s*(guided|research)\s*$/i.exec(columns[5])?.[1]?.toLowerCase() ?? "research";
    records.push({
      id,
      kind: "configuration",
      title: `${atoms || "Compound"} · ${workload || scope}`,
      category: "Compound recipe",
      provider: scope || "Provider-neutral",
      scope: workload || scope,
      summary: clean(columns[5].replace(/;\s*(guided|research)\s*$/i, "")),
      action: clean(columns[2]),
      measurement: `Capture ${clean(columns[3])} under the shared recipe scorecard.`,
      caveat: clean(columns[4]),
      grade: "experiment",
      support: `${support}-protocol`,
      source: { label: "Research provenance", url: githubResearchUrl(file) },
      provenance: githubResearchUrl(file),
      lastVerified: "2026-08-15",
    });
  }
}

{
  const file = "15-luna-recipe-expansion.md";
  const markdown = await researchFile(file);
  for (const line of markdown.split("\n")) {
    if (!/^\| tg2-/.test(line)) continue;
    const columns = tableColumns(line);
    records.push({
      id: columns[0],
      kind: "configuration",
      title: `${clean(columns[1])} · ${clean(columns[3].split("/")[0])}`,
      category: "Materialized configuration",
      provider: clean(columns[2]),
      scope: clean(columns[3]),
      summary: `A materialized ${clean(columns[8])} configuration with compatibility status ${clean(columns[4])}.`,
      action: `Run the ${clean(columns[1])} treatment against the matched ${clean(columns[3])} fixture after resolving ${clean(columns[5])}.`,
      measurement: clean(columns[6]),
      caveat: clean(columns[7]),
      grade: "experiment",
      support: "research-configuration",
      source: { label: "Research provenance", url: githubResearchUrl(file) },
      provenance: githubResearchUrl(file),
      lastVerified: "2026-08-15",
    });
  }
}

const expected = { atomic: 1_316, configuration: 1_184 };
for (const [kind, count] of Object.entries(expected)) {
  const actual = records.filter((record) => record.kind === kind).length;
  if (actual !== count) throw new Error(`Expected ${count} ${kind} records, found ${actual}.`);
}
if (records.length !== 2_500) throw new Error(`Expected 2,500 atlas records, found ${records.length}.`);
if (new Set(records.map((record) => record.id.toLowerCase())).size !== records.length) {
  throw new Error("Research atlas IDs must be unique.");
}
for (const record of records) {
  for (const key of ["id", "title", "category", "provider", "summary", "action", "measurement", "caveat"]) {
    if (!record[key]) throw new Error(`${record.id} is missing ${key}.`);
  }
  if (!record.source.url.startsWith("https://")) throw new Error(`${record.id} has no HTTPS source.`);
}

const outputPath = resolve(root, "src/data/research-atlas.json");
const output = `${JSON.stringify(records, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) throw new Error("src/data/research-atlas.json is stale; run npm run atlas:compile.");
  console.log("Verified 2,500 compiled research-atlas rows (1,316 atomic candidates; 1,184 configurations)." );
} else {
  await writeFile(outputPath, output);
  console.log("Compiled 2,500 honestly labelled research-atlas rows (1,316 atomic candidates; 1,184 configurations)." );
}

async function researchFile(file) {
  return readFile(resolve(root, "research/agents", file), "utf8");
}

function fieldsFromSemicolons(value) {
  return new Map(value.split(/;\s+(?=[A-Z][^;]+:)/).map((part) => {
    const separator = part.indexOf(":");
    return [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()];
  }));
}

function fieldsFromPipes(value) {
  return new Map(value.split(" | ").map((part) => {
    const separator = part.indexOf("=");
    return [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()];
  }));
}

function field(fields, key) {
  return fields.get(key) ?? "";
}

function fieldAny(fields, keys) {
  return keys.map((key) => fields.get(key)).find(Boolean) ?? "";
}

function tableColumns(line) {
  return line.slice(1, -1).split("|").map((column) => clean(column));
}

function sourceFrom(value) {
  const markdown = value.match(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/);
  if (markdown) return { label: clean(markdown[1]), url: markdown[2] };
  const url = value.match(/https:\/\/[^\s)]+/)?.[0] ?? "";
  return { label: "Primary source", url };
}

function normalizeGrade(value) {
  const grade = clean(value).toLowerCase();
  return grade.includes("official") ? "official" : grade.includes("derived") ? "derived" : "experiment";
}

function clean(value) {
  return String(value ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function githubResearchUrl(file) {
  return `https://github.com/fablgen-agent/tokengauge/blob/main/research/agents/${file}`;
}
