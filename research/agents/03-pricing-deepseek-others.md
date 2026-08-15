# Pricing research pass 03 — DeepSeek, Kimi, Qwen, Mistral, and Cohere

Research snapshot: **2026-08-15 UTC**. Scope is first-party, directly purchasable API pricing for token-generating models. The tables preserve what the provider actually publishes; an absent cache price is recorded as **not published**, never as zero. Qwen's dedicated tables explicitly label their currency USD. Where another provider prints only `$`, that symbol is preserved without inventing an ISO currency code.

## Executive findings

- **DeepSeek is ingestible now, but it requires two time regimes.** Its current rates are replaced at exactly `2026-08-16T16:00:00Z` by peak/off-peak rates. The future schedule is already on the live official page.
- **Kimi is highly ingestible.** First-party Markdown exposes literal arrays containing model IDs, cache-hit/cache-miss/output rates, and context windows. Batch has separately published numeric rows and costs 60% of standard pricing, but only for an explicit subset of models.
- **Qwen is ingestible only with region and request-length tier as first-class keys.** Dedicated first-party model pages publish USD standard input/output, implicit-cache, explicit-cache creation/read, and some batch rates. Never collapse these to one global model price.
- **Mistral is ingestible.** Its model cards publish standard input/output prices and API aliases. Prompt caching is an exact global rule—cached prompt tokens cost 10% of the standard input rate—rather than a separately printed numeric field on most cards. Batch is 50% off; regional inference is 1.1× list price.
- **Cohere is partly ingestible.** Four live models have public production token prices. Five newer models are described as “free until rate limits are reached,” but their commercial Model Vault/private-deployment price is not public. Do not encode those as permanently `$0` models.
- **Together was checked and rejected for automated ingestion.** Two live first-party pricing surfaces disagree for identical API models and provide no effective timestamps.

## 1. DeepSeek

### Official sources

- Pricing: https://api-docs.deepseek.com/quick_start/pricing/
- Model lifecycle/change log: https://api-docs.deepseek.com/updates/
- Context caching behavior: https://api-docs.deepseek.com/news/news0802/

### Rates in force on the research date

All prices are `$` per 1,000,000 tokens. These rates were live on 2026-08-15 and remain the current table until the explicitly scheduled change at `2026-08-16T16:00:00Z`.

| API model identifier | Model version shown | Input, cache hit | Input, cache miss | Output | Effective interval | Exact source |
|---|---|---:|---:|---:|---|---|
| `deepseek-v4-flash` | `DeepSeek-V4-Flash-0731` | `$0.0028` | `$0.14` | `$0.28` | observed 2026-08-15; superseded 2026-08-16 16:00 UTC | https://api-docs.deepseek.com/quick_start/pricing/ |
| `deepseek-v4-pro` | `DeepSeek-V4-Pro-0813` | `$0.003625` | `$0.435` | `$0.87` | observed 2026-08-15; superseded 2026-08-16 16:00 UTC | https://api-docs.deepseek.com/quick_start/pricing/ |

### Published future schedule

Effective **2026-08-16 16:00 UTC**, DeepSeek switches to time-of-day pricing. Peak windows are **01:00–04:00 UTC** and **06:00–10:00 UTC**; all other times are off-peak. Boundary semantics beyond the printed hour ranges are not stated, so an implementation should preserve the ranges as provider text until tested against billing.

| API model identifier | Tier | Input, cache hit | Input, cache miss | Output | Effective from | Exact source |
|---|---|---:|---:|---:|---|---|
| `deepseek-v4-flash` | off-peak | `$0.007` | `$0.22` | `$0.66` | `2026-08-16T16:00:00Z` | https://api-docs.deepseek.com/quick_start/pricing/ |
| `deepseek-v4-flash` | peak | `$0.014` | `$0.44` | `$1.32` | `2026-08-16T16:00:00Z` | https://api-docs.deepseek.com/quick_start/pricing/ |
| `deepseek-v4-pro` | off-peak | `$0.022` | `$0.66` | `$1.98` | `2026-08-16T16:00:00Z` | https://api-docs.deepseek.com/quick_start/pricing/ |
| `deepseek-v4-pro` | peak | `$0.044` | `$1.32` | `$3.96` | `2026-08-16T16:00:00Z` | https://api-docs.deepseek.com/quick_start/pricing/ |

