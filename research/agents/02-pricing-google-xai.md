# Pricing research pass 02 — Google Gemini and xAI Grok

Research snapshot: **2026-08-15 UTC**. All numeric rates below come only from first-party Google or xAI documentation. Unless a row says otherwise, token rates are **USD per 1,000,000 tokens**. “Observed” is not treated as an effective-from date when the provider does not publish one.

The main Google tables deliberately cover the **Gemini Developer API** (`ai.google.dev`), not Google Cloud's separately priced Gemini Enterprise Agent Platform. The xAI tables cover direct xAI API pricing (`docs.x.ai`).

## Executive findings

- **Both providers are ingestible, but neither fits TokenGauge's current flat three-number model without losing billing rules.** Google prices by service tier, input modality, explicit-cache storage, and sometimes prompt length. xAI prices by prompt-length band and adds model-specific batch discounts plus a global priority multiplier.
- **The long-context boundary differs by provider.** Google Pro rates use the short band for prompts `<= 200,000` and the long band for prompts `> 200,000`. xAI's long band starts when prompt tokens are `>= 200,000`. Both providers apply the selected band to the whole request, including output; xAI explicitly says cached prompt tokens count toward the threshold.
- **Google has scheduled price records.** Gemini 3.7 Flash and 3.6 Flash have introductory rates through 2026-12-31 and higher rates from 2027-01-01. These must be separate effective-dated records.
- **Cached input is not the whole Google cache cost.** Explicit caching also incurs token-hour storage. Implicit caching has no explicit storage object and is enabled by default on Gemini 2.5+ models, but the official minimum-token table names only a subset of priced models.
- **Do not merge Google commercial channels.** The Gemini Developer API and Google Cloud Agent Platform currently disagree on some cache/tier cells and Google Cloud adds a region dimension.
- **xAI exposes a machine-friendly Markdown endpoint.** Its pricing table, tool fees, batch rule, and priority rule are all on one first-party page. Google exposes structured static HTML tables but not a published pricing JSON/CSV feed.

## 1. Google Gemini Developer API

### Official sources

- Paid/free model and tool pricing: https://ai.google.dev/gemini-api/docs/pricing
- Billing behavior and non-billed requests: https://ai.google.dev/gemini-api/docs/billing
- GenerateContent implicit and explicit caching semantics: https://ai.google.dev/gemini-api/docs/generate-content/caching
- Interactions API implicit-caching view: https://ai.google.dev/gemini-api/docs/caching
- Separate Google Cloud pricing channel, checked only to prevent accidental merging: https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing

The Developer API pricing and GenerateContent caching pages both say **Last updated 2026-08-13 UTC**. They were fetched again on 2026-08-15. Google does not state when most already-live rates first became effective, so their records should use `observed_at: 2026-08-15` and leave `effective_from` unknown.

### Notation used in the tables

- `I / C / O` = non-cached input / cached input / output, each in USD per 1M tokens.
- Google says output prices include thinking tokens where the table uses “Output price (including thinking tokens).”
- Cache storage is USD per 1M cached tokens per hour and is an additional explicit-cache charge.
- `t/i/v/a` = text / image / video / audio.
- These are **paid-tier** list rates. A conditional free tier exists for many models; it should not be represented as an unconditional `$0` production price because model access and quotas are separate constraints.

### Paid Standard rates current on 2026-08-15

