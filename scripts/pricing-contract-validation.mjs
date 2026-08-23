import { assertJsonSchema } from "./json-schema-validator.mjs";

function has(object, key) {
  return Object.hasOwn(object, key);
}

function assertCardBounds(card) {
  const tokenFields = [
    "contextWindowTokens",
    "minInputTokensExclusive",
    "minInputTokensInclusive",
    "maxInputTokensExclusive",
    "maxInputTokensInclusive",
  ];
  for (const field of tokenFields) {
    if (has(card, field) && !Number.isSafeInteger(card[field])) {
      throw new Error(`${card.id}.${field} must be a safe integer.`);
    }
  }
  const lower = ["minInputTokensExclusive", "minInputTokensInclusive"].filter((field) => has(card, field));
  const upper = ["maxInputTokensExclusive", "maxInputTokensInclusive"].filter((field) => has(card, field));
  if (lower.length > 1) throw new Error(`${card.id} has conflicting lower input bounds.`);
  if (upper.length > 1) throw new Error(`${card.id} has conflicting upper input bounds.`);

  const lowerField = lower[0];
  const upperField = upper[0];
  const lowerValue = lowerField === undefined ? undefined : card[lowerField];
  const upperValue = upperField === undefined ? undefined : card[upperField];
  const firstAllowed = lowerValue === undefined
    ? 0
    : lowerValue + (lowerField.endsWith("Exclusive") ? 1 : 0);
  const boundedMaximum = upperValue === undefined
    ? Number.MAX_SAFE_INTEGER
    : upperValue - (upperField.endsWith("Exclusive") ? 1 : 0);
  const lastAllowed = has(card, "contextWindowTokens")
    ? Math.min(boundedMaximum, card.contextWindowTokens)
    : boundedMaximum;
  if (firstAllowed > lastAllowed) throw new Error(`${card.id} has an empty input band.`);

  if (has(card, "contextWindowTokens")) {
    if (upperValue !== undefined && upperValue > card.contextWindowTokens) {
      throw new Error(`${card.id} ends beyond its context window.`);
    }
  }
}

export function assertContractInvariants(contract) {
  const providerIds = contract.providers.map((provider) => provider.id);
  if (new Set(providerIds).size !== providerIds.length) throw new Error("Pricing provider IDs must be unique.");
  const providers = new Map(contract.providers.map((provider) => [provider.id, provider.label]));
  const cardIds = contract.models.map((model) => model.id);
  if (new Set(cardIds).size !== cardIds.length) throw new Error("Pricing card IDs must be unique.");

  for (const card of contract.models) {
    if (!providers.has(card.provider)) throw new Error(`${card.id} uses an undeclared provider.`);
    if (card.providerLabel !== providers.get(card.provider)) {
      throw new Error(`${card.id} provider label does not match the provider ledger.`);
    }
    if (card.effectiveFrom && card.effectiveUntil && Date.parse(card.effectiveFrom) >= Date.parse(card.effectiveUntil)) {
      throw new Error(`${card.id} has an empty or inverted effective interval.`);
    }
    if (card.reviewStatus === "manual-review" && !card.reviewNote) {
      throw new Error(`${card.id} requires a review note when manual review is flagged.`);
    }
    if (card.reviewNote && card.reviewStatus !== "manual-review") {
      throw new Error(`${card.id} has a review note without a manual-review flag.`);
    }
    for (const source of [card.sourceUrl, ...(card.provenanceUrls ?? [])]) {
      const parsed = new URL(source);
      if (parsed.username || parsed.password) throw new Error(`${card.id} source URLs must not contain credentials.`);
    }
    assertCardBounds(card);
  }
}

export function assertPricingContract(schema, contract) {
  assertJsonSchema(schema, contract);
  assertContractInvariants(contract);
}
