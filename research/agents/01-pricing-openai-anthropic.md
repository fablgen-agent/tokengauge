# OpenAI and Anthropic token-pricing research

Snapshot/observation time: **2026-08-15 UTC**
Research scope: direct, first-party API inference pricing for text tokens. Prices below are **USD per 1,000,000 tokens (MTok)** unless stated otherwise. Partner-cloud pricing, fine-tuning, tools, image/audio/video unit pricing, taxes, negotiated discounts, and consumer subscriptions are out of scope.

## Decision summary for TokenGauge

1. **The checked-in OpenAI snapshot is partly stale.** `src/lib/costs.ts` has the current GPT-5.6 Sol standard rates, but its Terra and Luna rates are higher than the live official rates:

   | Model | Checked in (`input / cached / output`) | Live official standard short-context rate | Result |
   | --- | ---: | ---: | --- |
   | `gpt-5.6-sol` | `5 / 0.5 / 30` | `5 / 0.5 / 30` | Current |
   | `gpt-5.6-terra` | `2.5 / 0.25 / 15` | **`2 / 0.2 / 12`** | Stale |
   | `gpt-5.6-luna` | `1 / 0.1 / 6` | **`0.2 / 0.02 / 1.2`** | Stale |

   The official GPT-5.6 model pages and canonical pricing page agree on the new values when fetched live on 2026-08-15. Indexed/search summaries seen during research still carried the older Terra/Luna values, so a pricing updater must fetch the canonical pages rather than trust search snippets or cached summaries.

2. **OpenAI GPT-5.6 has four billable input categories/tier dimensions that the current `ModelPrice` shape cannot represent:** ordinary input, cached input, cache-write input, and output; each can vary by Standard/Batch/Flex/Fast and by short/long context. Cache-write price is a replacement category, not an additive fee. The only supported GPT-5.6 cache TTL is currently 30 minutes.

3. **OpenAI long context starts only when input exceeds 272K tokens.** For GPT-5.6, the canonical table explicitly publishes the long rates: input/cached/cache-write are 2x their short-context rates and output is 1.5x, applied to the full request. Treat exactly 272,000 as short context because the model pages say the premium applies to `>272K`; see ambiguity notes about the table's inconsistent `<272K` label on older rows.

4. **Batch is a 50% discount for both providers**, but do not blindly halve every displayed field. OpenAI publishes explicit Batch tables and sometimes rounds or omits values (for example GPT-5.4 Batch cached input is `$0.13`, not an inferred `$0.125`). Anthropic says its 50% Batch discount stacks with prompt-cache multipliers, so Batch cache prices can be derived exactly and should be labeled derived.

5. **Anthropic's current canonical pricing page says Claude Sonnet 5's `$2/$10` input/output pricing is now permanent** and that the previously scheduled September 1 increase will not occur. Older, still-live launch/migration/release-note pages continue to say `$3/$15` begins September 1. On the requested date, both stories yield the same current `$2/$10` rate; for future snapshots the canonical pricing page should win, while the inconsistency should trigger an alert.

6. **Anthropic does not charge a long-context premium for Claude 4.6 and later models.** The full 1M-token context window is billed at the standard per-token rate, and normal cache and Batch discounts still apply.

## Extraction legend

- **E** — value appears explicitly in a first-party Markdown pricing table; reliably machine-extractable.
- **D** — exact arithmetic derivation from an explicit first-party price and explicit multiplier/stacking rule; inputs are machine-extractable, but the value itself is not a table cell.
- **—** — no price is published for that combination. This means `null`/unsupported/unknown, **never zero**.

Both providers expose live `text/markdown` representations of their pricing pages. This makes table values reliably extractable today, but neither provider promises a stable pricing schema/API. Parsers need snapshot tests, semantic headings, lifecycle joins, and anomaly alerts.

## OpenAI

Primary source for every OpenAI price row: **OA-P**, the canonical pricing table. All values in the two OpenAI tables below are extraction grade **E**.

### GPT-5.6 complete pricing matrix

The context boundary is `short <= 272,000 input tokens`; `long > 272,000 input tokens`. `Write` is the total charge for tokens written to cache, not a surcharge on top of ordinary input.