| API model identifier | Modality / prompt band | Standard `I / C / O` | Explicit-cache storage | Effective/availability note | Exact source |
|---|---|---:|---:|---|---|
| `gemini-3.7-flash` | all listed input modalities; no length premium shown | `$0.75 / $0.075 / $3.75` | `$0.50` | introductory through 2026-12-31 | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.7-flash |
| `gemini-3.6-flash` | all listed input modalities; no length premium shown | `$0.75 / $0.075 / $3.75` | `$0.50` | introductory through 2026-12-31 | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.6-flash |
| `gemini-3.5-flash` | all listed input modalities | `$1.50 / $0.15 / $9.00` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash |
| `gemini-3.5-flash-lite` | t/i/v/a | `$0.30 / $0.03 / $2.50` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite |
| `gemini-3.1-flash-lite` | t/i/v | `$0.25 / $0.025 / $1.50` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite |
| `gemini-3.1-flash-lite` | audio input | `$0.50 / $0.05 / $1.50` | `$1.00` | output is not modality-split | same source |
| `gemini-3.1-pro-preview` and `gemini-3.1-pro-preview-customtools` | prompt `<= 200k` | `$2.00 / $0.20 / $12.00` | `$4.50` | no free tier | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-pro-preview |
| same | prompt `> 200k` | `$4.00 / $0.40 / $18.00` | `$4.50` | whole request uses long band | same source |
| `gemini-3-flash-preview` | t/i/v | `$0.50 / $0.05 / $3.00` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-3-flash-preview |
| `gemini-3-flash-preview` | audio input | `$1.00 / $0.10 / $3.00` | `$1.00` | output is not modality-split | same source |
| `gemini-2.5-pro` | prompt `<= 200k` | `$1.25 / $0.125 / $10.00` | `$4.50` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro |
| same | prompt `> 200k` | `$2.50 / $0.25 / $15.00` | `$4.50` | whole request uses long band | same source |
| `gemini-2.5-flash` | t/i/v | `$0.30 / $0.03 / $2.50` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash |
| `gemini-2.5-flash` | audio input | `$1.00 / $0.10 / $2.50` | `$1.00` | output is not modality-split | same source |
| `gemini-2.5-flash-lite` | t/i/v | `$0.10 / $0.01 / $0.40` | `$1.00` | live/observed | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite |
| `gemini-2.5-flash-lite` | audio input | `$0.30 / $0.03 / $0.40` | `$1.00` | output is not modality-split | same source |
| `gemini-2.5-flash-lite-preview-09-2025` | t/i/v | `$0.10 / $0.01 / $0.40` | `$1.00` | preview table; same Standard rate as GA | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite-preview |
| same | audio input | `$0.30 / $0.03 / $0.40` | `$1.00` | preview table | same source |

### Paid Batch and Flex rates current on 2026-08-15

Google publishes Batch and Flex as explicit price tables, not merely a universal multiplier. Cache reads are not always half of Standard, so ingest the numbers rather than applying `0.5` mechanically.

| API model identifier | Modality / prompt band | Batch `I / C / O` | Flex `I / C / O` | Storage, Batch / Flex | Exact source |
|---|---|---:|---:|---:|---|
| `gemini-3.7-flash` | all | `$0.375 / $0.0375 / $1.875` | same as Batch | `$0.50 / $0.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.7-flash |
| `gemini-3.6-flash` | all | `$0.375 / $0.0375 / $1.875` | same as Batch | `$0.50 / $0.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.6-flash |
| `gemini-3.5-flash` | all | `$0.75 / $0.075 / $4.50` | `$0.75 / $0.08 / $4.50` | `$1.00 / $1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash |
| `gemini-3.5-flash-lite` | t/i/v/a | `$0.15 / $0.02 / $1.25` | same as Batch | `$1.00 / $1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite |
| `gemini-3.1-flash-lite` | t/i/v | `$0.125 / $0.0125 / $0.75` | same as Batch | `$0.50 / $0.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite |
| same | audio input | `$0.25 / $0.025 / $0.75` | same as Batch | `$0.50 / $0.50` | same source |
| `gemini-3.1-pro-preview` | prompt `<= 200k` | `$1.00 / $0.20 / $6.00` | same as Batch | `$4.50 / $4.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-pro-preview |
| same | prompt `> 200k` | `$2.00 / $0.40 / $9.00` | same as Batch | `$4.50 / $4.50` | same source |
| `gemini-3-flash-preview` | t/i/v | `$0.25 / $0.05 / $1.50` | same as Batch | `$1.00 / $1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3-flash-preview |
| same | audio input | `$0.50 / $0.10 / $1.50` | same as Batch | `$1.00 / $1.00` | same source |
| `gemini-2.5-pro` | prompt `<= 200k` | `$0.625 / $0.125 / $5.00` | same as Batch | `$4.50 / $4.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro |
| same | prompt `> 200k` | `$1.25 / $0.25 / $7.50` | same as Batch | `$4.50 / $4.50` | same source |
| `gemini-2.5-flash` | t/i/v | `$0.15 / $0.03 / $1.25` | same as Batch | `$1.00 / $1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash |
| same | audio input | `$0.50 / $0.10 / $1.25` | same as Batch | `$1.00 / $1.00` | same source |
| `gemini-2.5-flash-lite` | t/i/v | `$0.05 / $0.01 / $0.20` | same as Batch | `$1.00 / $1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite |
| same | audio input | `$0.15 / $0.03 / $0.20` | same as Batch | `$1.00 / $1.00` | same source |
| `gemini-2.5-flash-lite-preview-09-2025` | t/i/v | `$0.05 / $0.01 / $0.20` | not published | `$1.00 / —` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite-preview |
| same | audio input | `$0.15 / $0.03 / $0.20` | not published | `$1.00 / —` | same source |