### Important modeling details

- Cache hits and cache misses are separate input billing categories, not optional prompt-cache storage products. DeepSeek says caching is automatic and billing reports `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens`.
- The current price page exposes only `deepseek-v4-flash` and `deepseek-v4-pro`. The change log says the older `deepseek-chat` and `deepseek-reasoner` names were to be discontinued on 2026-07-24; do not add them as current aliases.
- Both current APIs support thinking and non-thinking modes under the same model identifier and the price page does not publish a separate reasoning surcharge.
- The pricing page does not state when the rates that are live on 2026-08-15 first became effective. Store their `observed_at` timestamp rather than inventing an effective-from date.

### Machine-extraction feasibility: **high**

The raw HTML contains ordinary tables with model identifiers, model versions, numeric price cells, and the future effective timestamp. Recommended extraction keys are `(model_id, regime, input_cache_hit, input_cache_miss, output, effective_from, effective_until, peak_windows_utc)`. Preserve decimal precision—especially `$0.003625`—and treat the August 16 schedule as new rows, not an overwrite performed before its activation time.

## 2. Moonshot AI / Kimi

### Official sources

- Model list and lifecycle: https://platform.kimi.ai/docs/models.md
- Pricing overview: https://platform.kimi.ai/docs/pricing/chat.md
- Kimi K3: https://platform.kimi.ai/docs/pricing/chat-k3.md
- Kimi K2.7 Code: https://platform.kimi.ai/docs/pricing/chat-k27-code.md
- Kimi K2.6: https://platform.kimi.ai/docs/pricing/chat-k26.md
- Kimi K2.5: https://platform.kimi.ai/docs/pricing/chat-k25.md
- Moonshot V1: https://platform.kimi.ai/docs/pricing/chat-v1.md
- Batch pricing: https://platform.kimi.ai/docs/pricing/batch.md
- Context-cache behavior: https://platform.kimi.ai/docs/guide/use-context-caching-feature-of-kimi-api.md

### Current real-time rates

Prices are **`$` per 1,000,000 tokens**, exclusive of applicable taxes; the table does not spell out an ISO currency code. The pages do not state pricing effective-from dates; all rows were observed live on 2026-08-15 UTC.

| API model identifier | Cache-hit input | Cache-miss input | Output | Context window | Availability note | Exact source |
|---|---:|---:|---:|---:|---|---|
| `kimi-k3` | `$0.30` | `$3.00` | `$15.00` | `1,048,576` | current flagship; always reasons | https://platform.kimi.ai/docs/pricing/chat-k3.md |
| `kimi-k2.7-code` | `$0.19` | `$0.95` | `$4.00` | `262,144` | current coding model | https://platform.kimi.ai/docs/pricing/chat-k27-code.md |
| `kimi-k2.7-code-highspeed` | `$0.38` | `$1.90` | `$8.00` | `262,144` | same model, higher-speed service tier | https://platform.kimi.ai/docs/pricing/chat-k27-code.md |
| `kimi-k2.6` | `$0.16` | `$0.95` | `$4.00` | `262,144` | current general-purpose model | https://platform.kimi.ai/docs/pricing/chat-k26.md |
| `kimi-k2.5` | `$0.10` | `$0.60` | `$3.00` | `262,144` | unavailable to newly registered users; full-platform sunset announced for August 31, but the page omits the year | https://platform.kimi.ai/docs/pricing/chat-k25.md |

Kimi context caching is automatic for all model requests, requires no cache ID or TTL management, and can hit only when the previous request's prompt exceeds 256 tokens. The response-price pages—not a derived multiplier—are the authority for numeric cache rates.

### Batch rates

The official rule says Batch inference costs **60% of the standard model price**, and its page also prints the exact numeric rates below. Use the printed numbers: for example, K2.6's cache-hit Batch rate is printed as `$0.10`, not a locally calculated/rounded value.