| Processing | Model | Context | Input | Cached input | Cache write | Output | Source/MX |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Standard | `gpt-5.6-sol` | short | 5 | 0.5 | 6.25 | 30 | OA-P / E |
| Standard | `gpt-5.6-sol` | long | 10 | 1 | 12.5 | 45 | OA-P / E |
| Standard | `gpt-5.6-terra` | short | 2 | 0.2 | 2.5 | 12 | OA-P / E |
| Standard | `gpt-5.6-terra` | long | 4 | 0.4 | 5 | 18 | OA-P / E |
| Standard | `gpt-5.6-luna` | short | 0.2 | 0.02 | 0.25 | 1.2 | OA-P / E |
| Standard | `gpt-5.6-luna` | long | 0.4 | 0.04 | 0.5 | 1.8 | OA-P / E |
| Batch | `gpt-5.6-sol` | short | 2.5 | 0.25 | 3.125 | 15 | OA-P / E |
| Batch | `gpt-5.6-sol` | long | 5 | 0.5 | 6.25 | 22.5 | OA-P / E |
| Batch | `gpt-5.6-terra` | short | 1 | 0.1 | 1.25 | 6 | OA-P / E |
| Batch | `gpt-5.6-terra` | long | 2 | 0.2 | 2.5 | 9 | OA-P / E |
| Batch | `gpt-5.6-luna` | short | 0.1 | 0.01 | 0.125 | 0.6 | OA-P / E |
| Batch | `gpt-5.6-luna` | long | 0.2 | 0.02 | 0.25 | 0.9 | OA-P / E |
| Flex | `gpt-5.6-sol` | short | 2.5 | 0.25 | 3.125 | 15 | OA-P / E |
| Flex | `gpt-5.6-sol` | long | 5 | 0.5 | 6.25 | 22.5 | OA-P / E |
| Flex | `gpt-5.6-terra` | short | 1 | 0.1 | 1.25 | 6 | OA-P / E |
| Flex | `gpt-5.6-terra` | long | 2 | 0.2 | 2.5 | 9 | OA-P / E |
| Flex | `gpt-5.6-luna` | short | 0.1 | 0.01 | 0.125 | 0.6 | OA-P / E |
| Flex | `gpt-5.6-luna` | long | 0.2 | 0.02 | 0.25 | 0.9 | OA-P / E |
| Fast | `gpt-5.6-sol` | short | 10 | 1 | 12.5 | 60 | OA-P / E |
| Fast | `gpt-5.6-sol` | long | 20 | 2 | 25 | 90 | OA-P / E |
| Fast | `gpt-5.6-terra` | short | 4 | 0.4 | 5 | 24 | OA-P / E |
| Fast | `gpt-5.6-terra` | long | 8 | 0.8 | 10 | 36 | OA-P / E |
| Fast | `gpt-5.6-luna` | short | 0.4 | 0.04 | 0.5 | 2.4 | OA-P / E |
| Fast | `gpt-5.6-luna` | long | 0.8 | 0.08 | 1 | 3.6 | OA-P / E |

Processing notes:

- Batch is explicitly 50% lower than synchronous Standard and completes within 24 hours (OA-B).
- Flex has the same published GPT-5.6 prices as Batch but is a separate lower-price/higher-latency synchronous processing tier, not Batch.
- Fast is the renamed Priority processing tier. The pricing page says the rename occurred on 2026-07-30 and both `service_tier: "priority"` and `service_tier: "fast"` work.
- Eligible regional/data-residency endpoints for models released on or after 2026-03-05 receive a 10% uplift. Eligibility and region are separate data that must not be inferred from the base price table.

### Other published OpenAI text-model prices

This is the canonical page's modern/commonly referenced model set. The table preserves explicit Batch values and dashes; it does not assume that a missing Batch cached-input value equals half the Standard value. Cache writes before GPT-5.6 have no extra write fee and therefore no separate price cell.