### Paid Priority rates current on 2026-08-15

| API model identifier | Modality / prompt band | Priority `I / C / O` | Explicit-cache storage | Exact source |
|---|---|---:|---:|---|
| `gemini-3.7-flash` | all | `$1.35 / $0.135 / $6.75` | `$0.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.7-flash |
| `gemini-3.6-flash` | all | `$1.35 / $0.135 / $6.75` | `$0.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.6-flash |
| `gemini-3.5-flash` | all | `$2.70 / $0.27 / $16.20` | `$1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash |
| `gemini-3.5-flash-lite` | t/i/v/a | `$0.54 / $0.05 / $4.50` | `$1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite |
| `gemini-3.1-flash-lite` | t/i/v | `$0.45 / $0.045 / $2.70` | `$1.80` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite |
| same | audio input | `$0.90 / $0.09 / $2.70` | `$1.80` | same source |
| `gemini-3.1-pro-preview` | prompt `<= 200k` | `$3.60 / $0.36 / $21.60` | `$8.10` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-pro-preview |
| same | prompt `> 200k` | `$7.20 / $0.72 / $32.40` | `$8.10` | same source |
| `gemini-3-flash-preview` | t/i/v | `$0.90 / $0.09 / $5.40` | `$1.80` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3-flash-preview |
| same | audio input | `$1.80 / $0.18 / $5.40` | `$1.80` | same source |
| `gemini-2.5-pro` | prompt `<= 200k` | `$2.25 / $0.225 / $18.00` | `$8.10` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro |
| same | prompt `> 200k` | `$4.50 / $0.45 / $27.00` | `$8.10` | same source |
| `gemini-2.5-flash` | t/i/v | `$0.54 / $0.054 / $4.50` | `$1.80` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash |
| same | audio input | `$1.80 / $0.18 / $4.50` | `$1.80` | same source |
| `gemini-2.5-flash-lite` | t/i/v | `$0.18 / $0.018 / $0.72` | `$1.80` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-lite |
| same | audio input | `$0.54 / $0.054 / $0.72` | `$1.80` | same source |

### Published future rates for Gemini 3.7 Flash and 3.6 Flash

The following applies from **2027-01-01**. Google explicitly prints this future schedule on the live page.

| Tier | `I / C / O` | Explicit-cache storage | Effective interval | Exact source |
|---|---:|---:|---|---|
| Standard | `$1.50 / $0.15 / $7.50` | `$1.00` | from 2027-01-01 | model sections on https://ai.google.dev/gemini-api/docs/pricing |
| Batch | `$0.75 / $0.075 / $3.75` | `$1.00` | from 2027-01-01 | same source |
| Flex | `$0.75 / $0.075 / $3.75` | `$1.00` | from 2027-01-01 | same source |
| Priority | `$2.70 / $0.27 / $13.50` | `$1.00` | from 2027-01-01 | same source |

### Specialized Gemini endpoints

These use modalities or units that the current TokenGauge UI cannot represent losslessly. They are still current official model prices and should be retained for a future generalized rate card.