| API model identifier / tier | Cache-hit input | Cache-miss input | Output | Context window | Exact source |
|---|---:|---:|---:|---:|---|
| `kimi-k2.7-code` / Batch | `$0.114` | `$0.57` | `$2.40` | `262,144` | https://platform.kimi.ai/docs/pricing/batch.md |
| `kimi-k2.6` / Batch | `$0.10` | `$0.57` | `$2.40` | `262,144` | https://platform.kimi.ai/docs/pricing/batch.md |
| `kimi-k2.5` / Batch | `$0.06` | `$0.36` | `$1.80` | `262,144` | https://platform.kimi.ai/docs/pricing/batch.md |

Batch does **not** list `kimi-k3` or `kimi-k2.7-code-highspeed`; do not infer Batch availability or a 60% price for them.

### Moonshot V1 sunset inventory

These models remain on the official price page, but the model catalogue says they are unavailable to newly registered users and expects a full-platform sunset on August 31 (year not printed). Their pricing pages do not publish separate cache-hit/cache-miss rates, so cache is **not published** rather than zero.

| API model identifier | Input | Cache | Output | Context window | Exact source |
|---|---:|---|---:|---:|---|
| `moonshot-v1-8k` | `$0.20` | not published | `$2.00` | `8,192` | https://platform.kimi.ai/docs/pricing/chat-v1.md |
| `moonshot-v1-32k` | `$1.00` | not published | `$3.00` | `32,768` | https://platform.kimi.ai/docs/pricing/chat-v1.md |
| `moonshot-v1-128k` | `$2.00` | not published | `$5.00` | `131,072` | https://platform.kimi.ai/docs/pricing/chat-v1.md |
| `moonshot-v1-8k-vision-preview` | `$0.20` | not published | `$2.00` | `8,192` | https://platform.kimi.ai/docs/pricing/chat-v1.md |
| `moonshot-v1-32k-vision-preview` | `$1.00` | not published | `$3.00` | `32,768` | https://platform.kimi.ai/docs/pricing/chat-v1.md |
| `moonshot-v1-128k-vision-preview` | `$2.00` | not published | `$5.00` | `131,072` | https://platform.kimi.ai/docs/pricing/chat-v1.md |

Do not ingest the discontinued `kimi-k2-*` preview/turbo/thinking identifiers or `kimi-latest`: the official model list says the K2 series was discontinued on 2026-05-25 and `kimi-latest` on 2026-01-28.

### Machine-extraction feasibility: **high**

The first-party `.md` endpoints expose pricing as literal JSX `DocTable` column definitions and `rows` arrays, which is more reliable than scraping the rendered shell. Extract the array values and validate the header order. Store `(model_id, service_tier, cache_hit_input, cache_miss_input, output, context_window, observed_at, lifecycle_state)`. Lifecycle text and pricing live on separate pages, so join them by exact API ID and retain the sunset warning. The HTML renderer omitted table cells in one fetch while the Markdown source contained them, making `.md` the recommended machine source.

## 3. Alibaba Cloud Model Studio / Qwen

### Official sources and scope choice

- Recommended/current model IDs: https://www.alibabacloud.com/help/en/model-studio/models
- Complete inference-pricing catalogue: https://www.alibabacloud.com/help/en/model-studio/model-pricing
- Qwen 3.7 Max: https://www.alibabacloud.com/help/en/model-studio/qwen3-7-max
- Qwen 3.7 Plus: https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus
- Qwen 3.7 Flash: https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash
- Cache semantics: https://www.alibabacloud.com/help/en/model-studio/context-cache

Alibaba Cloud prices vary by **serving region**, **deployment scope**, and sometimes **input-token tier**. The tables below use the dedicated model pages' original/list USD prices, excluding limited-time console promotions. For Max and Plus, the selected commercially portable scope is **US (Virginia), Global**; their dedicated pages print the same numbers for Frankfurt, Virginia, Tokyo, and Hong Kong. Flash is currently printed only for **China (Beijing)** on its dedicated page.