| Model | Std input | Std cached | Std output | Batch input | Batch cached | Batch output | Explicit long-context row | Source/MX |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `gpt-5.5` | 5 | 0.5 | 30 | 2.5 | 0.25 | 15 | Std `10 / 1 / 45`; Batch `5 / 0.5 / 22.5` | OA-P / E |
| `gpt-5.5-pro` | 30 | — | 180 | 15 | — | 90 | Std `60 / — / 270`; Batch — | OA-P / E |
| `gpt-5.4` | 2.5 | 0.25 | 15 | 1.25 | **0.13** | 7.5 | Std `5 / 0.5 / 22.5`; Batch `2.5 / 0.25 / 11.25` | OA-P / E |
| `gpt-5.4-mini` | 0.75 | 0.075 | 4.5 | 0.375 | 0.0375 | 2.25 | — | OA-P / E |
| `gpt-5.4-nano` | 0.2 | 0.02 | 1.25 | 0.1 | 0.01 | 0.625 | — | OA-P / E |
| `gpt-5.4-pro` | 30 | — | 180 | 15 | — | 90 | Std `60 / — / 270`; Batch `30 / — / 135` | OA-P / E |
| `gpt-5.2` | 1.75 | 0.175 | 14 | 0.875 | 0.0875 | 7 | — | OA-P / E |
| `gpt-5.2-pro` | 21 | — | 168 | 10.5 | — | 84 | — | OA-P / E |
| `gpt-5.1` | 1.25 | 0.125 | 10 | 0.625 | 0.0625 | 5 | — | OA-P / E |
| `gpt-5` | 1.25 | 0.125 | 10 | 0.625 | 0.0625 | 5 | — | OA-P / E |
| `gpt-5-mini` | 0.25 | 0.025 | 2 | 0.125 | 0.0125 | 1 | — | OA-P / E |
| `gpt-5-nano` | 0.05 | 0.005 | 0.4 | 0.025 | 0.0025 | 0.2 | — | OA-P / E |
| `gpt-5-pro` | 15 | — | 120 | 7.5 | — | 60 | — | OA-P / E |
| `gpt-4.1` | 2 | 0.5 | 8 | 1 | — | 4 | — | OA-P / E |
| `gpt-4.1-mini` | 0.4 | 0.1 | 1.6 | 0.2 | — | 0.8 | — | OA-P / E |
| `gpt-4.1-nano` | 0.1 | 0.025 | 0.4 | 0.05 | — | 0.2 | — | OA-P / E |
| `gpt-4o` | 2.5 | 1.25 | 10 | 1.25 | — | 5 | — | OA-P / E |
| `gpt-4o-mini` | 0.15 | 0.075 | 0.6 | 0.075 | — | 0.3 | — | OA-P / E |
| `o1` | 15 | 7.5 | 60 | 7.5 | — | 30 | — | OA-P / E |
| `o1-pro` | 150 | — | 600 | 75 | — | 300 | — | OA-P / E |
| `o3-pro` | 20 | — | 80 | 10 | — | 40 | — | OA-P / E |
| `o3` | 2 | 0.5 | 8 | 1 | — | 4 | — | OA-P / E |
| `o4-mini` | 1.1 | 0.275 | 4.4 | 0.55 | — | 2.2 | — | OA-P / E |
| `o3-mini` | 1.1 | 0.55 | 4.4 | 0.55 | — | 2.2 | — | OA-P / E |

The canonical source also publishes rows for older/legacy IDs (`gpt-4o-2024-05-13`, `gpt-4-turbo-2024-04-09`, `gpt-4-0613`, GPT-3.5 variants, `davinci-002`, and `babbage-002`). A production importer should ingest them but join against the official model/deprecation catalog before presenting them as selectable. Published price does not prove current availability.

### OpenAI effective date

OpenAI's pricing and individual model pages do **not** state an effective-from date for the current GPT-5.6 dollar values. Store:

- `effective_from: null`
- `observed_at: 2026-08-15T00:00:00Z` (or the precise fetch time in an automated job)
- the fetched source body/hash

Do not substitute the model knowledge-cutoff date or pricing-page crawl date as a price effective date. The Fast/Priority rename has an explicit date (2026-07-30), but that is not the effective date of all token prices.