| API model identifier | Standard paid pricing | Other published tier | Exact source |
|---|---|---|---|
| `gemini-3.5-live-translate-preview` | audio input `$3.50`; audio output `$21.00`; page also gives `$0.0053/min` input and `$0.0315/min` output | none shown | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-live-translate-preview |
| `gemini-omni-flash-preview` | input `$1.50` t/i/v/a; output `$9.00` text, `$17.50` video; video is approximately `$0.10/sec` under stated token conversion | none shown | https://ai.google.dev/gemini-api/docs/pricing#gemini-omni-flash-preview |
| `gemini-3.1-flash-live-preview` | input `$0.75` text, `$3.00` audio, `$1.00` image/video; output `$4.50` text, `$12.00` audio | page also gives per-minute audio/image/video equivalents | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-live-preview |
| `gemini-3.1-flash-image` | input `$0.50` text/image; output `$3.00` text/thinking and `$60.00` image tokens; output images `$0.045` 0.5K, `$0.067` 1K, `$0.101` 2K, `$0.151` 4K | Batch: input `$0.25`, text/thinking `$1.50`, image tokens `$30.00`; per-image rates `$0.022`, `$0.034`, `$0.050`, `$0.076` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-image |
| `gemini-3.1-flash-lite-image` | input `$0.25` text/image/video; output `$1.50` text/thinking and `$30.00` image tokens; `$0.0336` per 1K image | Batch: input `$0.125`, text/thinking `$0.75`, image tokens `$15.00`; `$0.0168` per 1K image | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite-image |
| `gemini-3-pro-image` | input `$2.00` text/image; output `$12.00` text/thinking and `$120.00` image tokens; `$0.134` per 1K/2K image, `$0.24` per 4K image | Batch/Flex: text input `$1.00`, image input `$0.0006/image`, text/thinking output `$6.00`, image output `$0.067` at 1K/2K and `$0.12` at 4K; Priority input `$3.60`, output `$21.60` text/thinking and `$216.00` image tokens | https://ai.google.dev/gemini-api/docs/pricing#gemini-3-pro-image |
| `gemini-2.5-flash-image` | input `$0.30` text/image; output `$0.039/image` | Batch/Flex `$0.15` input and `$0.0195/image`; Priority `$0.54` input and `$0.0702/image` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-image |
| `gemini-3.1-flash-tts-preview` | text input `$1.00`; audio output `$20.00` | Batch `$0.50` / `$10.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-tts-preview |
| `gemini-2.5-flash-preview-tts` | text input `$0.50`; audio output `$10.00` | Batch `$0.25` / `$5.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-preview-tts |
| `gemini-2.5-pro-preview-tts` | text input `$1.00`; audio output `$20.00` | Batch `$0.50` / `$10.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-pro-preview-tts |
| `gemini-2.5-flash-native-audio-preview-12-2025` | input `$0.50` text, `$3.00` audio/video; output `$2.00` text, `$12.00` audio | none shown | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-native-audio |
| `gemini-embedding-2` | input: `$0.20` text, `$0.45` image, `$6.50` audio, `$12.00` video | Batch: `$0.10`, `$0.225`, `$3.25`, `$6.00` respectively | https://ai.google.dev/gemini-api/docs/pricing#gemini-embedding-2 |
| `gemini-embedding-001` | text input `$0.15` | Batch `$0.075` | https://ai.google.dev/gemini-api/docs/pricing#gemini-embedding |
| `gemini-robotics-er-2-preview` | input `$2.00` t/i/v/a; cache `$0.20`; output `$10.00`; storage `$1.00` | Batch `$1.00 / $0.10 / $5.00`, storage `$1.00` | https://ai.google.dev/gemini-api/docs/pricing#gemini-robotics-er-2 |
| `gemini-robotics-er-2-streaming-preview` | input `$2.00` t/i/v/a; output `$10.00` | none shown | https://ai.google.dev/gemini-api/docs/pricing#gemini-robotics-er-2-streaming |
| `gemini-robotics-er-1.6-preview` | input `$1.00` t/i/v, `$2.00` audio; output `$5.00` | Batch input `$0.50` t/i/v, `$1.00` audio; output `$2.50` | https://ai.google.dev/gemini-api/docs/pricing#gemini-robotics-er |
| `gemini-2.5-computer-use-preview-10-2025` | prompt `<=200k`: input `$1.25`, output `$10.00`; prompt `>200k`: input `$2.50`, output `$15.00` | none shown | https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-computer-use-preview-10-2025 |

Gemini 2.0 Flash and 2.0 Flash-Lite still appear on the pricing page but the same page says both were shut down on 2026-06-01. They must not be offered as current selectable API models.

### Context caching semantics and minimums

The GenerateContent caching guide distinguishes two mechanisms:

- **Implicit caching** is automatic on Gemini 2.5 and newer models. A hit receives the lower cached-token rate, but Google says there is no cost-saving guarantee.
- **Explicit caching** creates a cache object with a TTL. The TTL defaults to one hour. Billing includes reduced-rate cached tokens when reused **plus** token-hour storage for the TTL. Google says there are no minimum or maximum TTL bounds.
- The cache guide says token limits include cached tokens and the model sees cached content as a prompt prefix.
- The Interactions API supports implicit caching only; explicit cache objects require GenerateContent.

The official implicit-cache minimum table currently contains only:

| Model | Minimum input tokens for implicit cache |
|---|---:|
| Gemini 3.7 Flash | `4,096` |
| Gemini 3.6 Flash | `4,096` |
| Gemini 3.5 Flash | `4,096` |
| Gemini 3.1 Pro Preview | `4,096` |
| Gemini 2.5 Flash | `2,048` |
| Gemini 2.5 Pro | `2,048` |

Exact source: https://ai.google.dev/gemini-api/docs/generate-content/caching

**Uncertainty:** priced cache rows also exist for Flash-Lite models not named in this implicit-minimum table. Do not infer their implicit-cache minimum or even the exact caching mechanism from the price row alone. Store those capabilities as `unknown` until the relevant model documentation supplies them.

### Tools and per-request charges

| Tool/feature | Paid-tier rule | Unit/boundary | Exact source |
|---|---|---|---|
| Google Search, Gemini 3 | 5,000 free search requests/month shared across Gemini 3.x, then `$14` | per 1,000 **individual search requests/queries**; one prompt can cause multiple | https://ai.google.dev/gemini-api/docs/pricing#pricing-for-tools |
| Google Search, Gemini 2.5 | 1,500 RPD free shared for Flash/Flash-Lite, then `$35` | per 1,000 grounded prompts | same source |
| Google Maps, Gemini 3 | 5,000 free/month shared across Gemini 3, then `$14` | per 1,000 search queries | model tables on same source |
| Google Maps, Gemini 2.5 | Flash/Flash-Lite 1,500 RPD free; Pro 10,000 RPD free; then `$25` | per 1,000 grounded prompts | same source |
| Code execution | no runtime fee; generated code/results are output tokens when created and input tokens when reused in reasoning | selected model's token prices | same source |
| URL context | retrieved material charged as input tokens | selected model's input rate | same source |
| Computer use | charged as normal model tokens | selected model's token prices | same source |
| File search | embeddings `$0.15`; retrieved document tokens charged as normal model tokens | embeddings per 1M tokens | same source |
| Custom Tools endpoint | same as Gemini 3.1 Pro Preview | token pricing | same source |

The page also says `DOCUMENT` modality tokens such as PDFs are billed at the image-token rate. Agent inference, including intermediate reasoning/input generated in loops, is billed at the underlying standard model rate; tool fees remain additive.

The billing FAQ says requests failing with a 400 or 500 error are not charged for tokens, although they still count against quota, and `GetTokens` requests are not billed or counted against inference quota. Exact source: https://ai.google.dev/gemini-api/docs/billing

**Free-allowance wording uncertainty:** model-specific Gemini 3 rows say the 5,000 monthly Google Search requests are shared across “all Gemini 3.x models,” while the consolidated tools table says “shared across all Gemini models.” The paid overage rate is consistently `$14/1,000`, but the public page is not internally consistent about the allowance pool. Preserve the provider text and do not implement cross-family allowance accounting from this page alone.

### Separate Google Cloud channel: quarantine from this rate card

The legacy Vertex pricing URL redirects to **Gemini Enterprise Agent Platform**. That page is first-party and current, but it is a different product channel:

- It adds `global` versus `non-global` pricing. For generally available Gemini 3+ models, non-global pricing took effect 2026-07-01 and is often 10% above global.
- It says requests not returning HTTP 200 are not charged, a billing rule not printed as the same scope on the Developer API page.
- Some apparently equivalent cells disagree. Examples observed on 2026-08-15: Gemini 3.5 Flash-Lite Batch/Flex cached input is `$0.015` on the Cloud page but `$0.02` on the Developer API page; its Priority cached input is `$0.054` on Cloud but `$0.05` on the Developer API page. Gemini 3.5 Flash Flex cached input is `$0.075` on Cloud but `$0.08` on the Developer API page.

Therefore `product_channel` and `region` must be required dimensions. Do not use the Cloud page to “correct” Developer API rows, or vice versa. Exact Cloud source: https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing

### Google machine-extraction feasibility: **medium-high**

The Developer API page is server-rendered static HTML with stable model `h2` anchors and ordinary tables for Standard, Batch, Flex, and Priority. A scraper can extract it without browser execution. Difficulties that require validation:

- rates contain multiple values in one cell, with modality, prompt-length, and future-date prose;
- cache read and token-hour storage coexist in one cell;
- the same visual field can mean per-token, per-image, per-minute, or per-query;
- absent tiers and “Not available” must remain null, not zero;
- published future prices must create new records instead of overwriting the live record;
- Developer API and Google Cloud have similar model names but distinct price scopes.

Recommended ingestion is a table parser followed by schema validation and a small manually reviewed allowlist of model sections. There is no published first-party pricing JSON/CSV endpoint on the pages checked.

## 2. xAI Grok direct API

### Official sources

- Human-readable pricing page: https://docs.x.ai/developers/pricing
- First-party Markdown representation of the same page: https://docs.x.ai/developers/pricing.md
- Prompt-cache billing details: https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing
- Prompt-cache overview: https://docs.x.ai/developers/advanced-api-usage/prompt-caching
- Batch API behavior: https://docs.x.ai/developers/advanced-api-usage/batch-api
- Priority behavior: https://docs.x.ai/developers/advanced-api-usage/priority-processing

The pricing page says **Last updated 2026-07-03**. The cache usage/pricing page says **Last updated 2026-05-10**. All were fetched on 2026-08-15. No first-party source checked states the first effective date of the current numeric rates; record them as observed, not retroactively effective from the page-update date.

### Standard Text API prices

All xAI models in the pricing table use a long-context band beginning at **`>= 200,000` prompt tokens**. Once reached, the higher rates apply to **all tokens in the request**. Total prompt tokens include cached tokens for threshold selection.

| API model identifier | Max context | Prompt band | Input | Cached input | Output | Exact source |
|---|---:|---|---:|---:|---:|---|
| `grok-4.6` | 500k | `< 200k` | `$2.00` | `$0.50` | `$6.00` | https://docs.x.ai/developers/pricing |
| same | 500k | `>= 200k` | `$4.00` | `$1.00` | `$12.00` | same source |
| `grok-4.5` | 500k | `< 200k` | `$2.00` | `$0.30` | `$6.00` | same source |
| same | 500k | `>= 200k` | `$4.00` | `$0.60` | `$12.00` | same source |
| `grok-build-0.1` | 256k | `< 200k` | `$1.00` | `$0.20` | `$2.00` | same source |
| same | 256k | `>= 200k` | `$2.00` | `$0.40` | `$4.00` | same source |
| `grok-4.3` | 1M | `< 200k` | `$1.25` | `$0.20` | `$2.50` | same source |
| same | 1M | `>= 200k` | `$2.50` | `$0.40` | `$5.00` | same source |
| `grok-4.20-0309-reasoning` | 1M | `< 200k` | `$1.25` | `$0.20` | `$2.50` | same source |
| same | 1M | `>= 200k` | `$2.50` | `$0.40` | `$5.00` | same source |
| `grok-4.20-0309-non-reasoning` | 1M | `< 200k` | `$1.25` | `$0.20` | `$2.50` | same source |
| same | 1M | `>= 200k` | `$2.50` | `$0.40` | `$5.00` | same source |
| `grok-4.20-multi-agent-0309` | 1M | `< 200k` | `$1.25` | `$0.20` | `$2.50` | same source |
| same | 1M | `>= 200k` | `$2.50` | `$0.40` | `$5.00` | same source |

xAI's cache guide says non-cached prompt tokens use input price, cached prompt tokens use cached price, completion tokens use output price, and **reasoning tokens use the full completion/output price**. Prompt caching is automatic on all `grok` language models; a hit is not guaranteed and entries can be evicted.

### Batch and Priority

| Regime | Official rule | Models / applicability | Exact source |
|---|---|---|---|
| Batch | **20% off** all token types: input, cached input, output, reasoning | `grok-4.3`, `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`, `grok-4.20-multi-agent-0309` | https://docs.x.ai/developers/pricing#batch-api-pricing |
| Batch | no batch discount | all models not listed above; image/video Batch is billed at Standard | same source |
| Priority | **2x Standard** after cache discount; applies to input, cached input, output, reasoning | text requests on Chat Completions and Responses only | https://docs.x.ai/developers/pricing#priority-processing-pricing |

For the four discounted model IDs, derived numeric Batch rates are `$1.00 / $0.16 / $2.00` in the short band and `$2.00 / $0.32 / $4.00` in the long band. These values are arithmetic from the official 20% discount, so they should carry `evidence: derived`, while `multiplier: 0.8` carries `evidence: official`.

Priority is billed only when the response confirms `"service_tier": "priority"`; a fallback response with `"default"` is billed at Standard. Store the returned tier on usage events. Priority is unsupported for image/video generation and Batch requests.

**Availability caution:** “models not listed above have no batch discount” is a pricing statement, not proof every unlisted model is enabled on every Batch endpoint/account. Keep availability separate from the multiplier.

### xAI server-side tool charges

Token use is charged in addition to tool invocations.

| Tool | Official cost | Normalized per-call equivalent | Exact source |
|---|---:|---:|---|
| Web Search (`web_search`) | `$5 / 1,000 calls` | `$0.005` | https://docs.x.ai/developers/pricing#tools-pricing |
| X Search (`x_search`) | `$5 / 1,000 calls` | `$0.005` | same source |
| Code Execution (`code_execution`, `code_interpreter`) | `$5 / 1,000 calls` | `$0.005` | same source |
| File Attachments (`attachment_search`) | `$10 / 1,000 calls` | `$0.01` | same source |
| Collections Search (`collections_search`, `file_search`) | `$2.50 / 1,000 calls` | `$0.0025` | same source |
| Image Generation | Imagine model rates | variable | same source |
| Image/video understanding from search | no invocation fee; token-based | selected model token cost | same source |
| Remote MCP tools | no xAI invocation fee; token-based | selected model token cost | same source |

Image Search is included in Web Search and billed at the Web Search rate. xAI also charges a **`$0.05` usage-guideline violation fee per request** when a Responses API violation is caught before generation. If generation occurs, normal generation charges still apply.

### Other direct xAI model/resource pricing

| Model/resource | Official rate | Exact source |
|---|---|---|
| `grok-imagine-image-2.0` media input | `$0.01/image` | https://docs.x.ai/developers/pricing#imagine-api-pricing |
| `grok-imagine-image-2.0` output | 1K Low `$0.04/image`; 2K Low `$0.06`; 1K Medium `$0.06`; 2K Medium `$0.08` | same source |
| `grok-imagine-image` | media input `$0.002/image`; output `$0.02/image` at 1K or 2K | same source |
| `grok-imagine-image-quality` | media input `$0.01/image`; output `$0.05` at 1K, `$0.07` at 2K | same source |
| `grok-imagine-video-1.5` | media input `$0.01/image`; output `$0.08/sec` 480p, `$0.14/sec` 720p, `$0.25/sec` 1080p | same source |
| `grok-imagine-video` | media input `$0.01/sec` video or `$0.002/image`; output `$0.05/sec` 480p, `$0.07/sec` 720p | same source |
| `grok-voice-think-fast-2.0` speech-to-speech | `$0.08/min` audio (`$4.80/hour`) plus `$0.004 / text input` | https://docs.x.ai/developers/pricing#voice-api-pricing |
| Speech to Text | `$0.10/hour` REST; `$0.20/hour` streaming | same source |
| Text to Speech | `$15.00 / 1M characters` | same source |
| File storage | `$0.025 / GiB / day` | https://docs.x.ai/developers/pricing#files-and-collections-pricing |
| Collection storage | `$0.10 / GiB / day` | same source |
| File or collection download | `$0.20 / GiB downloaded` | same source |

**Uncertainty:** xAI prints `$0.004 / text input` for the speech-to-speech model without defining the denominator in the pricing table. Do not convert it to a per-character, per-token, or per-request value without another first-party definition.

### xAI machine-extraction feasibility: **high**

`https://docs.x.ai/developers/pricing.md` is a first-party Markdown rendering with semantic tables for text models, media, voice, tools, Batch, Priority, storage, downloads, and the violation fee. The HTML page supplies a displayed last-updated date. A scheduled extractor can parse the Markdown and validate against the HTML update date.

