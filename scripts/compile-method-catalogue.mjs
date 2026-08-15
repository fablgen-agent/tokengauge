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
    include: new Set(["MRE-002", "MRE-003", "MRE-004", "MRE-006", "MRE-020", "MRE-026", "MRE-041", "MRE-045", "MRE-052"]),
  },
  {
    file: "research/agents/07-provider-specific-methods.md",
    include: new Set(["PS-XA-04", "PS-DS-02", "PS-DS-04", "PS-KI-04", "PS-QW-03", "PS-MI-03", "PS-CO-01", "PS-CO-04"]),
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

if (methods.length !== 85) {
  throw new Error(`Expected 85 canonical compiled methods, found ${methods.length}. Review the curated include/exclude registry.`);
}

const ids = new Set(methods.map((method) => method.id));
if (ids.size !== methods.length) throw new Error("Compiled research method IDs are not unique.");

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
    const grade = evidence.includes("official") ? "official" : evidence.includes("derived") ? "derived" : "experiment";

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
      experimentType: "guided",
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