No pricing effective-from date is stated. The model pages were last updated 2026-07-24 (Max) and 2026-07-28 (Flash); Plus was observed live on 2026-08-15. These are source metadata, not invented effective dates.

### Qwen 3.7 Max — US (Virginia), Global scope

The alias `qwen3.7-max` is currently described as functionally equivalent to `qwen3.7-max-2026-05-20`. Both thinking and non-thinking use the same printed price. Context window is `1,000,000`; max input is `991,808`, max output `65,536`, and max thinking input `983,616`.

| API model identifier | Input tier | Standard input | Implicit-cache input | Explicit-cache creation | Explicit-cache read | Output | Exact source |
|---|---|---:|---:|---:|---:|---:|---|
| `qwen3.7-max` | `0 < input ≤ 1M` | `$1.65` | `$0.33` | `$2.063` | `$0.165` | `$4.951` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-max |
| `qwen3.7-max-2026-06-08` | `0 < input ≤ 1M` | `$1.65` | `$0.33` | `$2.063` | `$0.165` | `$4.951` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-max |
| `qwen3.7-max-2026-05-20` | `0 < input ≤ 1M` | `$1.65` | not printed on snapshot row | `$2.063` | `$0.165` | `$4.951` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-max |

The snapshot's missing implicit-cache cell is preserved as missing even though the global cache guide gives a general 20% rule. No Batch rows are printed for Virginia; Beijing alone prints Batch File rates for the alias. Do not transplant those rates across regions.

### Qwen 3.7 Plus — US (Virginia), Global scope

The alias `qwen3.7-plus` and snapshot `qwen3.7-plus-2026-05-26` have a `1,000,000` context window, max input `991,808`, and max output `65,536`. The dedicated page prints the same two-tier prices for both IDs.

| API model identifier | Input tier | Standard input | Implicit-cache input | Explicit-cache creation | Explicit-cache read | Output | Exact source |
|---|---|---:|---:|---:|---:|---:|---|
| `qwen3.7-plus` | `0 < input ≤ 256K` | `$0.276` | `$0.056` | `$0.344` | `$0.028` | `$1.101` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus |
| `qwen3.7-plus` | `256K < input ≤ 1M` | `$0.826` | `$0.166` | `$1.032` | `$0.083` | `$3.301` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus |
| `qwen3.7-plus-2026-05-26` | `0 < input ≤ 256K` | `$0.276` | `$0.056` | `$0.344` | `$0.028` | `$1.101` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus |
| `qwen3.7-plus-2026-05-26` | `256K < input ≤ 1M` | `$0.826` | `$0.166` | `$1.032` | `$0.083` | `$3.301` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus |

Tiering is based on the total input tokens in one request, and **all** request tokens are charged at that tier's rates.

### Qwen 3.7 Flash — China (Beijing)

`qwen3.7-flash` and snapshot `qwen3.7-flash-2026-07-15` share the printed table and `1,000,000` context window. The table below records the moving alias; the snapshot has identical rows on the same page.

| API model identifier | Input tier | Standard input | Implicit cache | Explicit create | Explicit read | Output | Batch-file input | Batch-file output | Exact source |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| `qwen3.7-flash` | `0 < input ≤ 32K` | `$0.028` | `$0.006` | `$0.034` | `$0.003` | `$0.11` | `$0.014` | `$0.055` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash |
| `qwen3.7-flash` | `32K < input ≤ 256K` | `$0.083` | `$0.017` | `$0.103` | `$0.008` | `$0.33` | `$0.041` | `$0.165` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash |
| `qwen3.7-flash` | `256K < input ≤ 1M` | `$0.165` | `$0.033` | `$0.206` | `$0.017` | `$0.66` | `$0.083` | `$0.33` | https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash |

The same page also prints Batch Chat at the standard real-time rate. Keep `batch_file` and `batch_chat` as different price modes.

### Cache and batch rules