Required safeguards:

- preserve the exact `< 200k` versus `>= 200k` operators;
- keep maximum context separate from the pricing threshold;
- represent Batch and Priority as official modifiers and materialize numeric rates only as derived rows;
- do not assume a cache hit or cache retention duration;
- retain non-token units and ambiguous prose instead of coercing them into token prices.

## 3. Proposed normalized data shape

A flat `{ input, cachedInput, output }` object can remain a convenience view, but the source of truth should be a dimensioned rate card. A lossless record can look like:

```ts
type PriceRate = {
  provider: "google" | "xai";
  productChannel: "gemini_developer_api" | "gemini_agent_platform" | "xai_direct";
  modelId: string;
  displayName: string;
  status: "ga" | "preview" | "deprecated" | "shutdown" | "unknown";

  currency: "USD";
  chargeKind:
    | "input_tokens"
    | "cached_input_tokens"
    | "output_tokens"
    | "cache_storage"
    | "tool_invocation"
    | "media_input"
    | "media_output"
    | "storage"
    | "download"
    | "request_fee";
  unit:
    | "million_tokens"
    | "million_token_hours"
    | "thousand_calls"
    | "request"
    | "image"
    | "second"
    | "minute"
    | "hour"
    | "million_characters"
    | "gib_day"
    | "gib";
  usd: string; // decimal string, never binary float

  serviceTier: "standard" | "batch" | "flex" | "priority" | null;
  modality: "text" | "image" | "video" | "audio" | "document" | "all" | null;
  region: "global" | "non_global" | string | null;
  tool: string | null;

  condition: {
    metric: "prompt_tokens" | "returned_service_tier" | null;
    operator: "<" | "<=" | ">" | ">=" | "=" | null;
    value: number | string | null;
    repricesWholeRequest: boolean | null;
    cachedTokensCountTowardMetric: boolean | null;
  };

  includesReasoningTokens: boolean | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  observedAt: string;
  sourceUrl: string;
  sourcePageUpdatedAt: string | null;
  evidence: "official" | "derived";
  availability: "available" | "not_available" | "conditional" | "unknown";
  notes: string[];
};

type PriceModifier = {
  provider: string;
  productChannel: string;
  modelIds: string[] | "all_supported";
  serviceTier: "batch" | "priority";
  multiplier: string;
  appliesTo: Array<"input_tokens" | "cached_input_tokens" | "output_tokens" | "reasoning_tokens">;
  stackingOrder: string[];
  sourceUrl: string;
  evidence: "official";
};
```

Implementation guardrails from this pass:

1. Keep `observedAt`, provider page `updatedAt`, and contractual `effectiveFrom` as separate facts.
2. Use decimal strings or a decimal library. Rates such as `$0.0375`, `$0.0125`, and `$0.0025/call` should not round in storage.
3. Encode long-context operators exactly. Google `> 200k` and xAI `>= 200k` are not interchangeable.
4. Store input modality as a dimension. Choosing a single Gemini input value silently misprices audio on several models.
5. Store explicit-cache read and cache storage as separate additive charges. Null/unavailable is not zero.
6. Preserve official modifiers separately from derived expanded prices. This keeps xAI's `0.8` Batch and `2.0` Priority provenance auditable.
7. Add `productChannel` before ingesting Google. Similar model names across Developer API and Agent Platform do not imply identical billing.
8. Tool budgets need invocation counts as well as token counts. One Google prompt can cause multiple billable search queries; one xAI request can cause multiple tool calls.
9. Do not offer shutdown models in the calculator even if a historical price table remains visible.
10. Require a manual-review flag when a unit is ambiguous, a priced capability lacks a documented minimum, or two first-party product channels disagree.
