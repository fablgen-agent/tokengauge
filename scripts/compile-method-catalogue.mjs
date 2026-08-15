import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");

const sources = [
  {
    file: "research/agents/04-methods-cache-context.md",
    exclude: new Set(["PC-01", "PC-03", "PC-05", "PC-08", "PC-09", "PC-10", "CTX-01", "CTX-03", "CTX-04", "CTX-05", "CTX-06", "CTX-07", "CMP-01", "CMP-04", "RET-02", "RET-04"]),
  },
  {
    file: "research/agents/05-methods-prompt-output-tools.md",
    exclude: new Set(["PD-01", "PD-02", "PD-03", "PD-04", "PD-05", "PD-06", "PD-07", "PD-08", "PD-09", "PD-10", "OC-01", "OC-02", "OC-03", "OC-04", "OC-05", "OC-06", "OC-07", "SO-01", "SO-02", "SO-04", "TL-01", "TL-09", "CA-01", "CA-02", "CA-05", "CA-06"]),
  },
  {
    file: "research/agents/06-methods-routing-batch-evals.md",
    include: new Set(["MRE-002", "MRE-003", "MRE-004", "MRE-006", "MRE-020", "MRE-026", "MRE-041", "MRE-045", "MRE-046", "MRE-051", "MRE-052"]),
  },
  {
    file: "research/agents/07-provider-specific-methods.md",
    include: new Set(["PS-XA-04", "PS-DS-02", "PS-DS-04", "PS-QW-03", "PS-MI-03", "PS-CO-01"]),
  },
];

const methods = [];
for (const source of sources) {
  const markdown = await readFile(resolve(root, source.file), "utf8");
  for (const method of parseMethods(markdown)) {
    if (source.include && !source.include.has(method.researchId)) continue;
    if (source.exclude?.has(method.researchId)) continue;
    methods.push(method);
  }
}

if (methods.length < 77) {
  throw new Error(`Expected at least 77 canonical compiled Pro methods, found ${methods.length}. Review the curated include/exclude registry.`);
}

const ids = new Set(methods.map((method) => method.id));
if (ids.size !== methods.length) throw new Error("Compiled research method IDs are not unique.");

const requiredReplacementIds = sources.flatMap((source) => [...(source.include ?? [])]);
const compiledResearchIds = new Set(methods.map((method) => method.researchId));
for (const researchId of requiredReplacementIds) {
  if (!compiledResearchIds.has(researchId)) throw new Error(`Required canonical replacement ${researchId} was not compiled.`);
}

const duplicateResearchIds = ["PC-08", "CA-06", "PD-09", "PD-06", "PD-07", "SO-01", "TL-01", "TL-09"];
for (const researchId of duplicateResearchIds) {
  if (compiledResearchIds.has(researchId)) throw new Error(`Semantic duplicate ${researchId} must remain an alias, not a sellable method.`);
}

await writeFile(
  resolve(root, "src/data/research-methods.json"),
  `${JSON.stringify(methods, null, 2)}\n`,
);

console.log(`Compiled ${methods.length} researched methods into src/data/research-methods.json.`);