## Anthropic

Primary source for every Anthropic price row: **AN-P**, the canonical Claude pricing table. Display-name rows are joined to model IDs from AN-M/AN-ID. All standard prices and Batch input/output prices below are extraction grade **E**. Batch cache values are grade **D**, because Anthropic explicitly says the cache multipliers stack with the 50% Batch discount.

### Current first-party Claude model prices

`5m write` and `1h write` are distinct cache-creation prices. `Read` means cache hit/refresh.

| Model / API price key | Standard: input / 5m write / 1h write / read / output | Batch: input / 5m write / 1h write / read / output | Context-price rule | Availability | Source/MX |
| --- | --- | --- | --- | --- | --- |
| Claude Fable 5 / `claude-fable-5` | `10 / 12.5 / 20 / 1 / 50` | `5 / 6.25 / 10 / 0.5 / 25` | Full 1M at standard rate | Generally available | AN-P / E+D |
| Claude Mythos 5 / `claude-mythos-5` | `10 / 12.5 / 20 / 1 / 50` | `5 / 6.25 / 10 / 0.5 / 25` | Full 1M at standard rate | Limited/invitation only | AN-P / E+D |
| Claude Opus 5 / `claude-opus-5` | `5 / 6.25 / 10 / 0.5 / 25` | `2.5 / 3.125 / 5 / 0.25 / 12.5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Opus 4.8 / `claude-opus-4-8` | `5 / 6.25 / 10 / 0.5 / 25` | `2.5 / 3.125 / 5 / 0.25 / 12.5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Opus 4.7 / `claude-opus-4-7` | `5 / 6.25 / 10 / 0.5 / 25` | `2.5 / 3.125 / 5 / 0.25 / 12.5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Opus 4.6 / `claude-opus-4-6` | `5 / 6.25 / 10 / 0.5 / 25` | `2.5 / 3.125 / 5 / 0.25 / 12.5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Opus 4.5 / `claude-opus-4-5` alias | `5 / 6.25 / 10 / 0.5 / 25` | `2.5 / 3.125 / 5 / 0.25 / 12.5` | Not covered by no-premium 1M statement | Active | AN-P / E+D |
| Claude Sonnet 5 / `claude-sonnet-5` | `2 / 2.5 / 4 / 0.2 / 10` | `1 / 1.25 / 2 / 0.1 / 5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Sonnet 4.6 / `claude-sonnet-4-6` | `3 / 3.75 / 6 / 0.3 / 15` | `1.5 / 1.875 / 3 / 0.15 / 7.5` | Full 1M at standard rate | Active | AN-P / E+D |
| Claude Sonnet 4.5 / `claude-sonnet-4-5` alias | `3 / 3.75 / 6 / 0.3 / 15` | `1.5 / 1.875 / 3 / 0.15 / 7.5` | Not covered by no-premium 1M statement | Active | AN-P / E+D |
| Claude Haiku 4.5 / `claude-haiku-4-5` alias | `1 / 1.25 / 2 / 0.1 / 5` | `0.5 / 0.625 / 1 / 0.05 / 2.5` | 200K context; no long tier published | Active | AN-P / E+D |

Before Claude 4.6, the short aliases resolve to dated snapshots. Official examples identify `claude-opus-4-5-20251101`, `claude-sonnet-4-5-20250929`, and `claude-haiku-4-5-20251001`. Price records should attach to a provider price key/model family and allow multiple aliases/snapshots, rather than assume every pricing-table display name is itself an API ID.

AN-P also publishes prices for retired models (Opus 4.1, Opus 4, Sonnet 4, and Haiku 3.5) because they remain on one or more partner clouds. They should not be presented as current first-party Claude API choices merely because a price row exists.

### Anthropic modifiers and effective date

- Prompt-cache multipliers: 5-minute write `1.25x` base input, 1-hour write `2x`, read/hit `0.1x`.
- Batch: `0.5x` input and output; cache multipliers stack with it.
- US-only inference: Claude 4.6 and later receive `1.1x` on every token category when `inference_geo: "us"`; global routing is the base price. Do not apply the multiplier to earlier models.
- Fast mode: first-party Claude API only, Opus 5 and Opus 4.8 only, `10` input and `50` output per MTok. Cache and data-residency multipliers stack. Fast is unavailable with Batch.
- Long context: Claude 4.6 and later models include the full 1M window at the standard rate. A 900K-token request has the same per-token rate as a 9K-token request.
- Claude Sonnet 5 launched on 2026-06-30 at `$2/$10`. AN-P now states that this is the permanent standard price and the announced 2026-09-01 increase is canceled. The date when Anthropic changed that future-price decision is not stated.
- For every other current Anthropic price, the canonical page does not publish a price effective-from date. Store `effective_from: null` and `observed_at: 2026-08-15T00:00:00Z` rather than inventing one.

## Normalized JSON-shape proposal

Use one record per provider/model/processing/context/effective interval. Numeric fields are USD per MTok. `null` means not published/not applicable, never free. This shape intentionally separates source facts from exact derived prices.

```json
{
  "provider": "openai | anthropic",
  "price_key": "provider pricing-table key",
  "model_ids": ["canonical-id", "optional-alias-or-snapshot"],
  "display_name": "Human label",
  "lifecycle": "active | limited | retired | unknown",
  "modality": "text",
  "currency": "USD",
  "unit": { "kind": "token", "quantity": 1000000 },
  "processing_tier": "standard | batch | flex | fast",
  "context_tier": {
    "name": "default | short | long",
    "min_input_tokens_exclusive": null,
    "max_input_tokens_inclusive": null
  },
  "rates": {
    "input": 0,
    "cached_input": null,
    "cache_write": null,
    "cache_write_5m": null,
    "cache_write_1h": null,
    "output": 0
  },
  "modifiers": [
    {
      "condition": "inference_geo == us",
      "multiplier": 1.1,
      "applies_to": ["input", "cached_input", "cache_write", "output"]
    }
  ],
  "effective": {
    "from": null,
    "through": null,
    "observed_at": "2026-08-15T00:00:00Z"
  },
  "provenance": {
    "source_id": "OA-P | AN-P",
    "url": "https://.../pricing",
    "machine_url": "https://.../pricing.md",
    "table_heading": "Standard pricing data",
    "extraction": "explicit | derived",
    "machine_extractable": true,
    "http_status": 200,
    "content_type": "text/markdown",
    "fetched_at": "2026-08-15T00:00:00Z",
    "body_sha256": "populate-at-fetch"
  },
  "ambiguities": []
}
```

Recommended calculation model:

```text
cost = sum(token_count_for_category * applicable_rate / 1_000_000)
```

Token categories must be mutually exclusive. In particular, OpenAI GPT-5.6 cache writes are not also charged at ordinary-input price.

## Machine-extraction assessment

| Source | Live machine form | Reliability | Required safeguards |
| --- | --- | --- | --- |
| OpenAI pricing | `https://developers.openai.com/api/docs/pricing.md` returned HTTP 200 `text/markdown` | **High for displayed values.** Named Standard/Batch/Flex/Fast sections and explicit short/long columns. | Preserve published decimals and dashes; do not derive over explicit values; join lifecycle separately; alert on missing tier headings/duplicate model rows. |
| Anthropic pricing | `https://platform.claude.com/docs/en/about-claude/pricing.md` returned HTTP 200 `text/markdown` | **High for displayed values.** Standard cache and Batch tables are plain Markdown. | Parse notes as well as tables (the Sonnet 5 note changes future pricing); join display names to model IDs; label stacked Batch-cache calculations derived. |
| Effective dates | No complete machine-readable interval in either pricing table | **Low/not available.** | Keep `effective_from` nullable, store observation timestamp + body hash, and build history from periodic snapshots. |
| Search/index summaries | Can lag live canonical pages | **Not reliable for pricing ingestion.** | Never ingest snippets. Fetch the canonical `.md` URL directly and cross-check current model pages on large deltas. |

