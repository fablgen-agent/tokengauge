import fs from "node:fs";

import { assertPricingContract } from "../scripts/pricing-contract-validation.mjs";

const pricingSchema = JSON.parse(fs.readFileSync(
  new URL("../public/schemas/pricing-v1.schema.json", import.meta.url),
  "utf8",
));

const rfc3339Pattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/;

function validTimestamp(value, label) {
  const match = typeof value === "string" ? rfc3339Pattern.exec(value) : null;
  if (!match) throw new Error(`${label} is not a valid RFC 3339 timestamp.`);
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] ||
    hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59
  ) throw new Error(`${label} is not a valid RFC 3339 timestamp.`);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is not a valid RFC 3339 timestamp.`);
  return timestamp;
}

function optionalTokenBoundary(card, field) {
  if (!Object.hasOwn(card, field)) return undefined;
  const value = card[field];
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${card.id}.${field} must be a non-negative safe integer.`);
  return value;
}

function withinInputBand(card, inputTokens) {
  const contextWindow = optionalTokenBoundary(card, "contextWindowTokens");
  const minExclusive = optionalTokenBoundary(card, "minInputTokensExclusive");
  const minInclusive = optionalTokenBoundary(card, "minInputTokensInclusive");
  const maxExclusive = optionalTokenBoundary(card, "maxInputTokensExclusive");
  const maxInclusive = optionalTokenBoundary(card, "maxInputTokensInclusive");
  if (minExclusive !== undefined && minInclusive !== undefined) throw new Error(`${card.id} has conflicting lower input bounds.`);
  if (maxExclusive !== undefined && maxInclusive !== undefined) throw new Error(`${card.id} has conflicting upper input bounds.`);
  if (contextWindow !== undefined && inputTokens > contextWindow) return false;
  if (minExclusive !== undefined && inputTokens <= minExclusive) return false;
  if (minInclusive !== undefined && inputTokens < minInclusive) return false;
  if (maxExclusive !== undefined && inputTokens >= maxExclusive) return false;
  if (maxInclusive !== undefined && inputTokens > maxInclusive) return false;
  return true;
}

export function resolvePricingCard(feed, { cardId, inputTokens, at }) {
  assertPricingContract(pricingSchema, feed);
  if (!Number.isSafeInteger(inputTokens) || inputTokens < 0) throw new Error("inputTokens must be a non-negative safe integer.");
  const requestedAt = validTimestamp(at, "at");
  const card = feed.models.find((candidate) => candidate.id === cardId);
  if (!card) throw new Error(`Unknown pricing card: ${cardId}`);
  if (Object.hasOwn(card, "effectiveFrom") && requestedAt < validTimestamp(card.effectiveFrom, `${card.id}.effectiveFrom`)) {
    throw new Error(`${card.id} is not effective yet.`);
  }
  if (Object.hasOwn(card, "effectiveUntil") && requestedAt >= validTimestamp(card.effectiveUntil, `${card.id}.effectiveUntil`)) {
    throw new Error(`${card.id} is expired.`);
  }
  if (!withinInputBand(card, inputTokens)) throw new Error(`${card.id} does not cover ${inputTokens} input tokens.`);
  return card;
}

export function requirePublishedRate(card, field) {
  const allowed = new Set([
    "inputPerMillionUsd",
    "cachedInputPerMillionUsd",
    "cacheWritePerMillionUsd",
    "cacheWriteOneHourPerMillionUsd",
    "explicitCacheReadPerMillionUsd",
    "explicitCacheStoragePerMillionTokenHourUsd",
    "outputPerMillionUsd",
  ]);
  if (!allowed.has(field)) throw new Error(`Unknown pricing field: ${field}`);
  const rate = card[field];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0) {
    throw new Error(`${field} is unavailable for ${card.id}; do not treat it as zero.`);
  }
  return rate;
}