function parseMethods(markdown) {
  const headings = [...markdown.matchAll(/^### ([A-Z]+(?:-[A-Z]+)*-\d+) — (.+)$/gm)];
  return headings.map((heading, index) => {
    const researchId = heading[1];
    const title = cleanText(heading[2]);
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    const body = markdown.slice(start, end);
    const fields = new Map();

    for (const match of body.matchAll(/^- \*\*([^*]+):\*\*\s*(.+)$/gm)) {
      fields.set(match[1].trim().toLowerCase(), match[2].trim());
    }

    const sourceText = fields.get("source") ?? fields.get("sources") ?? "";
    const sourceMatches = [...sourceText.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)];
    const sourceMatch = sourceMatches[0];
    const urlMatch = sourceText.match(/https:\/\/[^\s)]+/);
    const evidence = cleanText(fields.get("evidence grade") ?? fields.get("evidence") ?? "experiment").toLowerCase();
    const sourceUrls = sourceMatches.map((match) => match[2]);
    if (sourceUrls.length === 0 && urlMatch?.[0]) sourceUrls.push(urlMatch[0]);
    const grade = evidenceGrade(evidence, sourceUrls);

    const method = {
      id: `research-${researchId.toLowerCase()}`,
      canonicalId: `research-${researchId.toLowerCase()}`,
      researchId,
      title,
      category: cleanText(fields.get("category") ?? "Optimization"),
      access: "pro",
      grade,
      summary: cleanText(required(fields, "summary", researchId)),
      action: cleanText(requiredOneOf(fields, ["exact action", "action"], researchId)),
      intervention: cleanText(requiredOneOf(fields, ["exact action", "action"], researchId)),
      measure: cleanText(requiredOneOf(fields, ["measurement plan", "measurement", "measure"], researchId)),
      caveat: cleanText(required(fields, "caveat", researchId)),
      providers: cleanText(fields.get("providers") ?? "Provider-agnostic"),
      aliases: [],
      lastVerified: "2026-08-15",
      experimentType: experimentTypeFor(researchId),
      experimentSupport: "guided-only",
      source: {
        label: cleanText(sourceMatch?.[1] ?? "Primary source"),
        url: sourceMatch?.[2] ?? urlMatch?.[0] ?? "",
      },
      sources: sourceMatches.length
        ? sourceMatches.map((match) => ({ label: cleanText(match[1]), url: match[2] }))
        : [{ label: "Primary source", url: urlMatch?.[0] ?? "" }],
    };

    if (!method.source.url.startsWith("https://")) {
      throw new Error(`${researchId} has no HTTPS source URL.`);
    }
    return method;
  });
}

function evidenceGrade(evidence, sourceUrls) {
  if (evidence.includes("official")) return "official";
  if (evidence.includes("derived")) return "derived";
  if (evidence.includes("experiment")) return "experiment";

  const reportSixGrade = evidence.match(/^([abc])(?:\s|—|-)/)?.[1];
  if (reportSixGrade === "c") return "derived";
  if (reportSixGrade === "b") return "official";
  if (reportSixGrade === "a") {
    return sourceUrls.length > 0 && sourceUrls.every(isOriginalResearchSource) ? "experiment" : "official";
  }
  return "experiment";
}

function isOriginalResearchSource(url) {
  return ["arxiv.org", "aclanthology.org", "proceedings.mlr.press"].some((host) => new URL(url).hostname.endsWith(host));
}

function experimentTypeFor(researchId) {
  if (/^PC-|^CA-/.test(researchId)) return "cache_sequence";
  if (/^CTX-|^CMP-|^RET-|^MM-/.test(researchId)) return "context_diff";
  if (/^PD-/.test(researchId)) return "prompt_diff";
  if (/^OC-/.test(researchId)) return "request_config";
  if (/^SO-|^TL-/.test(researchId)) return "schema_diff";
  if (["MRE-002", "MRE-003", "MRE-004", "MRE-006"].includes(researchId)) return "model_route";
  if (["MRE-020", "MRE-045", "MRE-046", "MRE-051", "PS-DS-02"].includes(researchId)) return "processing_diff";
  if (["MRE-026", "PS-DS-04"].includes(researchId)) return "context_diff";
  if (["PS-XA-04", "PS-MI-03"].includes(researchId)) return "request_config";
  return "guided_only";
}

function required(fields, key, id) {
  const value = fields.get(key);
  if (!value) throw new Error(`${id} is missing ${key}.`);
  return value;
}

function requiredOneOf(fields, keys, id) {
  for (const key of keys) {
    const value = fields.get(key);
    if (value) return value;
  }
  throw new Error(`${id} is missing ${keys.join(" or ")}.`);
}

function cleanText(value) {
  return String(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