No official public JSON pricing API was found in the selected first-party documentation. The Markdown endpoints are the best available ingestion surface, but their structure is not contractually versioned.

## Explicit ambiguities and do-not-invent rules

1. **Price effective dates are mostly absent.** Observation date is not an effective date.
2. **OpenAI exact 272K boundary wording is inconsistent:** model pages say `>272K` triggers the premium, table tooltips say short `<=272K`, but some row labels say `<272K`. Normalize exactly 272K as short and retain this source conflict in provenance.
3. **OpenAI dashes are not zeros.** They can mean unsupported, unavailable, or simply not published. Preserve `null` plus raw text.
4. **OpenAI explicit Batch values beat arithmetic.** Keep GPT-5.4 Batch cached input at the published `$0.13`; do not replace it with `$0.125`.
5. **OpenAI GPT-5.5 Pro Batch long context is blank** on OA-P even though Standard long is published. Do not fill it by multiplication.
6. **OpenAI published price does not prove model availability.** Join the pricing table with the live model and deprecation catalogs.
7. **Anthropic Sonnet 5 future pricing conflicts across official pages.** AN-P says the increase is canceled; older launch/migration/release-note pages say it will occur. On 2026-08-15 the current price is unambiguous at `$2/$10`; any post-August projection must use AN-P and retain a conflict alert until the other pages converge.
8. **Anthropic Batch-cache numeric values are derived.** The 50% discount and cache multipliers explicitly stack, but Anthropic does not print those combined numbers in the Batch table.
9. **Anthropic 4.5 models are not covered by the no-premium 1M statement.** Do not create a long-context tier or premium without another explicit official source.
10. **Partner-cloud and regional rates are separate products.** Do not silently apply first-party base prices to Bedrock/Vertex/Azure, nor their regional premiums to global first-party traffic.
11. **Tokenizer changes affect comparable-workload cost.** Anthropic says Claude 4.7 and later models use a tokenizer that produces approximately 30% more tokens for the same text, workload-dependent. Per-token price alone is not normalized cost for identical text.