- Explicit cache creation: 125% of standard input; explicit reads: 10%; minimum 1,024 tokens; five-minute validity, reset on hit.
- Implicit cache: automatic and cannot be disabled; creation at 100% standard input, hits at 20%; generally minimum 256 tokens, but approximately 1,000 for the Qwen 3.7 Max series.
- Explicit and implicit modes are mutually exclusive.
- OpenAI-compatible Batch File calls are not eligible for cache discounts.
- Where dedicated pages print rounded numeric cache values, ingest those literals. Do not recompute and replace them with a multiplier result.
- The main pricing catalogue says Batch inference is 50% of real-time pricing when supported and cannot combine with the cache discount. Only expose Batch where the selected region/model table actually publishes it.

### Machine-extraction feasibility: **medium-high with a region-aware parser**

Dedicated model pages are static, semantic tables and are easier to parse than the 3,000-plus-line aggregate catalogue. The extractor must propagate the nearest model ID, snapshot heading, region, deployment scope, and input-tier heading into every billing row. It must distinguish `Input`, `Input(Implicit Cache)`, `Explicit Cache Creation`, `Explicit Cache Read`, `Input(Batch File)`, `Output(Batch File)`, `Input(Batch Chat)`, and `Output(Batch Chat)`.

Recommended key: `(api_model_id, alias_target, service_region, deployment_scope, input_tokens_min_exclusive, input_tokens_max_inclusive, price_mode, billing_item)`. The aggregate pricing page contains promotions and region-dependent list prices and should be a cross-check, not a source collapsed into a provider-wide default. The dedicated pages explicitly exclude promotions and are safer for stable list-price ingestion.

## 4. Mistral

### Official sources

- API/model pricing: https://mistral.ai/pricing/api/
- Prompt-cache billing rule: https://docs.mistral.ai/studio-api/conversations/advanced/prompt-caching
- Batch discount: https://docs.mistral.ai/studio-api/batch-processing
- Regional inference multiplier: https://docs.mistral.ai/studio-api/regional-inference

### Current token-generation rates

Standard input/output prices are `$` per 1,000,000 tokens. For models covered by prompt caching, the official rule is **cached prompt tokens are billed at 10% of the standard input-token price**. This table keeps that published multiplier instead of manufacturing numeric cache cells that the individual cards do not print.

Pricing effective dates are not printed. Each row was observed live on 2026-08-15 UTC.

| API model identifier | Displayed model | Standard input | Cached input | Output | Notes | Exact source |
|---|---|---:|---|---:|---|---|
| `mistral-medium-latest` | Mistral Medium 3.5 | `$1.50` | `10% × standard input` | `$7.50` | current frontier/agentic card | https://mistral.ai/pricing/api/ |
| `mistral-small-latest` | Mistral Small 4 | `$0.15` | `10% × standard input` | `$0.60` | multimodal, lightweight | https://mistral.ai/pricing/api/ |
| `mistral-large-latest` | Mistral Large 3 | `$0.50` | `10% × standard input` | `$1.50` | flagship open-weight card | https://mistral.ai/pricing/api/ |
| `codestral-latest` | Codestral | `$0.30` | `10% × standard input` | `$0.90` | code/FIM model | https://mistral.ai/pricing/api/ |
| `ministral-3b-latest` | Ministral 3 (3B) | `$0.10` | `10% × standard input` | `$0.10` | lightweight | https://mistral.ai/pricing/api/ |
| `ministral-8b-latest` | Ministral 3 (8B) | `$0.15` | `10% × standard input` | `$0.15` | lightweight | https://mistral.ai/pricing/api/ |
| `ministral-14b-latest` | Ministral 3 (14B) | `$0.20` | `10% × standard input` | `$0.20` | lightweight | https://mistral.ai/pricing/api/ |
| `labs-leanstral-2603` | Leanstral | `Free` | not separately published | `Free` | limited-period Labs endpoint; no permanence promised | https://mistral.ai/pricing/api/ |
| `zai-glm-5-2` | GLM 5.2 | `$1.40` | `$0.14` | `$4.40` | third-party model hosted by Mistral; its card prints a numeric cached rate | https://mistral.ai/pricing/api/ |

Scope note: OCR, audio, embeddings, moderation, classifier training/storage, and tool-call pricing are present on the same page but use other billing units and are outside TokenGauge's input/output token comparison. `zai-glm-5-2` is retained because it is a directly purchasable token API with an unambiguous Mistral price, but should be labeled `model_owner: Z.ai`, `api_provider: Mistral`.

