import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  pricingCompatibilityPayload,
  pricingFeedPayload,
} from "@/lib/pricing-feed";

import { requirePublishedRate, resolvePricingCard } from "../../examples/pricing-feed-consumer.mjs";
import { assertPricingContract } from "../../scripts/pricing-contract-validation.mjs";
import { assertJsonSchema, jsonSchemaErrors } from "../../scripts/json-schema-validator.mjs";

const schema = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/schemas/pricing-v1.schema.json"), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/fixtures/pricing-v1.json"), "utf8"));
const fixtureBytes = fs.readFileSync(path.join(process.cwd(), "public/fixtures/pricing-v1.json"));
const schemaBytes = fs.readFileSync(path.join(process.cwd(), "public/schemas/pricing-v1.schema.json"));
const checksums = fs.readFileSync(path.join(process.cwd(), "public/fixtures/SHA256SUMS"), "utf8");

function sha256(value: Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

describe("Pricing Feed v1 contract", () => {
  it("validates the generated feed and tagged-release fixture against the checked-in schema", () => {
    const feed = pricingFeedPayload();

    expect(() => assertJsonSchema(schema, feed)).not.toThrow();
    expect(fixture).toEqual(feed);
    expect(feed).toMatchObject({
      schemaVersion: "1",
      currency: "USD",
      unitTokens: 1_000_000,
    });
    expect(feed.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isFinite(Date.parse(feed.observedAt))).toBe(true);
    expect(feed.providers).toHaveLength(9);
    expect(feed.models).toHaveLength(58);
    expect(new Set(feed.models.map((card) => card.id)).size).toBe(feed.models.length);
    expect(feed.models.every((card) => card.sourceUrl.startsWith("https://"))).toBe(true);
    expect(checksums).toBe([
      `${sha256(fixtureBytes)}  pricing-v1.json`,
      `${sha256(schemaBytes)}  pricing-v1.schema.json`,
      "",
    ].join("\n"));
  });

  it("keeps the compatibility API equal after removing only the version marker", () => {
    const { schemaVersion, ...compatibility } = pricingFeedPayload();

    expect(schemaVersion).toBe("1");
    expect(compatibility).toEqual(pricingCompatibilityPayload());
  });

  it("rejects account, prompt, and key fields that do not belong in the public contract", () => {
    const invalid = structuredClone(fixture);
    invalid.models[0].apiKey = "not-allowed";
    invalid.accountId = "not-allowed";

    expect(jsonSchemaErrors(schema, invalid)).toEqual(expect.arrayContaining([
      "$.accountId is not allowed",
      "$.models[0].apiKey is not allowed",
    ]));
    expect(JSON.stringify(fixture)).not.toMatch(/"(?:accountId|apiKey|prompt|checkoutSessionId)"/);
  });

  it("rejects untrusted feeds before selecting a card", () => {
    expect(() => resolvePricingCard({ schemaVersion: "1", models: [{ id: "x" }] }, {
      cardId: "x",
      inputTokens: 1,
      at: fixture.observedAt,
    })).toThrow("JSON Schema validation failed");

    const duplicate = structuredClone(fixture);
    duplicate.models[1].id = duplicate.models[0].id;
    expect(() => assertPricingContract(schema, duplicate)).toThrow("Pricing card IDs must be unique");

    const conflictingBounds = structuredClone(fixture);
    conflictingBounds.models[0].minInputTokensExclusive = 10;
    conflictingBounds.models[0].minInputTokensInclusive = 11;
    expect(() => assertPricingContract(schema, conflictingBounds)).toThrow("conflicting lower input bounds");

    const impossibleUpperBound = structuredClone(fixture);
    delete impossibleUpperBound.models[0].maxInputTokensInclusive;
    impossibleUpperBound.models[0].maxInputTokensExclusive = 0;
    expect(() => assertPricingContract(schema, impossibleUpperBound)).toThrow("empty input band");

    const impossibleLowerBound = structuredClone(fixture);
    impossibleLowerBound.models[0].minInputTokensExclusive = Number.MAX_SAFE_INTEGER;
    expect(() => assertPricingContract(schema, impossibleLowerBound)).toThrow("empty input band");

    const unexplainedReview = structuredClone(fixture);
    unexplainedReview.models[0].reviewStatus = "manual-review";
    expect(() => assertPricingContract(schema, unexplainedReview)).toThrow("requires a review note");

    const hostlessSource = structuredClone(fixture);
    hostlessSource.models[0].sourceUrl = "https://?secret";
    expect(() => assertPricingContract(schema, hostlessSource)).toThrow("JSON Schema validation failed");

    for (const malformedSource of ["https://example.com/ bad", "https://example.com/%"]) {
      const malformed = structuredClone(fixture);
      malformed.models[0].sourceUrl = malformedSource;
      expect(() => assertPricingContract(schema, malformed)).toThrow("JSON Schema validation failed");
    }
  });

  it("treats effectiveUntil as exclusive at the DeepSeek transition", () => {
    expect(resolvePricingCard(fixture, {
      cardId: "deepseek:deepseek-v4-flash:off-peak",
      inputTokens: 1_000,
      at: "2026-08-22T15:59:59Z",
    }).tierLabel).toContain("Off-peak");
    expect(() => resolvePricingCard(fixture, {
      cardId: "deepseek:deepseek-v4-flash:off-peak",
      inputTokens: 1_000,
      at: "2026-08-22T16:00:00Z",
    })).toThrow("expired");
    expect(resolvePricingCard(fixture, {
      cardId: "deepseek:deepseek-v4-flash:off-peak-weekend",
      inputTokens: 1_000,
      at: "2026-08-22T16:00:00Z",
    }).effectiveFrom).toBe("2026-08-22T16:00:00Z");
  });

  it("rejects ambiguous or impossible timestamps instead of normalizing them", () => {
    expect(() => resolvePricingCard(fixture, {
      cardId: "openai:gpt-5.6-sol:standard:short",
      inputTokens: 1_000,
      at: "2026-02-30T00:00:00Z",
    })).toThrow("valid RFC 3339 timestamp");

    const invalid = structuredClone(fixture);
    invalid.observedAt = "2026-02-30T00:00:00Z";
    expect(jsonSchemaErrors(schema, invalid)).toContain("$.observedAt is not a valid date-time");
  });

  it("covers all of 31 December for Gemini introductory rows under an exclusive end bound", () => {
    expect(resolvePricingCard(fixture, {
      cardId: "google:gemini-3.7-flash:standard:intro",
      inputTokens: 1_000,
      at: "2026-12-31T23:59:59Z",
    }).effectiveUntil).toBe("2027-01-01T00:00:00Z");
    expect(() => resolvePricingCard(fixture, {
      cardId: "google:gemini-3.7-flash:standard:intro",
      inputTokens: 1_000,
      at: "2027-01-01T00:00:00Z",
    })).toThrow("expired");
  });

  it("preserves the inclusive OpenAI short-context boundary", () => {
    expect(resolvePricingCard(fixture, {
      cardId: "openai:gpt-5.6-sol:standard:short",
      inputTokens: 272_000,
      at: fixture.observedAt,
    }).maxInputTokensInclusive).toBe(272_000);
    expect(() => resolvePricingCard(fixture, {
      cardId: "openai:gpt-5.6-sol:standard:short",
      inputTokens: 272_001,
      at: fixture.observedAt,
    })).toThrow("does not cover");
    expect(resolvePricingCard(fixture, {
      cardId: "openai:gpt-5.6-sol:standard:long",
      inputTokens: 272_001,
      at: fixture.observedAt,
    }).minInputTokensExclusive).toBe(272_000);
  });

  it("fails closed for unknown cards and unpublished rates while preserving review provenance", () => {
    expect(() => resolvePricingCard(fixture, {
      cardId: "unknown:model:standard",
      inputTokens: 1_000,
      at: fixture.observedAt,
    })).toThrow("Unknown pricing card");

    const cohere = resolvePricingCard(fixture, {
      cardId: "cohere:command-a-03-2025:standard",
      inputTokens: 1_000,
      at: fixture.observedAt,
    });
    expect(cohere).toMatchObject({ reviewStatus: "manual-review", cachedInputPerMillionUsd: null });
    expect(cohere.provenanceUrls).toHaveLength(2);
    expect(requirePublishedRate(cohere, "inputPerMillionUsd")).toBe(2.5);
    expect(() => requirePublishedRate(cohere, "cachedInputPerMillionUsd")).toThrow("do not treat it as zero");
  });
});