## Verified first-party sources

All URLs below returned HTTP 200 when verified on 2026-08-15.

| ID | Official source | What it establishes | Machine extraction |
| --- | --- | --- | --- |
| OA-P | https://developers.openai.com/api/docs/pricing and https://developers.openai.com/api/docs/pricing.md | Canonical Standard/Batch/Flex/Fast prices, long-context tables, regional uplift, Fast rename | Yes, Markdown tables |
| OA-M | https://developers.openai.com/api/docs/models | Current model IDs and current headline prices | Yes, Markdown/HTML; secondary to OA-P for price matrix |
| OA-S | https://developers.openai.com/api/docs/models/gpt-5.6-sol | Sol standard price, `>272K` rule, 1.25x cache-write rule | Yes |
| OA-T | https://developers.openai.com/api/docs/models/gpt-5.6-terra | Terra current standard price and long-context rule | Yes |
| OA-L | https://developers.openai.com/api/docs/models/gpt-5.6-luna | Luna current standard price and long-context rule | Yes |
| OA-B | https://developers.openai.com/api/docs/guides/batch | 50% discount and 24-hour completion target | Yes |
| OA-C | https://developers.openai.com/api/docs/guides/prompt-caching | Cache categories, 1.25x write total rate, 0.1x reads, 30-minute TTL, no write fee before GPT-5.6 | Yes |
| AN-P | https://platform.claude.com/docs/en/about-claude/pricing and https://platform.claude.com/docs/en/about-claude/pricing.md | Canonical model/cache/Batch/Fast/data-residency/long-context prices and Sonnet 5 cancellation note | Yes, Markdown tables + notes |
| AN-M | https://platform.claude.com/docs/en/about-claude/models/overview | Current model IDs, availability, context windows | Yes |
| AN-ID | https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions | Canonical vs alias/snapshot ID rules | Yes |
| AN-B | https://platform.claude.com/docs/en/build-with-claude/batch-processing | All active models support Batch; operational constraints | Yes |
| AN-RN | https://platform.claude.com/docs/en/release-notes/overview | Sonnet 5's 2026-06-30 launch and the older announcement of a future price increase, now superseded by AN-P | Yes |