### Special tiers and modifiers

| Modifier | Official rule | Applicability caution | Exact source |
|---|---|---|---|
| Prompt caching | cached prompt tokens cost `10%` of standard input tokens | cache hit is not guaranteed; cached tokens are reported in `usage.prompt_tokens_details.cached_tokens` | https://docs.mistral.ai/studio-api/conversations/advanced/prompt-caching |
| Batch API | `50%` discount / half price | docs say batch workloads receive the discount; do not assume it stacks with other modifiers without a provider statement | https://docs.mistral.ai/studio-api/batch-processing |
| Regional inference | `1.1×` standard list pricing | applies to input, output, cached reads, and cache writes; model availability varies by region | https://docs.mistral.ai/studio-api/regional-inference |
| Enterprise APIs | `75%` above list pricing on select APIs | “select APIs” is not enumerated in the public pricing card; require an account/contract flag | https://mistral.ai/pricing/api/ |

### Machine-extraction feasibility: **medium-high**

The pricing page server-renders each product as a card with repeated labels (`Input (/M tokens)`, `Output (/M tokens)`) and a copyable API alias. It is parseable from raw HTML without executing JavaScript, but the DOM is card-oriented rather than a single semantic table. A robust extractor must keep each price label/value inside its enclosing card, distinguish non-token units, and retain model-owner metadata for hosted third-party models. The prompt-cache, batch, regional, and enterprise rules live on separate pages and should be stored as explicit multipliers, not silently pre-applied to list prices.

## 5. Cohere

### Official sources

- Pricing overview and plan semantics: https://cohere.com/pricing
- Billing explanation: https://docs.cohere.com/docs/how-does-cohere-pricing-work
- Live model catalogue: https://docs.cohere.com/v1/docs/models
- Rate limits: https://docs.cohere.com/docs/rate-limits
- Per-model pages are linked in the tables below.

### Public production token prices

Prices are `$` per 1,000,000 billed tokens. Cohere publishes no cache-hit price for these models. Pricing effective dates are not stated; each rate was observed live on 2026-08-15 UTC.

| API model identifier | Input | Cached input | Output | Availability/tier | Exact price source |
|---|---:|---|---:|---|---|
| `command-a-03-2025` | `$2.50` | not published | `$10.00` | production pay-as-you-go | https://docs.cohere.com/docs/command-a |
| `command-r7b-12-2024` | `$0.0375` | not published | `$0.15` | production pay-as-you-go | https://docs.cohere.com/v2/docs/command-r7b |
| `command-r-08-2024` | `$0.15` | not published | `$0.60` | production pay-as-you-go | https://docs.cohere.com/docs/command-r |
| `command-r-plus-08-2024` | `$2.50` | not published | `$10.00` | production pay-as-you-go | https://docs.cohere.com/docs/command-r-plus |

For all models, trial-key use is free but limited. Cohere says billable Chat usage should use the response's `billed_units.input_tokens` and `billed_units.output_tokens`, which can differ from the generic token counts because provider-added tokens are not billed.

### Newer models with no public commercial unit price

The wording “free until rate limits are reached” is a limited-access policy, not evidence of a permanent zero price. Commercial/private deployment is routed to Model Vault or sales, with no per-token number published on these pages.

| API model identifier | Input/cache/output numeric rate | Published access rule | Commercial path | Exact source |
|---|---|---|---|---|
| `command-a-plus-05-2026` | not published | trial and production keys free until rate limits | Model Vault | https://docs.cohere.com/docs/command-a-plus |
| `command-a-reasoning-08-2025` | not published | trial and production keys free until rate limits | Model Vault | https://docs.cohere.com/docs/command-a-reasoning/ |
| `command-a-vision-07-2025` | not published | trial and production keys free until rate limits | contact sales | https://docs.cohere.com/v1/docs/command-a-vision |
| `command-a-translate-08-2025` | not published | trial and production keys free until rate limits | contact sales | https://docs.cohere.com/docs/command-a-translate |
| `north-mini-code-1-0` | not published | trial and production keys free until rate limits | Model Vault | https://docs.cohere.com/docs/north-mini-code-1.0 |

