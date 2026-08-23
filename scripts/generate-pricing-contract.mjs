import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertPricingContract } from "./pricing-contract-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(root, "src/data/pricing-snapshot.json");
const schemaPath = path.join(root, "public/schemas/pricing-v1.schema.json");
const fixturePath = path.join(root, "public/fixtures/pricing-v1.json");
const checksumPath = path.join(root, "public/fixtures/SHA256SUMS");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function buildPricingContract(snapshot) {
  const providers = [...new Map(snapshot.models.map((model) => [model.provider, model.providerLabel]))]
    .map(([id, label]) => ({ id, label }));
  return {
    schemaVersion: "1",
    observedAt: snapshot.observedAt,
    currency: snapshot.currency,
    unitTokens: snapshot.unitTokens,
    providers,
    models: snapshot.models,
  };
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const schemaBytes = fs.readFileSync(schemaPath);
const schema = JSON.parse(schemaBytes.toString("utf8"));
const contract = buildPricingContract(snapshot);
assertPricingContract(schema, contract);
const expected = `${JSON.stringify(contract, null, 2)}\n`;
const checksums = [
  `${sha256(expected)}  pricing-v1.json`,
  `${sha256(schemaBytes)}  pricing-v1.schema.json`,
  "",
].join("\n");

if (process.argv.includes("--check")) {
  if (!fs.existsSync(fixturePath) || fs.readFileSync(fixturePath, "utf8") !== expected) {
    throw new Error("Pricing contract fixture is stale. Run npm run pricing:contract.");
  }
  if (!fs.existsSync(checksumPath) || fs.readFileSync(checksumPath, "utf8") !== checksums) {
    throw new Error("Pricing contract checksums are stale. Run npm run pricing:contract.");
  }
  console.log(`Verified Pricing Feed v1 fixture (${contract.models.length} cards, ${contract.providers.length} providers).`);
} else {
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, expected);
  fs.writeFileSync(checksumPath, checksums);
  console.log(`Wrote ${path.relative(root, fixturePath)} (${contract.models.length} cards, ${contract.providers.length} providers).`);
}