Rate-limit details current on 2026-08-15: trial keys, and production keys for newer Chat variants, are limited to 1,000 API calls/month; the model table also gives 20 requests/minute for the newer Command A variants. These limits are operational metadata, not a conversion into a token price.

### Documentation inconsistency requiring quarantine

The current **Command A** model page prints the correct Command A description, 256K context, and `$2.50`/`$10.00` rates, but its “Model ID” field incorrectly says `command-a-plus-05-2026`. Cohere's live model catalogue separately identifies Command A as `command-a-03-2025`, while the dedicated Command A+ page identifies `command-a-plus-05-2026` and says it is free until rate limits.

Therefore:

- The `$2.50`/`$10.00` row should be associated with `command-a-03-2025` only after cross-checking the official model catalogue.
- A single-page scraper would misprice Command A+ and should be blocked by a validation rule that detects duplicate model IDs with incompatible price modes.
- Store a provenance URL for both the identifier and the price, and flag this row for periodic manual review.

### Machine-extraction feasibility: **medium**

Individual model pages are unusually machine-friendly: the server-rendered/serialized MDX includes a structured model object with numeric `pricing` fields and the API ID. Catalogue discovery, however, is split across pages, newer models use prose rather than numeric price objects, and the live Command A page currently has the identifier defect above. Use typed price states such as `numeric`, `limited_free`, and `contact_sales`; never coerce missing fields or limited-free prose to zero.

## 6. Provider checked but not selected: Together AI

### Official sources checked

- Marketing pricing table: https://www.together.ai/pricing
- Serverless model catalogue: https://docs.together.ai/docs/serverless/models

Both pages were live and fetched on 2026-08-15, but they disagree without a version or effective timestamp:

| API model / display model | Marketing pricing page | Serverless docs page |
|---|---|---|
| `deepseek-ai/DeepSeek-V4-Pro` | `$1.74` input, `$0.20` cached, `$3.48` output | `$2.10` input, `$0.20` cached, `$4.40` output |
| `meta-llama/Llama-3.3-70B-Instruct-Turbo` | display row says `$1.04` input / `$1.04` output | `$0.88` input / `$0.88` output |
| `Qwen/Qwen3.5-9B` | display row says `$0.17` input / `$0.25` output | `$0.10` input / `$0.15` output |

No aggregator was used, and no attempt was made to choose a winner. Together should remain **quarantined from automatic price ingestion** until its official surfaces converge or Together publishes explicit applicability/effective-date metadata.

## 7. Suggested normalized representation

The minimum lossless record should include:

```text
provider
model_id
model_version_or_alias_target
model_owner
api_provider
service_region
deployment_scope
currency_symbol
currency_iso_code_if_explicit
unit_tokens
input_tokens_min_exclusive
input_tokens_max_inclusive
input_standard
input_cache_hit
input_cache_miss
input_cache_implicit
input_cache_explicit_create
input_cache_explicit_read
output
price_mode = numeric | multiplier | limited_free | contact_sales
regime = standard | peak | off_peak | batch_file | batch_chat | regional | enterprise | highspeed
effective_from
effective_until
observed_at
source_url
source_field_notes
manual_review_required
```

Implementation guardrails from this pass:

1. Keep `observed_at` distinct from `effective_from`; most providers do not publish the latter.
2. Preserve an exact decimal type rather than binary floating point.
3. Model cache prices as their own input category or an explicit provider-published multiplier.
4. Make service region and per-request input-token tier part of the price key; a single Qwen model ID can have several valid prices.
5. Keep implicit cache, explicit-cache creation, explicit-cache read, and uncached input as separate billing items.
6. Do not represent “free until rate limits” as an ordinary zero-priced production model.
7. Permit multiple future/current rows for a model; DeepSeek's August 16 transition cannot be represented safely by one mutable price object.
8. Quarantine a provider or row when two first-party sources disagree and neither declares precedence.
