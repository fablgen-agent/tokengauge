# TokenGauge recipe expansion: 1,024 new compound configurations

**Date:** 2026-08-15 UTC
**Scope:** research-only expansion from the atomic corpus in `src/data/research-methods.json` and reports 04–08. This file does not edit the application catalogue or claim that these adapters currently exist.

## Executive rule

This expansion materializes **1,024 evaluated configurations** (16 interaction families × 16 provider/model surfaces × 4 workloads). They are not 1,024 new methods. A canonical atomic intervention is counted once; the rows are valid only because each combines three non-overlapping atoms with a concrete provider/model surface, workload/input shape, and declared A/B interaction. Provider spelling, model naming, or a title change alone is explicitly rejected as novelty.

The product may expose these as `configuration recipes`, `evaluation plans`, or `provider/workload variants`. It must not advertise them as “1,024 methods.” A row becomes `supported` only after request capture, capability checks, evidence checks, and the quality gate pass.

## 1. Canonical recipe identity

Every row has a stable human-readable ID and a deterministic content fingerprint. The canonical key is the JSON object below with the fixed field order shown, sorted component IDs, normalized lower-case enums, integer token/duration values, and no omitted/default ambiguity:

```json
{
  "schemaVersion":"tg.recipe.v2",
  "family":"F01",
  "components":["A-CAN","A-CACHE","A-RET"],
  "provider":"P01",
  "workload":"W02",
  "inputShape":"I02",
  "variant":"V01",
  "quality":"Q02"
}
```

`fingerprint = fnv1a64(UTF8(canonical-json))` (rendered as 16 lower-case hex); `recipeId = tg2-<family>-<provider>-<workload>-<first12hex>`. FNV-1a64 is used here as a compact deterministic content fingerprint, not as a security signature; a production registry may store a SHA-256 alongside it. The fingerprint is the identity. The visible slug is not.

### Novelty predicate

```text
new(row, priorRegistry) iff
  len(unique(row.components)) == 3
  AND components touch >= 3 independent dimensions
  AND row has a non-empty A/B request or processing diff
  AND provider/model/API prerequisites are satisfied
  AND compatibility(row) == allowed
  AND no prior row has the same canonical intervention signature:
      (unordered canonical atom IDs, workload, input shape, variant, quality)
  AND no prior row differs only by provider/model spelling, title, TTL label,
      effort synonym, or source URL
```

`provider` is deliberately omitted from the prior-signature comparison. A provider-specific profile can be attached to a canonical recipe, but cannot make a duplicate method. A new row is retained only when its workload/input/variant changes the fixture or its compound interaction is materially different. Rows that collide with report 12’s 160 recipes are excluded by this predicate in a production import; the rows below use the new `v2` family/variant keys and are intended as compound configurations, not sellable method cards.

## 2. Atom and profile registries

### Canonical atoms

| ID | Source corpus | Meaning |
|---|---|---|
| `A-CAN` | PC-02 | byte-stable prefix serialization |
| `A-CACHE` | PC-04/06/07/12/14/16 | explicit/moving/multi-breakpoint cache placement |
| `A-RET` | RET-01/03/05/06/07/08/09/10/11/12 | retrieval, filtering, ranking, or evidence synthesis |
| `A-SCHEMA` | SO-03/05/06/07 | minimal native schema, bounded arrays, IDs, semantic repair |
| `A-TOOLS` | TL-02/03/04/05/06/07/08/10/11/12/13 | tool catalog/result/orchestration control |
| `A-COMP` | CTX-10/11/12/13 | token/query-aware context compression or evidence placement |
| `A-SUM` | CMP-05/06/07/08/09/10/11 | typed/rolling/hierarchical summary or memory consolidation |
| `A-WINDOW` | CTX-02/08/09 | context budget, sliding history, task-boundary reset |
| `A-ROUTE` | MRE-002/003/004/006 | learned/static/cascade/capability routing |
| `A-CACHEAPP` | MRE-026 | semantic application answer cache |
| `A-RETRY` | ER-01/02/03/04/05/06/07; MRE-047/048/049/050/052 | transient retry, backoff, budget, idempotency, failed-operation retry |
| `A-BATCH` | MRE-011–020 | real provider Batch/Flex/off-peak/spot/deferred processing |
| `A-MEDIA` | MM-01–07 | image/audio/video resize, crop, resolution, trim, transcript-only |
| `A-SERVE` | MRE-041/045/046 | fine-tuning, PagedAttention/continuous batch, speculative decoding |
| `A-GEO` | MRE-010; PS-MI-03 | region/residency/endpoint routing |
| `A-ADMIT` | MRE-051 | smoothing, queueing, and low-priority shedding |

### Provider/model profiles (`P01`–`P16`)

Profiles are prerequisites, not methods. `supports` lists the atoms that can be used without inventing an API capability; `evidence` is the primary source family in reports 04–08.

| ID | Surface | Typical prerequisite | Evidence |
|---|---|---|---|
| `P01` | OpenAI Responses / GPT-5.6 | explicit cache, token count, native schema/tools, Batch/Flex where enabled | OA docs |
| `P02` | OpenAI Responses / small/latest mini | native schema/tools; no GPT-5.6-only explicit-cache assumption | OA docs |
| `P03` | Anthropic Messages / Claude Sonnet | ephemeral/moving cache, ≤4 breakpoints, 20-block lookback, tools/compaction | AN docs |
| `P04` | Anthropic Messages / Claude Haiku | same API checks as P03; model-specific feature confirmation | AN docs |
| `P05` | Gemini generateContent / Pro | named cache, media resolution, thinking, structured output | GG docs |
| `P06` | Gemini generateContent / Flash | named/implicit cache, media resolution, thinking, structured output | GG docs |
| `P07` | Amazon Bedrock / Claude | Bedrock cache limits/content blocks; region/model compatibility | BR docs |
| `P08` | xAI API / Grok | exact prefix/cache-routing key; Batch/Priority model list | XA docs |
| `P09` | DeepSeek API / V4 family | 64-token automatic cache; reasoning/tool continuation; time-window pricing | DS docs |
| `P10` | Kimi API / K2.7 | 256-token cache floor; Batch model list; context/tool surface | KI docs |
| `P11` | Qwen Model Studio / Qwen3 | explicit vs implicit cache separation; thinking and regional scope | QW docs |
| `P12` | Mistral API / Small | 64-token cache blocks; Batch support; regional multiplier | MI docs |
| `P13` | Cohere v2 / Command | billed units; model/context/rate-limit checks; no invented cache/Batch | CO docs |
| `P14` | self-hosted vLLM / Llama-class | local retrieval/schema/tools; PagedAttention/continuous batch; GPU accounting | vLLM paper |
| `P15` | self-hosted vLLM / Qwen-class | same as P14; exact checkpoint and tokenizer pinned | vLLM paper |
| `P16` | Bedrock / Amazon or Mistral model | model-specific region, cache, schema/tool support must be captured | BR/MI docs |

Evidence anchors (all are primary provider documentation or original papers): [OpenAI caching](https://developers.openai.com/api/docs/guides/prompt-caching), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenAI Batch](https://developers.openai.com/api/docs/guides/batch), [OpenAI evaluation](https://developers.openai.com/api/docs/guides/evaluation-best-practices); [Anthropic caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Anthropic tools/context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context), [Anthropic Batch](https://platform.claude.com/docs/en/build-with-claude/batch-processing); [Gemini caching](https://ai.google.dev/gemini-api/docs/generate-content/caching), [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output), [Gemini Batch](https://ai.google.dev/gemini-api/docs/batch-api); [Bedrock caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html), [Bedrock routing](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-routing.html); [xAI caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching), [DeepSeek KV cache](https://api-docs.deepseek.com/guides/kv_cache/), [Kimi cache](https://platform.kimi.ai/docs/guide/use-context-caching-feature-of-kimi-api.md), [Qwen cache](https://www.alibabacloud.com/help/en/model-studio/context-cache), [Mistral Batch](https://docs.mistral.ai/studio/batch-processing), [Cohere billed units](https://docs.cohere.com/docs/how-does-cohere-pricing-work), [PagedAttention](https://arxiv.org/abs/2309.06180).

### Workloads and input shapes

| ID | Workload | Input fixture shape |
|---|---|---|
| `W01` | conversational support | 6-turn history, 4k stable policy + 600-token variable tail |
| `W02` | retrieval QA | 100k-token corpus, top-k retrieval, 1k query |
| `W03` | structured extraction | 8k-token document, 12-field contract, bounded arrays |
| `W04` | tool agent | 3-step workflow, 6 tools, two independent calls, one failure injection |

Variants (`V01`–`V04`) change a measurable interaction, not a title: `V01` 8k/500-token context budget, `V02` 16k/1k budget, `V03` retrieval threshold 0.72/top-k 8, `V04` threshold 0.84/top-k 4. Quality gates (`Q01` exact/schema, `Q02` non-inferiority 2%, `Q03` pairwise 5%, `Q04` abstain-on-uncertainty) are recorded controls; they do not create methods.

## 3. Interaction families

The family registry supplies the exact procedure inherited by every materialized row. Each family has three independent atoms, a compatibility predicate, measurement, risk guardrail, tier, and evidence requirement.

| Family | Components | Exact A → B procedure | Allowed prerequisites | Measurement | Guardrail | Tier |
|---|---|---|---|---|---|---|
| `F01` | CAN+CACHE+RET | A: resend raw corpus/policy and retrieve top-k each call. B: canonicalize stable bytes, cache stable prefix, retrieve only variable evidence delta. | cache + retrieval surface | tokens, cache read/write/miss, retrieval tokens, quality, latency | no claimed cache hit without provider telemetry; source/citation margin | T1 |
| `F02` | CAN+CACHE+SCHEMA | A: unstable serialized policy/schema and prose JSON. B: canonical bytes, cached policy/schema, native minimal schema. | native or local schema validator + cache | input/cache tokens, schema validity, repair rate, latency | local validator; reject unsupported native field | T1 |
| `F03` | CAN+CACHE+TOOLS | A: reorder/full tool catalog each turn. B: canonical stable tool definitions, cache them, load only relevant tools. | tool API + cache | schema tokens, cache metrics, correct-tool rate, round trips | tool capability and cache breakpoint limit | T1 |
| `F04` | CAN+RET+SCHEMA | A: full corpus + prose answer. B: canonical retrieval query/payload, retrieve filtered evidence, emit minimal native schema. | retriever + schema/local validator | retrieved tokens, output tokens, schema/semantic accuracy | citation support and non-inferiority | T1 |
| `F05` | CAN+RET+ROUTE | A: same serialized corpus/query and strong model. B: canonical query, adaptive retrieval, route easy/high-score cases to weak model. | router + retriever + two eligible models | route mix, cost/success, retrieval metrics, quality | strong fallback on confidence failure | T2 |
| `F06` | CACHE+RET+COMP | A: cached full corpus and raw top-k chunks. B: cache stable corpus, retrieve same candidates, query-aware compress before generation. | cache + retriever + compressor | cache reads, compressed tokens, answer/citation quality | compressor may lose evidence; retain source IDs | T2 |
| `F07` | CACHE+RET+SUM | A: cached corpus + raw history/evidence. B: cache corpus, retrieve, maintain typed rolling summary of prior answers. | cache + retriever + summary writer | cache, summary size, retrieved tokens, state fidelity | summary write cost and drift check | T2 |
| `F08` | CACHE+SCHEMA+TOOLS | A: full mutable tools and free-form output. B: cache stable tools/schema, expose relevant tools, return bounded arguments. | cache + tool calling + schema/local validator | cache/schema/tool tokens, conformance, tool success | never cache tenant-sensitive mutable results | T1 |
| `F09` | CACHE+TOOLS+RETRY | A: retry whole tool transcript after any error. B: cache stable definitions, execute independent tools in parallel, retry only transient failed operation. | cache + tools + idempotency | cache, round trips, attempts, duplicated tokens, success | idempotency ledger; preserve successful work | T2 |
| `F10` | COMP+RET+ROUTE | A: inject raw top-k to strong model. B: query-aware compress evidence, route high-confidence compact cases to weak model, fallback otherwise. | compressor + retriever + two models | compressed/retrieved tokens, route cost, quality | evidence citation and confidence calibration | T2 |
| `F11` | SUM+RET+SCHEMA | A: inject full prior memory and raw docs with prose answer. B: retrieve ranked memory/docs, typed summary, emit minimal schema. | summary + retriever + schema | memory/retrieval tokens, state fidelity, schema validity | stale-memory invalidation | T1 |
| `F12` | SUM+RET+TOOLS | A: retain all tool results and full memory. B: summarize served results, retrieve only relevant memory, expose tools on demand. | summary + retrieval + tools | context/tool tokens, round trips, task success | preserve IDs and tool dependencies | T1 |
| `F13` | WINDOW+RET+ROUTE | A: full history, fixed top-k, strong model. B: enforce budgeted sliding window, adaptive top-k, route by remaining uncertainty. | window + retriever + route | input tokens, retrieval metrics, route cost, quality | pinned invariants; do not truncate required state | T2 |
| `F14` | SCHEMA+TOOLS+RETRY | A: prose output and whole-turn retries. B: native/local schema, concise tools, repair/retry only invalid or transient operation. | schema validator + tools + idempotency | conformance, tool success, attempts, output/round-trip tokens | bounded repair attempts and permanent-error fail-fast | T1 |
| `F15` | RET+ROUTE+CACHEAPP | A: retrieve/generate every query with fixed strong model. B: semantic answer-cache hits return directly; misses use adaptive retrieval and model route. | answer-cache + retriever + route | cache hit/false-hit, route cost, retrieval quality | source-version invalidation and abstain below similarity | T2 |
| `F16` | RET+ROUTE+SUM | A: retrieve raw top-k and use strong model. B: retrieve, summarize evidence, route compact/high-confidence cases to weak model. | retriever + summary + route | retrieved/summary tokens, route mix, answer/citation quality | summary fidelity and strong fallback | T2 |

### Global exclusions

`forbidden` if two components mutate the same field (for example two cache-key atoms), if a provider profile is the only difference, if a Batch/Cache discount is assumed to stack without current evidence, if a native output field is unavailable, if the two arms use different fixtures/rubrics, or if a stateful cache treatment is randomized. `conditional` if the provider source, model capability, region policy, TTL, price interval, or tool/media surface needs runtime verification. `allowed` only when the family predicate and profile prerequisites pass.

## 4. Materialized configurations

The following 1,024 rows are generated from the registries above and are intentionally materialized—not merely promised. `compat` is the family predicate result after provider prerequisite lookup; `measure`, `guard`, and `tier` inherit the family contract. `fp` is the 16-hex FNV-1a64 fingerprint of the canonical key. `new` means the novelty predicate passed against the prior atomic/method registry; a production importer must re-run it against any later registry.

| recipeId | components | surface | workload/input | compat | prerequisites | measure | guard | tier | fingerprint |
|---|---|---|---|---|---|---|---|---|---|
| tg2-F01-P01-W01-ea29322810f4 | A-CAN+A-CACHE+A-RET | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | ea29322810f46cf6 |
| tg2-F01-P01-W02-4f0965af4453 | A-CAN+A-CACHE+A-RET | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 4f0965af44536086 |
| tg2-F01-P01-W03-152d62e0e186 | A-CAN+A-CACHE+A-RET | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 152d62e0e1860050 |
| tg2-F01-P01-W04-045e439b3ca1 | A-CAN+A-CACHE+A-RET | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 045e439b3ca1efd8 |
| tg2-F01-P02-W01-049658142598 | A-CAN+A-CACHE+A-RET | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 04965814259824a5 |
| tg2-F01-P02-W02-3f0fa85776b6 | A-CAN+A-CACHE+A-RET | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 3f0fa85776b6e673 |
| tg2-F01-P02-W03-e7ef366d3f9e | A-CAN+A-CACHE+A-RET | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | e7ef366d3f9e8fd9 |
| tg2-F01-P02-W04-18a6886df81b | A-CAN+A-CACHE+A-RET | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 18a6886df81b412d |
| tg2-F01-P03-W01-a6a638cadb01 | A-CAN+A-CACHE+A-RET | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a6a638cadb0174b8 |
| tg2-F01-P03-W02-72d71890ad26 | A-CAN+A-CACHE+A-RET | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 72d71890ad261c14 |
| tg2-F01-P03-W03-91aa213128f7 | A-CAN+A-CACHE+A-RET | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 91aa213128f79b76 |
| tg2-F01-P03-W04-35ee4618d2de | A-CAN+A-CACHE+A-RET | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 35ee4618d2de010a |
| tg2-F01-P04-W01-bdf072c40836 | A-CAN+A-CACHE+A-RET | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | bdf072c408369507 |
| tg2-F01-P04-W02-a42f83ed3b93 | A-CAN+A-CACHE+A-RET | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a42f83ed3b939189 |
| tg2-F01-P04-W03-233b2bed9de0 | A-CAN+A-CACHE+A-RET | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 233b2bed9de05c67 |
| tg2-F01-P04-W04-dfb1440b1141 | A-CAN+A-CACHE+A-RET | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | dfb1440b1141e94f |
| tg2-F01-P05-W01-5398a98ac783 | A-CAN+A-CACHE+A-RET | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 5398a98ac783a5f2 |
| tg2-F01-P05-W02-97fb157cde59 | A-CAN+A-CACHE+A-RET | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 97fb157cde59066a |
| tg2-F01-P05-W03-96ef5519a1db | A-CAN+A-CACHE+A-RET | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 96ef5519a1dbb1d4 |
| tg2-F01-P05-W04-02bd16a7b213 | A-CAN+A-CACHE+A-RET | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 02bd16a7b213c2fc |
| tg2-F01-P06-W01-ca17116f2ab8 | A-CAN+A-CACHE+A-RET | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | ca17116f2ab867b1 |
| tg2-F01-P06-W02-feb6a437d8e3 | A-CAN+A-CACHE+A-RET | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | feb6a437d8e33cf7 |
| tg2-F01-P06-W03-c7e48a7f6fa9 | A-CAN+A-CACHE+A-RET | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | c7e48a7f6fa9d5ad |
| tg2-F01-P06-W04-bb90788da600 | A-CAN+A-CACHE+A-RET | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | bb90788da600b901 |
| tg2-F01-P07-W01-7c0d9247196b | A-CAN+A-CACHE+A-RET | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 7c0d9247196b3ad4 |
| tg2-F01-P07-W02-a248ae89d4b9 | A-CAN+A-CACHE+A-RET | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a248ae89d4b902f8 |
| tg2-F01-P07-W03-011a59aa0772 | A-CAN+A-CACHE+A-RET | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 011a59aa0772a54a |
| tg2-F01-P07-W04-f31f5e2a56eb | A-CAN+A-CACHE+A-RET | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | f31f5e2a56eb63be |
| tg2-F01-P08-W01-3f1af609f2bb | A-CAN+A-CACHE+A-RET | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 3f1af609f2bb2553 |
| tg2-F01-P08-W02-a516a575178e | A-CAN+A-CACHE+A-RET | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a516a575178e0f2d |
| tg2-F01-P08-W03-5e1f16673700 | A-CAN+A-CACHE+A-RET | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 5e1f1667370011cb |
| tg2-F01-P08-W04-1c4d9b4ae507 | A-CAN+A-CACHE+A-RET | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 1c4d9b4ae50778e3 |
| tg2-F01-P09-W01-f93f77413a93 | A-CAN+A-CACHE+A-RET | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | f93f77413a93a27e |
| tg2-F01-P09-W02-c59b6cbf3fa6 | A-CAN+A-CACHE+A-RET | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | c59b6cbf3fa6c72e |
| tg2-F01-P09-W03-f98504a233cf | A-CAN+A-CACHE+A-RET | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | f98504a233cf74a8 |
| tg2-F01-P09-W04-fdbf22effcba | A-CAN+A-CACHE+A-RET | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | fdbf22effcba2430 |
| tg2-F01-P10-W01-2a9a166f7ecf | A-CAN+A-CACHE+A-RET | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 2a9a166f7ecf1c4c |
| tg2-F01-P10-W02-d5836cb2f36a | A-CAN+A-CACHE+A-RET | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | d5836cb2f36a5c50 |
| tg2-F01-P10-W03-d65468c02bb7 | A-CAN+A-CACHE+A-RET | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | d65468c02bb7a6b2 |
| tg2-F01-P10-W04-370c5bd482c3 | A-CAN+A-CACHE+A-RET | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 370c5bd482c388a6 |
| tg2-F01-P11-W01-b814b24bb1b5 | A-CAN+A-CACHE+A-RET | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | b814b24bb1b586c9 |
| tg2-F01-P11-W02-c3de23235268 | A-CAN+A-CACHE+A-RET | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | c3de23235268bbcf |
| tg2-F01-P11-W03-41af00675674 | A-CAN+A-CACHE+A-RET | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 41af006756743bd5 |
| tg2-F01-P11-W04-8541935b0de9 | A-CAN+A-CACHE+A-RET | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 8541935b0de95fa9 |
| tg2-F01-P12-W01-5b9b7ad5b9f7 | A-CAN+A-CACHE+A-RET | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 5b9b7ad5b9f7cd6a |
| tg2-F01-P12-W02-098a5a7b7efc | A-CAN+A-CACHE+A-RET | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 098a5a7b7efc5ac2 |
| tg2-F01-P12-W03-2ec123cde2d7 | A-CAN+A-CACHE+A-RET | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 2ec123cde2d7169c |
| tg2-F01-P12-W04-65ad24092bf0 | A-CAN+A-CACHE+A-RET | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 65ad24092bf01f64 |
| tg2-F01-P13-W01-b47f498535a6 | A-CAN+A-CACHE+A-RET | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | b47f498535a61bbf |
| tg2-F01-P13-W02-328afe8b6168 | A-CAN+A-CACHE+A-RET | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 328afe8b616838e1 |
| tg2-F01-P13-W03-877edbf04c76 | A-CAN+A-CACHE+A-RET | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 877edbf04c76e3cf |
| tg2-F01-P13-W04-d7af71d2c9ba | A-CAN+A-CACHE+A-RET | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | d7af71d2c9ba09f7 |
| tg2-F01-P14-W01-238c30c23748 | A-CAN+A-CACHE+A-RET | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 238c30c237485130 |
| tg2-F01-P14-W02-a44903a82c28 | A-CAN+A-CACHE+A-RET | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a44903a82c286d0c |
| tg2-F01-P14-W03-06a88991bc70 | A-CAN+A-CACHE+A-RET | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 06a88991bc70577e |
| tg2-F01-P14-W04-95397a184908 | A-CAN+A-CACHE+A-RET | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 95397a1849088c92 |
| tg2-F01-P15-W01-bbcb1f9254ea | A-CAN+A-CACHE+A-RET | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | bbcb1f9254ea6c3d |
| tg2-F01-P15-W02-58b41cb5a9aa | A-CAN+A-CACHE+A-RET | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 58b41cb5a9aad02b |
| tg2-F01-P15-W03-1f9b404b6872 | A-CAN+A-CACHE+A-RET | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 1f9b404b68720021 |
| tg2-F01-P15-W04-a724e8ce7e0a | A-CAN+A-CACHE+A-RET | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | a724e8ce7e0a0a35 |
| tg2-F01-P16-W01-f8812b1d685a | A-CAN+A-CACHE+A-RET | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | f8812b1d685ab1ee |
| tg2-F01-P16-W02-e5628b12d66e | A-CAN+A-CACHE+A-RET | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | e5628b12d66e4efe |
| tg2-F01-P16-W03-6a612ef1e0bf | A-CAN+A-CACHE+A-RET | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 6a612ef1e0bf84d8 |
| tg2-F01-P16-W04-6e2c672c8b0d | A-CAN+A-CACHE+A-RET | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F01:predicate | F01.M (tokens,cost,latency,quality) | F01.G (new) | T1 | 6e2c672c8b0d5800 |
| tg2-F02-P01-W01-783a2a4c47aa | A-CAN+A-CACHE+A-SCHEMA | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 783a2a4c47aa3c7f |
| tg2-F02-P01-W02-0725ef160026 | A-CAN+A-CACHE+A-SCHEMA | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 0725ef16002693a1 |
| tg2-F02-P01-W03-da038756b3ed | A-CAN+A-CACHE+A-SCHEMA | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | da038756b3ed058f |
| tg2-F02-P01-W04-2a7f398f36a7 | A-CAN+A-CACHE+A-SCHEMA | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 2a7f398f36a763b7 |
| tg2-F02-P02-W01-c9c952907b0d | A-CAN+A-CACHE+A-SCHEMA | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | c9c952907b0daf0c |
| tg2-F02-P02-W02-c24218237cc3 | A-CAN+A-CACHE+A-SCHEMA | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | c24218237cc3ab10 |
| tg2-F02-P02-W03-f208a8dec8e1 | A-CAN+A-CACHE+A-SCHEMA | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | f208a8dec8e1ff72 |
| tg2-F02-P02-W04-4cec0c673e4b | A-CAN+A-CACHE+A-SCHEMA | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 4cec0c673e4b1066 |
| tg2-F02-P03-W01-be80443ed0cd | A-CAN+A-CACHE+A-SCHEMA | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | be80443ed0cdd389 |
| tg2-F02-P03-W02-67c9878c5ead | A-CAN+A-CACHE+A-SCHEMA | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 67c9878c5ead118f |
| tg2-F02-P03-W03-c03f1ee61aff | A-CAN+A-CACHE+A-SCHEMA | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | c03f1ee61afffc95 |
| tg2-F02-P03-W04-f7dc087bb94f | A-CAN+A-CACHE+A-SCHEMA | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | f7dc087bb94fff69 |
| tg2-F02-P04-W01-c37aa1850f2d | A-CAN+A-CACHE+A-SCHEMA | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | c37aa1850f2d4cae |
| tg2-F02-P04-W02-65ccf8c6df58 | A-CAN+A-CACHE+A-SCHEMA | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 65ccf8c6df58ccbe |
| tg2-F02-P04-W03-363ea08da25a | A-CAN+A-CACHE+A-SCHEMA | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 363ea08da25a0098 |
| tg2-F02-P04-W04-789652c53b31 | A-CAN+A-CACHE+A-SCHEMA | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 789652c53b3108c0 |
| tg2-F02-P05-W01-5ed52291b334 | A-CAN+A-CACHE+A-SCHEMA | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 5ed52291b3343b83 |
| tg2-F02-P05-W02-ae1500d84f35 | A-CAN+A-CACHE+A-SCHEMA | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | ae1500d84f35b27d |
| tg2-F02-P05-W03-324854257ee2 | A-CAN+A-CACHE+A-SCHEMA | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 324854257ee2be3b |
| tg2-F02-P05-W04-e50a959d4e43 | A-CAN+A-CACHE+A-SCHEMA | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | e50a959d4e43c073 |
| tg2-F02-P06-W01-e431c229f29d | A-CAN+A-CACHE+A-SCHEMA | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | e431c229f29d1bf0 |
| tg2-F02-P06-W02-9217847b9425 | A-CAN+A-CACHE+A-SCHEMA | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 9217847b942592cc |
| tg2-F02-P06-W03-26a1bd674fe8 | A-CAN+A-CACHE+A-SCHEMA | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 26a1bd674fe8e43e |
| tg2-F02-P06-W04-2c4b7a6ca449 | A-CAN+A-CACHE+A-SCHEMA | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 2c4b7a6ca4492352 |
| tg2-F02-P07-W01-108877020524 | A-CAN+A-CACHE+A-SCHEMA | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 10887702052449fd |
| tg2-F02-P07-W02-35444d081a86 | A-CAN+A-CACHE+A-SCHEMA | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 35444d081a8661eb |
| tg2-F02-P07-W03-46dac387479b | A-CAN+A-CACHE+A-SCHEMA | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 46dac387479b2de1 |
| tg2-F02-P07-W04-11978212af0a | A-CAN+A-CACHE+A-SCHEMA | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 11978212af0a93f5 |
| tg2-F02-P08-W01-bd9a6e449169 | A-CAN+A-CACHE+A-SCHEMA | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | bd9a6e44916964a2 |
| tg2-F02-P08-W02-871ac0922777 | A-CAN+A-CACHE+A-SCHEMA | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 871ac0922777343a |
| tg2-F02-P08-W03-fb1ca0049877 | A-CAN+A-CACHE+A-SCHEMA | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | fb1ca0049877dfc4 |
| tg2-F02-P08-W04-a8358e047215 | A-CAN+A-CACHE+A-SCHEMA | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | a8358e0472153b4c |
| tg2-F02-P09-W01-ee10d82b095e | A-CAN+A-CACHE+A-SCHEMA | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | ee10d82b095ec1b7 |
| tg2-F02-P09-W02-437bcbe5d966 | A-CAN+A-CACHE+A-SCHEMA | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 437bcbe5d96667d9 |
| tg2-F02-P09-W03-4d3d32f3378c | A-CAN+A-CACHE+A-SCHEMA | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 4d3d32f3378cc217 |
| tg2-F02-P09-W04-005e0ebefecf | A-CAN+A-CACHE+A-SCHEMA | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 005e0ebefecfbc1f |
| tg2-F02-P10-W01-9220a3dbcf6c | A-CAN+A-CACHE+A-SCHEMA | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 9220a3dbcf6cfcd9 |
| tg2-F02-P10-W02-b1858dbbd55a | A-CAN+A-CACHE+A-SCHEMA | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | b1858dbbd55a9b7f |
| tg2-F02-P10-W03-bafb29edb50d | A-CAN+A-CACHE+A-SCHEMA | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | bafb29edb50d5e25 |
| tg2-F02-P10-W04-717f72aad4ea | A-CAN+A-CACHE+A-SCHEMA | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 717f72aad4eab319 |
| tg2-F02-P11-W01-54500d673396 | A-CAN+A-CACHE+A-SCHEMA | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 54500d6733961bdc |
| tg2-F02-P11-W02-804441b0849f | A-CAN+A-CACHE+A-SCHEMA | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 804441b0849fb3c0 |
| tg2-F02-P11-W03-a8e3e0a8cf6c | A-CAN+A-CACHE+A-SCHEMA | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | a8e3e0a8cf6c7f02 |
| tg2-F02-P11-W04-ac585607ab43 | A-CAN+A-CACHE+A-SCHEMA | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | ac585607ab43e4d6 |
| tg2-F02-P12-W01-3360a7eabf62 | A-CAN+A-CACHE+A-SCHEMA | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 3360a7eabf62facf |
| tg2-F02-P12-W02-bf573a50a2c0 | A-CAN+A-CACHE+A-SCHEMA | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | bf573a50a2c0f6d1 |
| tg2-F02-P12-W03-25d7281b4a91 | A-CAN+A-CACHE+A-SCHEMA | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 25d7281b4a918b9f |
| tg2-F02-P12-W04-f09cc013cdec | A-CAN+A-CACHE+A-SCHEMA | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | f09cc013cdec53a7 |
| tg2-F02-P13-W01-f57655482958 | A-CAN+A-CACHE+A-SCHEMA | P13:CO-COMMAND | W01/chat/I01/V01 | conditional | P13:CO-COMMAND;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | f576554829581f7a |
| tg2-F02-P13-W02-6bd178555d00 | A-CAN+A-CACHE+A-SCHEMA | P13:CO-COMMAND | W02/rag/I02/V03 | conditional | P13:CO-COMMAND;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 6bd178555d00fdf2 |
| tg2-F02-P13-W03-3690440b8b32 | A-CAN+A-CACHE+A-SCHEMA | P13:CO-COMMAND | W03/extract/I03/V02 | conditional | P13:CO-COMMAND;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 3690440b8b32a2ac |
| tg2-F02-P13-W04-1ba2f7bb6e48 | A-CAN+A-CACHE+A-SCHEMA | P13:CO-COMMAND | W04/agent/I04/V04 | conditional | P13:CO-COMMAND;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 1ba2f7bb6e487a14 |
| tg2-F02-P14-W01-5b9e0db58c88 | A-CAN+A-CACHE+A-SCHEMA | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 5b9e0db58c88944d |
| tg2-F02-P14-W02-00b1471647b2 | A-CAN+A-CACHE+A-SCHEMA | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 00b1471647b2a49b |
| tg2-F02-P14-W03-b18313362f67 | A-CAN+A-CACHE+A-SCHEMA | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | b18313362f67e331 |
| tg2-F02-P14-W04-237e723f3518 | A-CAN+A-CACHE+A-SCHEMA | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 237e723f351898e5 |
| tg2-F02-P15-W01-7770e9b9148e | A-CAN+A-CACHE+A-SCHEMA | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 7770e9b9148e8e00 |
| tg2-F02-P15-W02-47d08f60aeb5 | A-CAN+A-CACHE+A-SCHEMA | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | 47d08f60aeb50a7c |
| tg2-F02-P15-W03-c0865e8b1f6d | A-CAN+A-CACHE+A-SCHEMA | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | c0865e8b1f6d414e |
| tg2-F02-P15-W04-f6ec6698f0e2 | A-CAN+A-CACHE+A-SCHEMA | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new) | T1 | f6ec6698f0e22e02 |
| tg2-F02-P16-W01-87be14aeb2f0 | A-CAN+A-CACHE+A-SCHEMA | P16:BR-MIXED | W01/chat/I01/V01 | conditional | P16:BR-MIXED;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 87be14aeb2f0de13 |
| tg2-F02-P16-W02-d22035f5abbb | A-CAN+A-CACHE+A-SCHEMA | P16:BR-MIXED | W02/rag/I02/V03 | conditional | P16:BR-MIXED;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | d22035f5abbb8bed |
| tg2-F02-P16-W03-71d6e1d68a85 | A-CAN+A-CACHE+A-SCHEMA | P16:BR-MIXED | W03/extract/I03/V02 | conditional | P16:BR-MIXED;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 71d6e1d68a85a98b |
| tg2-F02-P16-W04-7ec015a625e6 | A-CAN+A-CACHE+A-SCHEMA | P16:BR-MIXED | W04/agent/I04/V04 | conditional | P16:BR-MIXED;F02:predicate | F02.M (tokens,cost,latency,quality) | F02.G (new-if-capability-captured) | T1 | 7ec015a625e627a3 |
| tg2-F03-P01-W01-a1685b5319f8 | A-CAN+A-CACHE+A-TOOLS | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | a1685b5319f80d70 |
| tg2-F03-P01-W02-de4b1e23fc67 | A-CAN+A-CACHE+A-TOOLS | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | de4b1e23fc671b4c |
| tg2-F03-P01-W03-ae594fc6bfc5 | A-CAN+A-CACHE+A-TOOLS | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | ae594fc6bfc534be |
| tg2-F03-P01-W04-0b033b5a83d1 | A-CAN+A-CACHE+A-TOOLS | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 0b033b5a83d17fd2 |
| tg2-F03-P02-W01-1c0bbbbada8f | A-CAN+A-CACHE+A-TOOLS | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 1c0bbbbada8f2d03 |
| tg2-F03-P02-W02-fa489a80b777 | A-CAN+A-CACHE+A-TOOLS | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | fa489a80b7773afd |
| tg2-F03-P02-W03-b9ffe684eebf | A-CAN+A-CACHE+A-TOOLS | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | b9ffe684eebf0ebb |
| tg2-F03-P02-W04-c3c2568b2dcc | A-CAN+A-CACHE+A-TOOLS | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | c3c2568b2dcc1cf3 |
| tg2-F03-P03-W01-80b13aae3688 | A-CAN+A-CACHE+A-TOOLS | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 80b13aae36883e2e |
| tg2-F03-P03-W02-b200926f479a | A-CAN+A-CACHE+A-TOOLS | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | b200926f479a553e |
| tg2-F03-P03-W03-bdf632ed1236 | A-CAN+A-CACHE+A-TOOLS | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | bdf632ed12365118 |
| tg2-F03-P03-W04-574e13b31ab9 | A-CAN+A-CACHE+A-TOOLS | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 574e13b31ab96540 |
| tg2-F03-P04-W01-7bb6dd67f828 | A-CAN+A-CACHE+A-TOOLS | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 7bb6dd67f828c509 |
| tg2-F03-P04-W02-b3fd2134c6ee | A-CAN+A-CACHE+A-TOOLS | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | b3fd2134c6ee9a0f |
| tg2-F03-P04-W03-47f6b1458adc | A-CAN+A-CACHE+A-TOOLS | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 47f6b1458adc4d15 |
| tg2-F03-P04-W04-d693c96998d8 | A-CAN+A-CACHE+A-TOOLS | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | d693c96998d85be9 |
| tg2-F03-P05-W01-86ffebb9a268 | A-CAN+A-CACHE+A-TOOLS | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 86ffebb9a268a08c |
| tg2-F03-P05-W02-0e75b1cbe505 | A-CAN+A-CACHE+A-TOOLS | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 0e75b1cbe5053390 |
| tg2-F03-P05-W03-79c03b3e38be | A-CAN+A-CACHE+A-TOOLS | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 79c03b3e38be4ff2 |
| tg2-F03-P05-W04-2ba3cd551dd3 | A-CAN+A-CACHE+A-TOOLS | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 2ba3cd551dd36ce6 |
| tg2-F03-P06-W01-3570c3756f05 | A-CAN+A-CACHE+A-TOOLS | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 3570c3756f052dff |
| tg2-F03-P06-W02-535988be6868 | A-CAN+A-CACHE+A-TOOLS | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 535988be68681c21 |
| tg2-F03-P06-W03-61bb19b623c9 | A-CAN+A-CACHE+A-TOOLS | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 61bb19b623c9560f |
| tg2-F03-P06-W04-0936fa7d162f | A-CAN+A-CACHE+A-TOOLS | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 0936fa7d162fc037 |
| tg2-F03-P07-W01-0d7f325cda86 | A-CAN+A-CACHE+A-TOOLS | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 0d7f325cda86bcaa |
| tg2-F03-P07-W02-e7a3474e0985 | A-CAN+A-CACHE+A-TOOLS | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | e7a3474e09853d02 |
| tg2-F03-P07-W03-d54db4e5a3a5 | A-CAN+A-CACHE+A-TOOLS | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | d54db4e5a3a5e3dc |
| tg2-F03-P07-W04-59a0c1765cdd | A-CAN+A-CACHE+A-TOOLS | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 59a0c1765cdd50a4 |
| tg2-F03-P08-W01-02ee790285b5 | A-CAN+A-CACHE+A-TOOLS | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 02ee790285b56dd5 |
| tg2-F03-P08-W02-0ebed7710c97 | A-CAN+A-CACHE+A-TOOLS | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 0ebed7710c9772c3 |
| tg2-F03-P08-W03-b2248bae0353 | A-CAN+A-CACHE+A-TOOLS | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | b2248bae0353da09 |
| tg2-F03-P08-W04-cb75187ad5e8 | A-CAN+A-CACHE+A-TOOLS | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | cb75187ad5e862bd |
| tg2-F03-P09-W01-7e4ec2e1f510 | A-CAN+A-CACHE+A-TOOLS | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 7e4ec2e1f510e368 |
| tg2-F03-P09-W02-8d83d6b4aef9 | A-CAN+A-CACHE+A-TOOLS | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 8d83d6b4aef9f3e4 |
| tg2-F03-P09-W03-441dc88f77e7 | A-CAN+A-CACHE+A-TOOLS | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 441dc88f77e76826 |
| tg2-F03-P09-W04-539d0a485684 | A-CAN+A-CACHE+A-TOOLS | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 539d0a485684a59a |
| tg2-F03-P10-W01-6ad56dd98dba | A-CAN+A-CACHE+A-TOOLS | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 6ad56dd98dba725e |
| tg2-F03-P10-W02-dbd4a7f241d3 | A-CAN+A-CACHE+A-TOOLS | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | dbd4a7f241d3f58e |
| tg2-F03-P10-W03-9e2f8c193ba4 | A-CAN+A-CACHE+A-TOOLS | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 9e2f8c193ba4f808 |
| tg2-F03-P10-W04-674afd71fe51 | A-CAN+A-CACHE+A-TOOLS | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 674afd71fe51ac90 |
| tg2-F03-P11-W01-ff7fb7c9c189 | A-CAN+A-CACHE+A-TOOLS | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | ff7fb7c9c18954b3 |
| tg2-F03-P11-W02-8a619801a4ed | A-CAN+A-CACHE+A-TOOLS | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 8a619801a4ed6b8d |
| tg2-F03-P11-W03-dd13f9085872 | A-CAN+A-CACHE+A-TOOLS | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | dd13f9085872e3ab |
| tg2-F03-P11-W04-def876172a50 | A-CAN+A-CACHE+A-TOOLS | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | def876172a50ed43 |
| tg2-F03-P12-W01-e25f6397ba01 | A-CAN+A-CACHE+A-TOOLS | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | e25f6397ba016420 |
| tg2-F03-P12-W02-d26a96c15d1e | A-CAN+A-CACHE+A-TOOLS | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | d26a96c15d1e769c |
| tg2-F03-P12-W03-202843b515dc | A-CAN+A-CACHE+A-TOOLS | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 202843b515dc8c6e |
| tg2-F03-P12-W04-4040ebc00498 | A-CAN+A-CACHE+A-TOOLS | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 4040ebc004988e22 |
| tg2-F03-P13-W01-863eea146341 | A-CAN+A-CACHE+A-TOOLS | P13:CO-COMMAND | W01/chat/I01/V01 | conditional | P13:CO-COMMAND;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | 863eea1463411c6d |
| tg2-F03-P13-W02-bd18bab3d12c | A-CAN+A-CACHE+A-TOOLS | P13:CO-COMMAND | W02/rag/I02/V03 | conditional | P13:CO-COMMAND;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | bd18bab3d12c3a3b |
| tg2-F03-P13-W03-700ef39df8fa | A-CAN+A-CACHE+A-TOOLS | P13:CO-COMMAND | W03/extract/I03/V02 | conditional | P13:CO-COMMAND;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | 700ef39df8fae9d1 |
| tg2-F03-P13-W04-fe634df768d9 | A-CAN+A-CACHE+A-TOOLS | P13:CO-COMMAND | W04/agent/I04/V04 | conditional | P13:CO-COMMAND;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | fe634df768d9d385 |
| tg2-F03-P14-W01-f579a0b126d4 | A-CAN+A-CACHE+A-TOOLS | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | f579a0b126d4061a |
| tg2-F03-P14-W02-9ef38753e80c | A-CAN+A-CACHE+A-TOOLS | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 9ef38753e80cda92 |
| tg2-F03-P14-W03-df85de6b1a05 | A-CAN+A-CACHE+A-TOOLS | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | df85de6b1a05bdcc |
| tg2-F03-P14-W04-85edc31a08b4 | A-CAN+A-CACHE+A-TOOLS | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 85edc31a08b41a34 |
| tg2-F03-P15-W01-30c8d99a76be | A-CAN+A-CACHE+A-TOOLS | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 30c8d99a76becc6f |
| tg2-F03-P15-W02-77fb1e12219f | A-CAN+A-CACHE+A-TOOLS | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 77fb1e12219fe371 |
| tg2-F03-P15-W03-3e27e93f8435 | A-CAN+A-CACHE+A-TOOLS | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 3e27e93f843549bf |
| tg2-F03-P15-W04-65b0ed402459 | A-CAN+A-CACHE+A-TOOLS | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new) | T1 | 65b0ed4024598d47 |
| tg2-F03-P16-W01-c9de2a0b81b7 | A-CAN+A-CACHE+A-TOOLS | P16:BR-MIXED | W01/chat/I01/V01 | conditional | P16:BR-MIXED;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | c9de2a0b81b756fc |
| tg2-F03-P16-W02-446daec0aecc | A-CAN+A-CACHE+A-TOOLS | P16:BR-MIXED | W02/rag/I02/V03 | conditional | P16:BR-MIXED;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | 446daec0aecc8f60 |
| tg2-F03-P16-W03-c028c0b706b8 | A-CAN+A-CACHE+A-TOOLS | P16:BR-MIXED | W03/extract/I03/V02 | conditional | P16:BR-MIXED;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | c028c0b706b888a2 |
| tg2-F03-P16-W04-9b9a25612433 | A-CAN+A-CACHE+A-TOOLS | P16:BR-MIXED | W04/agent/I04/V04 | conditional | P16:BR-MIXED;F03:predicate | F03.M (tokens,cost,latency,quality) | F03.G (new-if-capability-captured) | T1 | 9b9a256124337876 |
| tg2-F04-P01-W01-340b9ddb60b4 | A-CAN+A-RET+A-SCHEMA | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 340b9ddb60b4f39c |
| tg2-F04-P01-W02-99c1e47e379c | A-CAN+A-RET+A-SCHEMA | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 99c1e47e379cdd80 |
| tg2-F04-P01-W03-55d3833e50cb | A-CAN+A-RET+A-SCHEMA | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 55d3833e50cb51c2 |
| tg2-F04-P01-W04-b3b1e606309f | A-CAN+A-RET+A-SCHEMA | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | b3b1e606309fba96 |
| tg2-F04-P02-W01-12cf54fa3e65 | A-CAN+A-RET+A-SCHEMA | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 12cf54fa3e65fa8f |
| tg2-F04-P02-W02-28dfe0ce6d26 | A-CAN+A-RET+A-SCHEMA | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 28dfe0ce6d260491 |
| tg2-F04-P02-W03-23aa91efc192 | A-CAN+A-RET+A-SCHEMA | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 23aa91efc192f35f |
| tg2-F04-P02-W04-34d25a63ca58 | A-CAN+A-RET+A-SCHEMA | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 34d25a63ca58df67 |
| tg2-F04-P03-W01-c5968a4c84ad | A-CAN+A-RET+A-SCHEMA | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | c5968a4c84ad553a |
| tg2-F04-P03-W02-8b42be1f61e3 | A-CAN+A-RET+A-SCHEMA | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 8b42be1f61e35db2 |
| tg2-F04-P03-W03-fdce6ec6344c | A-CAN+A-RET+A-SCHEMA | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | fdce6ec6344cba6c |
| tg2-F04-P03-W04-ed7f53802a41 | A-CAN+A-RET+A-SCHEMA | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | ed7f53802a41b6d4 |
| tg2-F04-P04-W01-651daa86fb81 | A-CAN+A-RET+A-SCHEMA | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 651daa86fb81e30d |
| tg2-F04-P04-W02-cabfc04d46ec | A-CAN+A-RET+A-SCHEMA | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | cabfc04d46ec965b |
| tg2-F04-P04-W03-e1ac9f6cac52 | A-CAN+A-RET+A-SCHEMA | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | e1ac9f6cac52c6f1 |
| tg2-F04-P04-W04-cb722abc53e5 | A-CAN+A-RET+A-SCHEMA | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | cb722abc53e53ba5 |
| tg2-F04-P05-W01-7049e8405ace | A-CAN+A-RET+A-SCHEMA | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 7049e8405acea2c0 |
| tg2-F04-P05-W02-aabd1bcddd0f | A-CAN+A-RET+A-SCHEMA | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | aabd1bcddd0f503c |
| tg2-F04-P05-W03-1e05127f9f79 | A-CAN+A-RET+A-SCHEMA | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 1e05127f9f79930e |
| tg2-F04-P05-W04-0a8b7806ce2c | A-CAN+A-RET+A-SCHEMA | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 0a8b7806ce2c4ec2 |
| tg2-F04-P06-W01-f4553b578d5b | A-CAN+A-RET+A-SCHEMA | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | f4553b578d5beed3 |
| tg2-F04-P06-W02-244f177e1916 | A-CAN+A-RET+A-SCHEMA | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 244f177e19165fad |
| tg2-F04-P06-W03-428feae4dad3 | A-CAN+A-RET+A-SCHEMA | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 428feae4dad3aa4b |
| tg2-F04-P06-W04-af1ade28a43d | A-CAN+A-RET+A-SCHEMA | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | af1ade28a43ddd63 |
| tg2-F04-P07-W01-ae79bc8ed534 | A-CAN+A-RET+A-SCHEMA | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | ae79bc8ed5346bfe |
| tg2-F04-P07-W02-44d3dec8412f | A-CAN+A-RET+A-SCHEMA | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 44d3dec8412f17ae |
| tg2-F04-P07-W03-ddf5d91fd7a3 | A-CAN+A-RET+A-SCHEMA | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | ddf5d91fd7a30d28 |
| tg2-F04-P07-W04-908c65cdbbf0 | A-CAN+A-RET+A-SCHEMA | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 908c65cdbbf088b0 |
| tg2-F04-P08-W01-7f5156bcc559 | A-CAN+A-RET+A-SCHEMA | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 7f5156bcc5593131 |
| tg2-F04-P08-W02-7def1640da6b | A-CAN+A-RET+A-SCHEMA | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 7def1640da6b8d77 |
| tg2-F04-P08-W03-ac555efd137d | A-CAN+A-RET+A-SCHEMA | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | ac555efd137d6e2d |
| tg2-F04-P08-W04-4e5dbb6b6537 | A-CAN+A-RET+A-SCHEMA | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 4e5dbb6b65371d81 |
| tg2-F04-P09-W01-3147d794b40c | A-CAN+A-RET+A-SCHEMA | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 3147d794b40c0454 |
| tg2-F04-P09-W02-21812092d641 | A-CAN+A-RET+A-SCHEMA | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 21812092d6415378 |
| tg2-F04-P09-W03-e58b2e27ab46 | A-CAN+A-RET+A-SCHEMA | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | e58b2e27ab463dca |
| tg2-F04-P09-W04-85eca1081621 | A-CAN+A-RET+A-SCHEMA | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 85eca1081621c83e |
| tg2-F04-P10-W01-10d5c0235498 | A-CAN+A-RET+A-SCHEMA | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 10d5c023549896ea |
| tg2-F04-P10-W02-88c2cc848084 | A-CAN+A-RET+A-SCHEMA | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 88c2cc848084ab42 |
| tg2-F04-P10-W03-1331f84b86aa | A-CAN+A-RET+A-SCHEMA | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 1331f84b86aaaf1c |
| tg2-F04-P10-W04-f87a66e6eb26 | A-CAN+A-RET+A-SCHEMA | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | f87a66e6eb2683e4 |
| tg2-F04-P11-W01-69b98ed2d046 | A-CAN+A-RET+A-SCHEMA | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 69b98ed2d046e53f |
| tg2-F04-P11-W02-b1c3709462f0 | A-CAN+A-RET+A-SCHEMA | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | b1c3709462f08961 |
| tg2-F04-P11-W03-6befb06df04a | A-CAN+A-RET+A-SCHEMA | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 6befb06df04a7c4f |
| tg2-F04-P11-W04-6a7cb4b088f0 | A-CAN+A-RET+A-SCHEMA | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 6a7cb4b088f06e77 |
| tg2-F04-P12-W01-dfd45bbd196f | A-CAN+A-RET+A-SCHEMA | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | dfd45bbd196fe5cc |
| tg2-F04-P12-W02-54bbdebbf4f2 | A-CAN+A-RET+A-SCHEMA | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 54bbdebbf4f2acd0 |
| tg2-F04-P12-W03-bac53d3dcf8b | A-CAN+A-RET+A-SCHEMA | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | bac53d3dcf8b3f32 |
| tg2-F04-P12-W04-c9d99eb241f9 | A-CAN+A-RET+A-SCHEMA | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | c9d99eb241f9ed26 |
| tg2-F04-P13-W01-6d4ef7994c56 | A-CAN+A-RET+A-SCHEMA | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 6d4ef7994c565049 |
| tg2-F04-P13-W02-4316952c53f1 | A-CAN+A-RET+A-SCHEMA | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 4316952c53f10c4f |
| tg2-F04-P13-W03-261fd4e4fa47 | A-CAN+A-RET+A-SCHEMA | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 261fd4e4fa47d455 |
| tg2-F04-P13-W04-180ed638cd1f | A-CAN+A-RET+A-SCHEMA | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 180ed638cd1fc429 |
| tg2-F04-P14-W01-adbb706b02fb | A-CAN+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | adbb706b02fb7b6e |
| tg2-F04-P14-W02-649afd1bd7f6 | A-CAN+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 649afd1bd7f69f7e |
| tg2-F04-P14-W03-4ed2036f8493 | A-CAN+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 4ed2036f84931d58 |
| tg2-F04-P14-W04-00f9aa0a4a43 | A-CAN+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 00f9aa0a4a43bc80 |
| tg2-F04-P15-W01-eab21abcd107 | A-CAN+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | eab21abcd1076d43 |
| tg2-F04-P15-W02-a434a757d04c | A-CAN+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | a434a757d04cbe3d |
| tg2-F04-P15-W03-578a0041bbab | A-CAN+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 578a0041bbabd3fb |
| tg2-F04-P15-W04-88ff4753bf2c | A-CAN+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 88ff4753bf2c1933 |
| tg2-F04-P16-W01-d8c6760fd1e9 | A-CAN+A-RET+A-SCHEMA | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | d8c6760fd1e91ab0 |
| tg2-F04-P16-W02-238175b12db0 | A-CAN+A-RET+A-SCHEMA | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 238175b12db0bd8c |
| tg2-F04-P16-W03-eb195e0f6043 | A-CAN+A-RET+A-SCHEMA | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | eb195e0f6043effe |
| tg2-F04-P16-W04-2806bcf6083e | A-CAN+A-RET+A-SCHEMA | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F04:predicate | F04.M (tokens,cost,latency,quality) | F04.G (new) | T1 | 2806bcf6083ef112 |
| tg2-F05-P01-W01-1b3ca7a5cc5c | A-CAN+A-RET+A-ROUTE | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 1b3ca7a5cc5c685f |
| tg2-F05-P01-W02-217571aa7af1 | A-CAN+A-RET+A-ROUTE | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 217571aa7af1d281 |
| tg2-F05-P01-W03-a2d1cef20de2 | A-CAN+A-RET+A-ROUTE | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | a2d1cef20de293ef |
| tg2-F05-P01-W04-df154452c5d4 | A-CAN+A-RET+A-ROUTE | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | df154452c5d40f17 |
| tg2-F05-P02-W01-0b602d4d34ef | A-CAN+A-RET+A-ROUTE | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 0b602d4d34efea6c |
| tg2-F05-P02-W02-1149cbddf36f | A-CAN+A-RET+A-ROUTE | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 1149cbddf36fc170 |
| tg2-F05-P02-W03-d86cf665ccaf | A-CAN+A-RET+A-ROUTE | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | d86cf665ccaf1152 |
| tg2-F05-P02-W04-e96eda96c95b | A-CAN+A-RET+A-ROUTE | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | e96eda96c95bca46 |
| tg2-F05-P03-W01-aaaf4354866d | A-CAN+A-RET+A-ROUTE | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | aaaf4354866df3e9 |
| tg2-F05-P03-W02-b54d66a8cfa1 | A-CAN+A-RET+A-ROUTE | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | b54d66a8cfa1ac6f |
| tg2-F05-P03-W03-26b23d7dc8cd | A-CAN+A-RET+A-ROUTE | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 26b23d7dc8cdc5f5 |
| tg2-F05-P03-W04-d2a9cb52326c | A-CAN+A-RET+A-ROUTE | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | d2a9cb52326c38c9 |
| tg2-F05-P04-W01-eb34ea8c5455 | A-CAN+A-RET+A-ROUTE | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | eb34ea8c5455a20e |
| tg2-F05-P04-W02-a91f1a8bf018 | A-CAN+A-RET+A-ROUTE | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | a91f1a8bf018c91e |
| tg2-F05-P04-W03-8ddc30430422 | A-CAN+A-RET+A-ROUTE | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 8ddc304304222978 |
| tg2-F05-P04-W04-fe06ef9e057d | A-CAN+A-RET+A-ROUTE | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | fe06ef9e057df1a0 |
| tg2-F05-P05-W01-23bec75ca897 | A-CAN+A-RET+A-ROUTE | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 23bec75ca8972263 |
| tg2-F05-P05-W02-eec85fd41fc3 | A-CAN+A-RET+A-ROUTE | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | eec85fd41fc3315d |
| tg2-F05-P05-W03-6fea919b2fe8 | A-CAN+A-RET+A-ROUTE | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 6fea919b2fe8c91b |
| tg2-F05-P05-W04-592c86ec4389 | A-CAN+A-RET+A-ROUTE | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 592c86ec43891053 |
| tg2-F05-P06-W01-9f7f5121cc70 | A-CAN+A-RET+A-ROUTE | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 9f7f5121cc7040d0 |
| tg2-F05-P06-W02-823ed5c5adcc | A-CAN+A-RET+A-ROUTE | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 823ed5c5adcc302c |
| tg2-F05-P06-W03-eabcadd3bdd4 | A-CAN+A-RET+A-ROUTE | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | eabcadd3bdd4119e |
| tg2-F05-P06-W04-fee4fc126fa3 | A-CAN+A-RET+A-ROUTE | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | fee4fc126fa3aeb2 |
| tg2-F05-P07-W01-586839079b11 | A-CAN+A-RET+A-ROUTE | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 586839079b11b9dd |
| tg2-F05-P07-W02-d94a6a6362d8 | A-CAN+A-RET+A-ROUTE | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | d94a6a6362d81fcb |
| tg2-F05-P07-W03-549ac5d70bbf | A-CAN+A-RET+A-ROUTE | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 549ac5d70bbfccc1 |
| tg2-F05-P07-W04-20e9f26483ee | A-CAN+A-RET+A-ROUTE | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 20e9f26483eed855 |
| tg2-F05-P08-W01-f46b4053d526 | A-CAN+A-RET+A-ROUTE | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | f46b4053d5263d82 |
| tg2-F05-P08-W02-655c76bfc15c | A-CAN+A-RET+A-ROUTE | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 655c76bfc15cd79a |
| tg2-F05-P08-W03-cfdcc90db929 | A-CAN+A-RET+A-ROUTE | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | cfdcc90db92992a4 |
| tg2-F05-P08-W04-2869df258916 | A-CAN+A-RET+A-ROUTE | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 2869df258916d42c |
| tg2-F05-P09-W01-be0f27702d43 | A-CAN+A-RET+A-ROUTE | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | be0f27702d433097 |
| tg2-F05-P09-W02-35549c24d91a | A-CAN+A-RET+A-ROUTE | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 35549c24d91a3db9 |
| tg2-F05-P09-W03-3ed7f3de2cd6 | A-CAN+A-RET+A-ROUTE | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 3ed7f3de2cd64df7 |
| tg2-F05-P09-W04-f2898f5c76df | A-CAN+A-RET+A-ROUTE | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | f2898f5c76dfdcff |
| tg2-F05-P10-W01-c59341f3957f | A-CAN+A-RET+A-ROUTE | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | c59341f3957f1139 |
| tg2-F05-P10-W02-32f5fe87c06b | A-CAN+A-RET+A-ROUTE | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 32f5fe87c06b03df |
| tg2-F05-P10-W03-1474e078f601 | A-CAN+A-RET+A-ROUTE | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 1474e078f6013985 |
| tg2-F05-P10-W04-71f83086ed9a | A-CAN+A-RET+A-ROUTE | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 71f83086ed9aa379 |
| tg2-F05-P11-W01-dfedf8868883 | A-CAN+A-RET+A-ROUTE | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | dfedf8868883d2bc |
| tg2-F05-P11-W02-c798215e4df5 | A-CAN+A-RET+A-ROUTE | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | c798215e4df5ab20 |
| tg2-F05-P11-W03-40fddd5230e6 | A-CAN+A-RET+A-ROUTE | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 40fddd5230e6ba62 |
| tg2-F05-P11-W04-cfee2f2b1957 | A-CAN+A-RET+A-ROUTE | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | cfee2f2b19573a36 |
| tg2-F05-P12-W01-0250a473a1ab | A-CAN+A-RET+A-ROUTE | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 0250a473a1ab312f |
| tg2-F05-P12-W02-eb55830e16bd | A-CAN+A-RET+A-ROUTE | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | eb55830e16bdc131 |
| tg2-F05-P12-W03-eef5589eea22 | A-CAN+A-RET+A-ROUTE | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | eef5589eea22367f |
| tg2-F05-P12-W04-03c791d62dac | A-CAN+A-RET+A-ROUTE | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 03c791d62dacb107 |
| tg2-F05-P13-W01-c071fb332652 | A-CAN+A-RET+A-ROUTE | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | c071fb332652deda |
| tg2-F05-P13-W02-bcbd776ec1a8 | A-CAN+A-RET+A-ROUTE | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | bcbd776ec1a8b652 |
| tg2-F05-P13-W03-c1ea73532181 | A-CAN+A-RET+A-ROUTE | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | c1ea73532181c08c |
| tg2-F05-P13-W04-757b6a29f83b | A-CAN+A-RET+A-ROUTE | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 757b6a29f83bbef4 |
| tg2-F05-P14-W01-95438b8e4020 | A-CAN+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 95438b8e4020542d |
| tg2-F05-P14-W02-e4cf364e4cc2 | A-CAN+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | e4cf364e4cc260fb |
| tg2-F05-P14-W03-a6b6581b0c95 | A-CAN+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | a6b6581b0c951591 |
| tg2-F05-P14-W04-8bad81d46c94 | A-CAN+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 8bad81d46c940245 |
| tg2-F05-P15-W01-f030289a5fe1 | A-CAN+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | f030289a5fe1bbe0 |
| tg2-F05-P15-W02-beb48b75afcf | A-CAN+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | beb48b75afcfdf5c |
| tg2-F05-P15-W03-e3d8b71b59ec | A-CAN+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | e3d8b71b59ecee2e |
| tg2-F05-P15-W04-9a23716a28af | A-CAN+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 9a23716a28af51e2 |
| tg2-F05-P16-W01-e9f254488c2a | A-CAN+A-RET+A-ROUTE | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | e9f254488c2ac773 |
| tg2-F05-P16-W02-4a12c9df8084 | A-CAN+A-RET+A-ROUTE | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 4a12c9df8084f24d |
| tg2-F05-P16-W03-95ddefd0d257 | A-CAN+A-RET+A-ROUTE | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | 95ddefd0d257756b |
| tg2-F05-P16-W04-ae0054981817 | A-CAN+A-RET+A-ROUTE | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F05:predicate | F05.M (tokens,cost,latency,quality) | F05.G (new) | T2 | ae0054981817bc03 |
| tg2-F06-P01-W01-3ee5d13be0d5 | A-CACHE+A-RET+A-COMP | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 3ee5d13be0d57d24 |
| tg2-F06-P01-W02-6b7a76494ff7 | A-CACHE+A-RET+A-COMP | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 6b7a76494ff78028 |
| tg2-F06-P01-W03-4d907a56b9eb | A-CACHE+A-RET+A-COMP | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 4d907a56b9eb8a1a |
| tg2-F06-P01-W04-c5f69fbab188 | A-CACHE+A-RET+A-COMP | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | c5f69fbab188766e |
| tg2-F06-P02-W01-008ce8524faf | A-CACHE+A-RET+A-COMP | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 008ce8524faf52d7 |
| tg2-F06-P02-W02-63ced3fb1fad | A-CACHE+A-RET+A-COMP | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 63ced3fb1fad8af9 |
| tg2-F06-P02-W03-827f67dbfe12 | A-CACHE+A-RET+A-COMP | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 827f67dbfe128e37 |
| tg2-F06-P02-W04-9273347e68e8 | A-CACHE+A-RET+A-COMP | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 9273347e68e8a43f |
| tg2-F06-P03-W01-78d3a6fb31a7 | A-CACHE+A-RET+A-COMP | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 78d3a6fb31a747c2 |
| tg2-F06-P03-W02-bf086b49583c | A-CACHE+A-RET+A-COMP | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | bf086b49583c07da |
| tg2-F06-P03-W03-f29b9c609857 | A-CACHE+A-RET+A-COMP | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | f29b9c6098578ce4 |
| tg2-F06-P03-W04-d4cbd75ac0d5 | A-CACHE+A-RET+A-COMP | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | d4cbd75ac0d50e6c |
| tg2-F06-P04-W01-72454750fa3c | A-CACHE+A-RET+A-COMP | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 72454750fa3c5975 |
| tg2-F06-P04-W02-4c5b186e4509 | A-CACHE+A-RET+A-COMP | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 4c5b186e4509cee3 |
| tg2-F06-P04-W03-5af663eb5045 | A-CACHE+A-RET+A-COMP | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 5af663eb50453629 |
| tg2-F06-P04-W04-cf6fddb76ef5 | A-CACHE+A-RET+A-COMP | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | cf6fddb76ef513dd |
| tg2-F06-P05-W01-97bd8976910b | A-CACHE+A-RET+A-COMP | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 97bd8976910b8e88 |
| tg2-F06-P05-W02-95fa8d14738e | A-CACHE+A-RET+A-COMP | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 95fa8d14738eae84 |
| tg2-F06-P05-W03-ad917f919796 | A-CACHE+A-RET+A-COMP | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | ad917f919796d946 |
| tg2-F06-P05-W04-bea09f446dc5 | A-CACHE+A-RET+A-COMP | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | bea09f446dc508ba |
| tg2-F06-P06-W01-45925f8d5719 | A-CACHE+A-RET+A-COMP | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 45925f8d5719315b |
| tg2-F06-P06-W02-6d00505b3c14 | A-CACHE+A-RET+A-COMP | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 6d00505b3c1453f5 |
| tg2-F06-P06-W03-c8264e7b000a | A-CACHE+A-RET+A-COMP | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | c8264e7b000a9203 |
| tg2-F06-P06-W04-df07b4e1c24b | A-CACHE+A-RET+A-COMP | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | df07b4e1c24b691b |
| tg2-F06-P07-W01-8742b861494d | A-CACHE+A-RET+A-COMP | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 8742b861494da606 |
| tg2-F06-P07-W02-057c296060a6 | A-CACHE+A-RET+A-COMP | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 057c296060a6c376 |
| tg2-F06-P07-W03-2060c1b5da6f | A-CACHE+A-RET+A-COMP | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 2060c1b5da6f8d60 |
| tg2-F06-P07-W04-703f42043187 | A-CACHE+A-RET+A-COMP | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 703f420431878c88 |
| tg2-F06-P08-W01-16c0166632b2 | A-CACHE+A-RET+A-COMP | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 16c0166632b23729 |
| tg2-F06-P08-W02-125c7dc88bc4 | A-CACHE+A-RET+A-COMP | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 125c7dc88bc4e7af |
| tg2-F06-P08-W03-78dbc3d273cf | A-CACHE+A-RET+A-COMP | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 78dbc3d273cf3735 |
| tg2-F06-P08-W04-8f1d93808064 | A-CACHE+A-RET+A-COMP | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 8f1d93808064b609 |
| tg2-F06-P09-W01-f80c5f6f291f | A-CACHE+A-RET+A-COMP | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | f80c5f6f291f2fac |
| tg2-F06-P09-W02-8d88224b8b37 | A-CACHE+A-RET+A-COMP | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 8d88224b8b3787b0 |
| tg2-F06-P09-W03-a3abf6eabb7c | A-CACHE+A-RET+A-COMP | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | a3abf6eabb7c1a92 |
| tg2-F06-P09-W04-2813b324d91a | A-CACHE+A-RET+A-COMP | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 2813b324d91a7686 |
| tg2-F06-P10-W01-b586f9281743 | A-CACHE+A-RET+A-COMP | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | b586f92817432b72 |
| tg2-F06-P10-W02-914ed2497111 | A-CACHE+A-RET+A-COMP | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 914ed2497111aaea |
| tg2-F06-P10-W03-e6f30c3563be | A-CACHE+A-RET+A-COMP | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | e6f30c3563bede54 |
| tg2-F06-P10-W04-2a33def63483 | A-CACHE+A-RET+A-COMP | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 2a33def634839b7c |
| tg2-F06-P11-W01-1fdec26157f6 | A-CACHE+A-RET+A-COMP | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 1fdec26157f61a87 |
| tg2-F06-P11-W02-9d8340b9ce4c | A-CACHE+A-RET+A-COMP | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 9d8340b9ce4c3609 |
| tg2-F06-P11-W03-733ee3095fc3 | A-CACHE+A-RET+A-COMP | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 733ee3095fc388e7 |
| tg2-F06-P11-W04-07280c5993b1 | A-CACHE+A-RET+A-COMP | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 07280c5993b1c1cf |
| tg2-F06-P12-W01-ddfbe1e4692a | A-CACHE+A-RET+A-COMP | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | ddfbe1e4692ac054 |
| tg2-F06-P12-W02-9b9c6b566771 | A-CACHE+A-RET+A-COMP | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 9b9c6b566771a778 |
| tg2-F06-P12-W03-511e10c5c955 | A-CACHE+A-RET+A-COMP | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 511e10c5c955d1ca |
| tg2-F06-P12-W04-1a962678d95b | A-CACHE+A-RET+A-COMP | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 1a962678d95b3c3e |
| tg2-F06-P13-W01-2c05610c7a77 | A-CACHE+A-RET+A-COMP | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 2c05610c7a77ed31 |
| tg2-F06-P13-W02-f80a61046b9b | A-CACHE+A-RET+A-COMP | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | f80a61046b9be177 |
| tg2-F06-P13-W03-17e8419b318d | A-CACHE+A-RET+A-COMP | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 17e8419b318d022d |
| tg2-F06-P13-W04-e30740dc2870 | A-CACHE+A-RET+A-COMP | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | e30740dc28709181 |
| tg2-F06-P14-W01-4c1781c560b3 | A-CACHE+A-RET+A-COMP | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 4c1781c560b3f276 |
| tg2-F06-P14-W02-485d227bd70c | A-CACHE+A-RET+A-COMP | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 485d227bd70c0506 |
| tg2-F06-P14-W03-653119fca369 | A-CACHE+A-RET+A-COMP | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 653119fca3692cd0 |
| tg2-F06-P14-W04-2bd50be9bf11 | A-CACHE+A-RET+A-COMP | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 2bd50be9bf11c858 |
| tg2-F06-P15-W01-3bef4aadb121 | A-CACHE+A-RET+A-COMP | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 3bef4aadb121df0b |
| tg2-F06-P15-W02-8905b7b865ee | A-CACHE+A-RET+A-COMP | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 8905b7b865eec2c5 |
| tg2-F06-P15-W03-94a7da981610 | A-CACHE+A-RET+A-COMP | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 94a7da981610a2b3 |
| tg2-F06-P15-W04-f0a4c552e6df | A-CACHE+A-RET+A-COMP | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | f0a4c552e6df8ceb |
| tg2-F06-P16-W01-089488682ac0 | A-CACHE+A-RET+A-COMP | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 089488682ac0fa38 |
| tg2-F06-P16-W02-6c2ad55d3fde | A-CACHE+A-RET+A-COMP | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 6c2ad55d3fdec094 |
| tg2-F06-P16-W03-e1add84ceada | A-CACHE+A-RET+A-COMP | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | e1add84ceadac7f6 |
| tg2-F06-P16-W04-5d650e67554d | A-CACHE+A-RET+A-COMP | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F06:predicate | F06.M (tokens,cost,latency,quality) | F06.G (new) | T2 | 5d650e67554dd98a |
| tg2-F07-P01-W01-8c8443655dc6 | A-CACHE+A-RET+A-SUM | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 8c8443655dc664f7 |
| tg2-F07-P01-W02-c2b28ed8dbfd | A-CACHE+A-RET+A-SUM | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | c2b28ed8dbfd3919 |
| tg2-F07-P01-W03-a0cdb3207b7e | A-CACHE+A-RET+A-SUM | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | a0cdb3207b7e4d57 |
| tg2-F07-P01-W04-37232227bec3 | A-CACHE+A-RET+A-SUM | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 37232227bec3a35f |
| tg2-F07-P02-W01-481b039be149 | A-CACHE+A-RET+A-SUM | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 481b039be1492ec4 |
| tg2-F07-P02-W02-044b7a3a09bd | A-CACHE+A-RET+A-SUM | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 044b7a3a09bd4dc8 |
| tg2-F07-P02-W03-971bbc465401 | A-CACHE+A-RET+A-SUM | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 971bbc4654016d3a |
| tg2-F07-P02-W04-c01a725fd02f | A-CACHE+A-RET+A-SUM | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | c01a725fd02fe68e |
| tg2-F07-P03-W01-f9d94ed151fc | A-CACHE+A-RET+A-SUM | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | f9d94ed151fc7e61 |
| tg2-F07-P03-W02-31fb03b47d8a | A-CACHE+A-RET+A-SUM | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 31fb03b47d8a5dc7 |
| tg2-F07-P03-W03-84b5047c496b | A-CACHE+A-RET+A-SUM | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 84b5047c496b949d |
| tg2-F07-P03-W04-25bc61a5beda | A-CACHE+A-RET+A-SUM | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 25bc61a5beda5711 |
| tg2-F07-P04-W01-0122a3515fb0 | A-CACHE+A-RET+A-SUM | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 0122a3515fb0b226 |
| tg2-F07-P04-W02-13318f90be14 | A-CACHE+A-RET+A-SUM | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 13318f90be149f16 |
| tg2-F07-P04-W03-2f0b89f20385 | A-CACHE+A-RET+A-SUM | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 2f0b89f20385eb00 |
| tg2-F07-P04-W04-2e42a75dbe23 | A-CACHE+A-RET+A-SUM | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 2e42a75dbe2354a8 |
| tg2-F07-P05-W01-4829537e64a3 | A-CACHE+A-RET+A-SUM | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 4829537e64a31dfb |
| tg2-F07-P05-W02-b4daa6dabf7a | A-CACHE+A-RET+A-SUM | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b4daa6dabf7a4d15 |
| tg2-F07-P05-W03-7ed568e6a563 | A-CACHE+A-RET+A-SUM | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 7ed568e6a563f2a3 |
| tg2-F07-P05-W04-b9af1523feb8 | A-CACHE+A-RET+A-SUM | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b9af1523feb86e3b |
| tg2-F07-P06-W01-b702bc6c37b3 | A-CACHE+A-RET+A-SUM | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b702bc6c37b3a728 |
| tg2-F07-P06-W02-1091050f29b7 | A-CACHE+A-RET+A-SUM | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 1091050f29b73ca4 |
| tg2-F07-P06-W03-85c193e1ef6d | A-CACHE+A-RET+A-SUM | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 85c193e1ef6d2ce6 |
| tg2-F07-P06-W04-98c56cad05b0 | A-CACHE+A-RET+A-SUM | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 98c56cad05b01d5a |
| tg2-F07-P07-W01-1f87dbf73ace | A-CACHE+A-RET+A-SUM | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 1f87dbf73acea495 |
| tg2-F07-P07-W02-657cf9615b7d | A-CACHE+A-RET+A-SUM | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 657cf9615b7d2e83 |
| tg2-F07-P07-W03-64fa9918c830 | A-CACHE+A-RET+A-SUM | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 64fa9918c83087c9 |
| tg2-F07-P07-W04-b59c139ac2e8 | A-CACHE+A-RET+A-SUM | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b59c139ac2e8887d |
| tg2-F07-P08-W01-4dc8c94d5e26 | A-CACHE+A-RET+A-SUM | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 4dc8c94d5e26466a |
| tg2-F07-P08-W02-2bc958e5b3bd | A-CACHE+A-RET+A-SUM | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 2bc958e5b3bd7dc2 |
| tg2-F07-P08-W03-c8882271d8ef | A-CACHE+A-RET+A-SUM | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | c8882271d8efe99c |
| tg2-F07-P08-W04-1722795526e7 | A-CACHE+A-RET+A-SUM | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 1722795526e7ba64 |
| tg2-F07-P09-W01-a6ac97fcd9d4 | A-CACHE+A-RET+A-SUM | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | a6ac97fcd9d494bf |
| tg2-F07-P09-W02-54c9fcf59629 | A-CACHE+A-RET+A-SUM | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 54c9fcf596295be1 |
| tg2-F07-P09-W03-2145da94428f | A-CACHE+A-RET+A-SUM | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 2145da94428fb6cf |
| tg2-F07-P09-W04-8924c71ec4b1 | A-CACHE+A-RET+A-SUM | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 8924c71ec4b1a4f7 |
| tg2-F07-P10-W01-bc445fe6cee6 | A-CACHE+A-RET+A-SUM | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | bc445fe6cee6e0b1 |
| tg2-F07-P10-W02-20f5a2a20da4 | A-CACHE+A-RET+A-SUM | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 20f5a2a20da45ff7 |
| tg2-F07-P10-W03-61ab892365c2 | A-CACHE+A-RET+A-SUM | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 61ab892365c2a8ad |
| tg2-F07-P10-W04-6d05cdd9a0f8 | A-CACHE+A-RET+A-SUM | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 6d05cdd9a0f85401 |
| tg2-F07-P11-W01-6e3ae0bebd99 | A-CACHE+A-RET+A-SUM | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 6e3ae0bebd99b3d4 |
| tg2-F07-P11-W02-c487acf4097a | A-CACHE+A-RET+A-SUM | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | c487acf4097a25f8 |
| tg2-F07-P11-W03-9ae1584dfd8b | A-CACHE+A-RET+A-SUM | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 9ae1584dfd8b784a |
| tg2-F07-P11-W04-a494b37651e2 | A-CACHE+A-RET+A-SUM | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | a494b37651e2febe |
| tg2-F07-P12-W01-b01dc13bac65 | A-CACHE+A-RET+A-SUM | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b01dc13bac650e07 |
| tg2-F07-P12-W02-c66e82577054 | A-CACHE+A-RET+A-SUM | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | c66e82577054b489 |
| tg2-F07-P12-W03-bd022a9193f9 | A-CACHE+A-RET+A-SUM | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | bd022a9193f92f67 |
| tg2-F07-P12-W04-912699570c39 | A-CACHE+A-RET+A-SUM | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 912699570c39844f |
| tg2-F07-P13-W01-45c5f8026bb2 | A-CACHE+A-RET+A-SUM | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 45c5f8026bb21ef2 |
| tg2-F07-P13-W02-ba3a13e7131a | A-CACHE+A-RET+A-SUM | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | ba3a13e7131a296a |
| tg2-F07-P13-W03-30b653bd97f4 | A-CACHE+A-RET+A-SUM | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 30b653bd97f484d4 |
| tg2-F07-P13-W04-b4326bf3ad0b | A-CACHE+A-RET+A-SUM | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b4326bf3ad0b5dfc |
| tg2-F07-P14-W01-f6c3a68bc9c6 | A-CACHE+A-RET+A-SUM | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | f6c3a68bc9c69da5 |
| tg2-F07-P14-W02-614ea6c1ab78 | A-CACHE+A-RET+A-SUM | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 614ea6c1ab780973 |
| tg2-F07-P14-W03-81b6351135b7 | A-CACHE+A-RET+A-SUM | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 81b6351135b762d9 |
| tg2-F07-P14-W04-ca1bddb9f312 | A-CACHE+A-RET+A-SUM | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | ca1bddb9f312dc2d |
| tg2-F07-P15-W01-98d387427f2f | A-CACHE+A-RET+A-SUM | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 98d387427f2fedb8 |
| tg2-F07-P15-W02-951616fae1e7 | A-CACHE+A-RET+A-SUM | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 951616fae1e73f14 |
| tg2-F07-P15-W03-2b711fd51f10 | A-CACHE+A-RET+A-SUM | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 2b711fd51f106e76 |
| tg2-F07-P15-W04-e7639b64cdd5 | A-CACHE+A-RET+A-SUM | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | e7639b64cdd59c0a |
| tg2-F07-P16-W01-cc2e49880590 | A-CACHE+A-RET+A-SUM | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | cc2e49880590d28b |
| tg2-F07-P16-W02-b1f0f95607f7 | A-CACHE+A-RET+A-SUM | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | b1f0f95607f74145 |
| tg2-F07-P16-W03-de6b22204a46 | A-CACHE+A-RET+A-SUM | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | de6b22204a464933 |
| tg2-F07-P16-W04-7aa352505f67 | A-CACHE+A-RET+A-SUM | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F07:predicate | F07.M (tokens,cost,latency,quality) | F07.G (new) | T2 | 7aa352505f674f6b |
| tg2-F08-P01-W01-70e29d73ef0f | A-CACHE+A-SCHEMA+A-TOOLS | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 70e29d73ef0fb84e |
| tg2-F08-P01-W02-121145bab4b6 | A-CACHE+A-SCHEMA+A-TOOLS | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 121145bab4b6645e |
| tg2-F08-P01-W03-7a87c14f9139 | A-CACHE+A-SCHEMA+A-TOOLS | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 7a87c14f913985b8 |
| tg2-F08-P01-W04-ee4d9768e9e5 | A-CACHE+A-SCHEMA+A-TOOLS | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | ee4d9768e9e5a7e0 |
| tg2-F08-P02-W01-3f3f2b9b77ec | A-CACHE+A-SCHEMA+A-TOOLS | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 3f3f2b9b77ec761d |
| tg2-F08-P02-W02-9fad08d39ac4 | A-CACHE+A-SCHEMA+A-TOOLS | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 9fad08d39ac4dc0b |
| tg2-F08-P02-W03-1379049ffd28 | A-CACHE+A-SCHEMA+A-TOOLS | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 1379049ffd288b01 |
| tg2-F08-P02-W04-fc1c6029360d | A-CACHE+A-SCHEMA+A-TOOLS | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | fc1c6029360df895 |
| tg2-F08-P03-W01-51a4aa8a0eec | A-CACHE+A-SCHEMA+A-TOOLS | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 51a4aa8a0eecd110 |
| tg2-F08-P03-W02-a30090d28430 | A-CACHE+A-SCHEMA+A-TOOLS | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | a30090d28430e16c |
| tg2-F08-P03-W03-272093d9e45d | A-CACHE+A-SCHEMA+A-TOOLS | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 272093d9e45dd8de |
| tg2-F08-P03-W04-9ed09c1f01d3 | A-CACHE+A-SCHEMA+A-TOOLS | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 9ed09c1f01d362f2 |
| tg2-F08-P04-W01-efa648238712 | A-CACHE+A-SCHEMA+A-TOOLS | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | efa648238712cf9f |
| tg2-F08-P04-W02-b5891ab56cde | A-CACHE+A-SCHEMA+A-TOOLS | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | b5891ab56cde4dc1 |
| tg2-F08-P04-W03-d3c824969ebd | A-CACHE+A-SCHEMA+A-TOOLS | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | d3c824969ebd162f |
| tg2-F08-P04-W04-3734ebbe386c | A-CACHE+A-SCHEMA+A-TOOLS | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 3734ebbe386ca257 |
| tg2-F08-P05-W01-4c8beb7023f6 | A-CACHE+A-SCHEMA+A-TOOLS | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 4c8beb7023f65cca |
| tg2-F08-P05-W02-d5dfc31f49eb | A-CACHE+A-SCHEMA+A-TOOLS | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | d5dfc31f49eb75a2 |
| tg2-F08-P05-W03-31992abed12f | A-CACHE+A-SCHEMA+A-TOOLS | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 31992abed12f71fc |
| tg2-F08-P05-W04-59316ae5ed0d | A-CACHE+A-SCHEMA+A-TOOLS | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 59316ae5ed0da8c4 |
| tg2-F08-P06-W01-6d8459d90f16 | A-CACHE+A-SCHEMA+A-TOOLS | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 6d8459d90f160129 |
| tg2-F08-P06-W02-c3fc6538a048 | A-CACHE+A-SCHEMA+A-TOOLS | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | c3fc6538a048f5af |
| tg2-F08-P06-W03-1d053569f2e3 | A-CACHE+A-SCHEMA+A-TOOLS | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 1d053569f2e32535 |
| tg2-F08-P06-W04-62662facfdf4 | A-CACHE+A-SCHEMA+A-TOOLS | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 62662facfdf4f409 |
| tg2-F08-P07-W01-4ed0a2e20582 | A-CACHE+A-SCHEMA+A-TOOLS | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 4ed0a2e20582f9ac |
| tg2-F08-P07-W02-3f2809bb9fbb | A-CACHE+A-SCHEMA+A-TOOLS | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 3f2809bb9fbb95b0 |
| tg2-F08-P07-W03-47d568823a90 | A-CACHE+A-SCHEMA+A-TOOLS | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 47d568823a900892 |
| tg2-F08-P07-W04-fb5c4f5156aa | A-CACHE+A-SCHEMA+A-TOOLS | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | fb5c4f5156aab486 |
| tg2-F08-P08-W01-9c56a300337c | A-CACHE+A-SCHEMA+A-TOOLS | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 9c56a300337cfb5b |
| tg2-F08-P08-W02-1ea037cb5098 | A-CACHE+A-SCHEMA+A-TOOLS | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 1ea037cb509861f5 |
| tg2-F08-P08-W03-6c4fc0127f1e | A-CACHE+A-SCHEMA+A-TOOLS | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 6c4fc0127f1e8003 |
| tg2-F08-P08-W04-b250510e3fdb | A-CACHE+A-SCHEMA+A-TOOLS | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | b250510e3fdba71b |
| tg2-F08-P09-W01-de06fbd425b1 | A-CACHE+A-SCHEMA+A-TOOLS | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | de06fbd425b17006 |
| tg2-F08-P09-W02-b71c10d0752a | A-CACHE+A-SCHEMA+A-TOOLS | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | b71c10d0752ad176 |
| tg2-F08-P09-W03-c48a334d5983 | A-CACHE+A-SCHEMA+A-TOOLS | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | c48a334d59837b60 |
| tg2-F08-P09-W04-4387de30af17 | A-CACHE+A-SCHEMA+A-TOOLS | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 4387de30af17ca88 |
| tg2-F08-P10-W01-3da0eb29d489 | A-CACHE+A-SCHEMA+A-TOOLS | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 3da0eb29d4896864 |
| tg2-F08-P10-W02-0da8765c56f7 | A-CACHE+A-SCHEMA+A-TOOLS | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 0da8765c56f71e68 |
| tg2-F08-P10-W03-dac31b9e3631 | A-CACHE+A-SCHEMA+A-TOOLS | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | dac31b9e36312c5a |
| tg2-F08-P10-W04-c31c07422b69 | A-CACHE+A-SCHEMA+A-TOOLS | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | c31c07422b699bae |
| tg2-F08-P11-W01-b2706ca2bc3e | A-CACHE+A-SCHEMA+A-TOOLS | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | b2706ca2bc3e8401 |
| tg2-F08-P11-W02-2f54b9d58535 | A-CACHE+A-SCHEMA+A-TOOLS | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 2f54b9d58535abe7 |
| tg2-F08-P11-W03-9e79b48e104a | A-CACHE+A-SCHEMA+A-TOOLS | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 9e79b48e104a41bd |
| tg2-F08-P11-W04-46ef9d999fa0 | A-CACHE+A-SCHEMA+A-TOOLS | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 46ef9d999fa0cb31 |
| tg2-F08-P12-W01-54d60d5d9396 | A-CACHE+A-SCHEMA+A-TOOLS | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 54d60d5d93966902 |
| tg2-F08-P12-W02-d5461c4bd793 | A-CACHE+A-SCHEMA+A-TOOLS | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | d5461c4bd7933e1a |
| tg2-F08-P12-W03-f5ce816879bf | A-CACHE+A-SCHEMA+A-TOOLS | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | f5ce816879bfa124 |
| tg2-F08-P12-W04-6e0fc6b421b0 | A-CACHE+A-SCHEMA+A-TOOLS | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 6e0fc6b421b0beac |
| tg2-F08-P13-W01-1e79f479ebb3 | A-CACHE+A-SCHEMA+A-TOOLS | P13:CO-COMMAND | W01/chat/I01/V01 | conditional | P13:CO-COMMAND;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 1e79f479ebb35c17 |
| tg2-F08-P13-W02-a53e41b0ef50 | A-CACHE+A-SCHEMA+A-TOOLS | P13:CO-COMMAND | W02/rag/I02/V03 | conditional | P13:CO-COMMAND;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | a53e41b0ef50a439 |
| tg2-F08-P13-W03-64c9ac38ed6c | A-CACHE+A-SCHEMA+A-TOOLS | P13:CO-COMMAND | W03/extract/I03/V02 | conditional | P13:CO-COMMAND;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 64c9ac38ed6c5c77 |
| tg2-F08-P13-W04-382f76eb0f79 | A-CACHE+A-SCHEMA+A-TOOLS | P13:CO-COMMAND | W04/agent/I04/V04 | conditional | P13:CO-COMMAND;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 382f76eb0f79c77f |
| tg2-F08-P14-W01-ccb1f71dac59 | A-CACHE+A-SCHEMA+A-TOOLS | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | ccb1f71dac59aac8 |
| tg2-F08-P14-W02-cee7054e67cc | A-CACHE+A-SCHEMA+A-TOOLS | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | cee7054e67cca7c4 |
| tg2-F08-P14-W03-8176c6377ea7 | A-CACHE+A-SCHEMA+A-TOOLS | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 8176c6377ea74386 |
| tg2-F08-P14-W04-91cfa1afd7cf | A-CACHE+A-SCHEMA+A-TOOLS | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 91cfa1afd7cf7bfa |
| tg2-F08-P15-W01-25b85e69fa0b | A-CACHE+A-SCHEMA+A-TOOLS | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 25b85e69fa0bceb5 |
| tg2-F08-P15-W02-98c2684b8281 | A-CACHE+A-SCHEMA+A-TOOLS | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | 98c2684b82810b23 |
| tg2-F08-P15-W03-bb53e07c26de | A-CACHE+A-SCHEMA+A-TOOLS | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | bb53e07c26de5169 |
| tg2-F08-P15-W04-b014ea2a00c7 | A-CACHE+A-SCHEMA+A-TOOLS | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new) | T1 | b014ea2a00c7ea1d |
| tg2-F08-P16-W01-8bba4fe4696d | A-CACHE+A-SCHEMA+A-TOOLS | P16:BR-MIXED | W01/chat/I01/V01 | conditional | P16:BR-MIXED;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 8bba4fe4696df746 |
| tg2-F08-P16-W02-1cc29d82807a | A-CACHE+A-SCHEMA+A-TOOLS | P16:BR-MIXED | W02/rag/I02/V03 | conditional | P16:BR-MIXED;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 1cc29d82807aceb6 |
| tg2-F08-P16-W03-5247eb52595d | A-CACHE+A-SCHEMA+A-TOOLS | P16:BR-MIXED | W03/extract/I03/V02 | conditional | P16:BR-MIXED;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 5247eb52595d54a0 |
| tg2-F08-P16-W04-8154c9b8d8c3 | A-CACHE+A-SCHEMA+A-TOOLS | P16:BR-MIXED | W04/agent/I04/V04 | conditional | P16:BR-MIXED;F08:predicate | F08.M (tokens,cost,latency,quality) | F08.G (new-if-capability-captured) | T1 | 8154c9b8d8c300c8 |
| tg2-F09-P01-W01-b86cda33b2a2 | A-CACHE+A-TOOLS+A-RETRY | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | b86cda33b2a2b12a |
| tg2-F09-P01-W02-f199d5d09742 | A-CACHE+A-TOOLS+A-RETRY | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | f199d5d097423682 |
| tg2-F09-P01-W03-73caecdf5a69 | A-CACHE+A-TOOLS+A-RETRY | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 73caecdf5a69355c |
| tg2-F09-P01-W04-e7697387945d | A-CACHE+A-TOOLS+A-RETRY | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | e7697387945dc624 |
| tg2-F09-P02-W01-26a4853ed044 | A-CACHE+A-TOOLS+A-RETRY | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 26a4853ed044b989 |
| tg2-F09-P02-W02-bdf3afb754ab | A-CACHE+A-TOOLS+A-RETRY | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | bdf3afb754ab938f |
| tg2-F09-P02-W03-e673e93f419f | A-CACHE+A-TOOLS+A-RETRY | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | e673e93f419f9e95 |
| tg2-F09-P02-W04-645c7b7ad058 | A-CACHE+A-TOOLS+A-RETRY | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 645c7b7ad058d169 |
| tg2-F09-P03-W01-31ed93907a84 | A-CACHE+A-TOOLS+A-RETRY | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 31ed93907a84950c |
| tg2-F09-P03-W02-186c404e72c2 | A-CACHE+A-TOOLS+A-RETRY | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 186c404e72c22d10 |
| tg2-F09-P03-W03-183d7337ef81 | A-CACHE+A-TOOLS+A-RETRY | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 183d7337ef81a172 |
| tg2-F09-P03-W04-b96c7f665553 | A-CACHE+A-TOOLS+A-RETRY | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | b96c7f665553e266 |
| tg2-F09-P04-W01-c6f96391b2ab | A-CACHE+A-TOOLS+A-RETRY | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | c6f96391b2ab2183 |
| tg2-F09-P04-W02-043f29034534 | A-CACHE+A-TOOLS+A-RETRY | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 043f29034534347d |
| tg2-F09-P04-W03-587d1e7ea582 | A-CACHE+A-TOOLS+A-RETRY | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 587d1e7ea582603b |
| tg2-F09-P04-W04-518b089c654c | A-CACHE+A-TOOLS+A-RETRY | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 518b089c654c9273 |
| tg2-F09-P05-W01-2b9ee2850ea4 | A-CACHE+A-TOOLS+A-RETRY | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 2b9ee2850ea432ae |
| tg2-F09-P05-W02-bbf720f1d557 | A-CACHE+A-TOOLS+A-RETRY | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | bbf720f1d5574ebe |
| tg2-F09-P05-W03-5c736ae6c8f9 | A-CACHE+A-TOOLS+A-RETRY | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 5c736ae6c8f9a298 |
| tg2-F09-P05-W04-e516c5c45239 | A-CACHE+A-TOOLS+A-RETRY | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | e516c5c45239dac0 |
| tg2-F09-P06-W01-78acb802049b | A-CACHE+A-TOOLS+A-RETRY | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 78acb802049b2ffd |
| tg2-F09-P06-W02-8b6e75331084 | A-CACHE+A-TOOLS+A-RETRY | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 8b6e75331084e3eb |
| tg2-F09-P06-W03-6d0f8de06e3a | A-CACHE+A-TOOLS+A-RETRY | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 6d0f8de06e3acfe1 |
| tg2-F09-P06-W04-7e17f511c613 | A-CACHE+A-TOOLS+A-RETRY | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 7e17f511c61365f5 |
| tg2-F09-P07-W01-4c560329f214 | A-CACHE+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 4c560329f21401f0 |
| tg2-F09-P07-W02-e841aca68a24 | A-CACHE+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | e841aca68a2414cc |
| tg2-F09-P07-W03-4cd687c07688 | A-CACHE+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 4cd687c07688863e |
| tg2-F09-P07-W04-98cbed6bbb51 | A-CACHE+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 98cbed6bbb51f552 |
| tg2-F09-P08-W01-5635192b08d5 | A-CACHE+A-TOOLS+A-RETRY | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 5635192b08d5a7b7 |
| tg2-F09-P08-W02-99a5f410cf64 | A-CACHE+A-TOOLS+A-RETRY | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 99a5f410cf64e9d9 |
| tg2-F09-P08-W03-7371fd4c5e2c | A-CACHE+A-TOOLS+A-RETRY | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 7371fd4c5e2c6417 |
| tg2-F09-P08-W04-6cde81be15d8 | A-CACHE+A-TOOLS+A-RETRY | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 6cde81be15d88e1f |
| tg2-F09-P09-W01-25beaf4490e0 | A-CACHE+A-TOOLS+A-RETRY | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 25beaf4490e04aa2 |
| tg2-F09-P09-W02-dd44e8bd1d75 | A-CACHE+A-TOOLS+A-RETRY | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | dd44e8bd1d75b63a |
| tg2-F09-P09-W03-21516a5dbf17 | A-CACHE+A-TOOLS+A-RETRY | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 21516a5dbf1781c4 |
| tg2-F09-P09-W04-14b60103891e | A-CACHE+A-TOOLS+A-RETRY | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 14b60103891e0d4c |
| tg2-F09-P10-W01-8d4d0b6e921d | A-CACHE+A-TOOLS+A-RETRY | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 8d4d0b6e921d58a0 |
| tg2-F09-P10-W02-dc612543eadb | A-CACHE+A-TOOLS+A-RETRY | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | dc612543eadb701c |
| tg2-F09-P10-W03-bea57baecc9f | A-CACHE+A-TOOLS+A-RETRY | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | bea57baecc9fddee |
| tg2-F09-P10-W04-ce099dd13c19 | A-CACHE+A-TOOLS+A-RETRY | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | ce099dd13c1903a2 |
| tg2-F09-P11-W01-312c91eb3b5d | A-CACHE+A-TOOLS+A-RETRY | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 312c91eb3b5d10ed |
| tg2-F09-P11-W02-c70f49365ee9 | A-CACHE+A-TOOLS+A-RETRY | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | c70f49365ee933bb |
| tg2-F09-P11-W03-0e8c2b97afbe | A-CACHE+A-TOOLS+A-RETRY | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 0e8c2b97afbe3b51 |
| tg2-F09-P11-W04-8c2c0008a05a | A-CACHE+A-TOOLS+A-RETRY | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 8c2c0008a05a4905 |
| tg2-F09-P12-W01-15c315b065d6 | A-CACHE+A-TOOLS+A-RETRY | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 15c315b065d666de |
| tg2-F09-P12-W02-e5cb3674cf90 | A-CACHE+A-TOOLS+A-RETRY | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | e5cb3674cf90ef0e |
| tg2-F09-P12-W03-3cacc412f268 | A-CACHE+A-TOOLS+A-RETRY | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 3cacc412f2684988 |
| tg2-F09-P12-W04-f513af8335d2 | A-CACHE+A-TOOLS+A-RETRY | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | f513af8335d22210 |
| tg2-F09-P13-W01-aa6d5fa099a5 | A-CACHE+A-TOOLS+A-RETRY | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | aa6d5fa099a54933 |
| tg2-F09-P13-W02-9458268432aa | A-CACHE+A-TOOLS+A-RETRY | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 9458268432aa650d |
| tg2-F09-P13-W03-7b9131020f36 | A-CACHE+A-TOOLS+A-RETRY | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 7b9131020f36352b |
| tg2-F09-P13-W04-6cc1282861d1 | A-CACHE+A-TOOLS+A-RETRY | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 6cc1282861d162c3 |
| tg2-F09-P14-W01-74cbd1e259d3 | A-CACHE+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 74cbd1e259d34b7c |
| tg2-F09-P14-W02-4e643d433c89 | A-CACHE+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 4e643d433c8988e0 |
| tg2-F09-P14-W03-5ea5f8b0bd7b | A-CACHE+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 5ea5f8b0bd7bda22 |
| tg2-F09-P14-W04-2962d7725bb3 | A-CACHE+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 2962d7725bb3edf6 |
| tg2-F09-P15-W01-a5a0133a8ad4 | A-CACHE+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | a5a0133a8ad4c5f9 |
| tg2-F09-P15-W02-0736e0a2b7c8 | A-CACHE+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 0736e0a2b7c82a9f |
| tg2-F09-P15-W03-9c50da3592ce | A-CACHE+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 9c50da3592ceac45 |
| tg2-F09-P15-W04-05d2a6ac7f81 | A-CACHE+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 05d2a6ac7f816739 |
| tg2-F09-P16-W01-a0674887feef | A-CACHE+A-TOOLS+A-RETRY | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | a0674887feeffa9a |
| tg2-F09-P16-W02-a8ea15d675c9 | A-CACHE+A-TOOLS+A-RETRY | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | a8ea15d675c9d412 |
| tg2-F09-P16-W03-7e031664d0c9 | A-CACHE+A-TOOLS+A-RETRY | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 7e031664d0c90f4c |
| tg2-F09-P16-W04-13b6752b4034 | A-CACHE+A-TOOLS+A-RETRY | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F09:predicate | F09.M (tokens,cost,latency,quality) | F09.G (new) | T2 | 13b6752b40348fb4 |
| tg2-F10-P01-W01-2d8fee32f62d | A-COMP+A-RET+A-ROUTE | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 2d8fee32f62dee42 |
| tg2-F10-P01-W02-26ab932ca2d6 | A-COMP+A-RET+A-ROUTE | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 26ab932ca2d6875a |
| tg2-F10-P01-W03-39ec73b8b4fb | A-COMP+A-RET+A-ROUTE | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 39ec73b8b4fbc464 |
| tg2-F10-P01-W04-775f5b1db1a1 | A-COMP+A-RET+A-ROUTE | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 775f5b1db1a1f9ec |
| tg2-F10-P02-W01-ddc872125296 | A-COMP+A-RET+A-ROUTE | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | ddc8721252961941 |
| tg2-F10-P02-W02-49939c1e5a5f | A-COMP+A-RET+A-ROUTE | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 49939c1e5a5f3827 |
| tg2-F10-P02-W03-808349902d03 | A-COMP+A-RET+A-ROUTE | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 808349902d037bfd |
| tg2-F10-P02-W04-b35070bf8945 | A-COMP+A-RET+A-ROUTE | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | b35070bf8945b871 |
| tg2-F10-P03-W01-f3a21873a55c | A-COMP+A-RET+A-ROUTE | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | f3a21873a55c23a4 |
| tg2-F10-P03-W02-d31d9e2c9a91 | A-COMP+A-RET+A-ROUTE | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | d31d9e2c9a91ffa8 |
| tg2-F10-P03-W03-94e151aed68f | A-COMP+A-RET+A-ROUTE | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 94e151aed68fc19a |
| tg2-F10-P03-W04-688a237da255 | A-COMP+A-RET+A-ROUTE | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 688a237da25561ee |
| tg2-F10-P04-W01-fa4ea6c51b9f | A-COMP+A-RET+A-ROUTE | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | fa4ea6c51b9fd7db |
| tg2-F10-P04-W02-d4a3783e86ae | A-COMP+A-RET+A-ROUTE | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | d4a3783e86aed375 |
| tg2-F10-P04-W03-0f7725d31cae | A-COMP+A-RET+A-ROUTE | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 0f7725d31caec983 |
| tg2-F10-P04-W04-819b38a4b318 | A-COMP+A-RET+A-ROUTE | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 819b38a4b318549b |
| tg2-F10-P05-W01-3bfeff990dd4 | A-COMP+A-RET+A-ROUTE | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 3bfeff990dd44c86 |
| tg2-F10-P05-W02-6d1f5143ab41 | A-COMP+A-RET+A-ROUTE | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 6d1f5143ab4142f6 |
| tg2-F10-P05-W03-67b1990df713 | A-COMP+A-RET+A-ROUTE | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 67b1990df713c4e0 |
| tg2-F10-P05-W04-12d2c5c72254 | A-COMP+A-RET+A-ROUTE | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 12d2c5c722547808 |
| tg2-F10-P06-W01-27018e88bec2 | A-COMP+A-RET+A-ROUTE | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 27018e88bec2fff5 |
| tg2-F10-P06-W02-b3fe40518fa4 | A-COMP+A-RET+A-ROUTE | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | b3fe40518fa44e63 |
| tg2-F10-P06-W03-a2473b436ce9 | A-COMP+A-RET+A-ROUTE | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | a2473b436ce96da9 |
| tg2-F10-P06-W04-7203617a5fc1 | A-COMP+A-RET+A-ROUTE | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 7203617a5fc1ff5d |
| tg2-F10-P07-W01-4c79d0ae5592 | A-COMP+A-RET+A-ROUTE | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 4c79d0ae55923508 |
| tg2-F10-P07-W02-fd9db4f7be29 | A-COMP+A-RET+A-ROUTE | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | fd9db4f7be292e04 |
| tg2-F10-P07-W03-f4e256e9b43b | A-COMP+A-RET+A-ROUTE | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | f4e256e9b43b10c6 |
| tg2-F10-P07-W04-613423075e91 | A-COMP+A-RET+A-ROUTE | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 613423075e91f43a |
| tg2-F10-P08-W01-4d9e4be86f35 | A-COMP+A-RET+A-ROUTE | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 4d9e4be86f35ac1f |
| tg2-F10-P08-W02-6b8c5b28a2f4 | A-COMP+A-RET+A-ROUTE | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 6b8c5b28a2f4bf41 |
| tg2-F10-P08-W03-76ef8a573c4d | A-COMP+A-RET+A-ROUTE | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 76ef8a573c4d5faf |
| tg2-F10-P08-W04-067fd354aba9 | A-COMP+A-RET+A-ROUTE | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 067fd354aba94fd7 |
| tg2-F10-P09-W01-aa83ef350c19 | A-COMP+A-RET+A-ROUTE | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | aa83ef350c19394a |
| tg2-F10-P09-W02-8be303928001 | A-COMP+A-RET+A-ROUTE | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 8be303928001e722 |
| tg2-F10-P09-W03-d4c0907f6ebf | A-COMP+A-RET+A-ROUTE | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | d4c0907f6ebfbb7c |
| tg2-F10-P09-W04-287c527c604a | A-COMP+A-RET+A-ROUTE | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 287c527c604a5644 |
| tg2-F10-P10-W01-bd50cf9fef47 | A-COMP+A-RET+A-ROUTE | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | bd50cf9fef47a0b8 |
| tg2-F10-P10-W02-d3cdfd408a79 | A-COMP+A-RET+A-ROUTE | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | d3cdfd408a794014 |
| tg2-F10-P10-W03-28feafa5077e | A-COMP+A-RET+A-ROUTE | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 28feafa5077eff76 |
| tg2-F10-P10-W04-fff8922a461a | A-COMP+A-RET+A-ROUTE | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | fff8922a461ac50a |
| tg2-F10-P11-W01-1b40eee939de | A-COMP+A-RET+A-ROUTE | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 1b40eee939de50a5 |
| tg2-F10-P11-W02-a0068d07540a | A-COMP+A-RET+A-ROUTE | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | a0068d07540a0a73 |
| tg2-F10-P11-W03-7f43c4e11e25 | A-COMP+A-RET+A-ROUTE | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 7f43c4e11e25f3d9 |
| tg2-F10-P11-W04-e2b0d47f6b58 | A-COMP+A-RET+A-ROUTE | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | e2b0d47f6b58052d |
| tg2-F10-P12-W01-00d3c8fd253a | A-COMP+A-RET+A-ROUTE | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 00d3c8fd253a98f6 |
| tg2-F10-P12-W02-b0004a5f21a6 | A-COMP+A-RET+A-ROUTE | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | b0004a5f21a68486 |
| tg2-F10-P12-W03-ac81f154c00d | A-COMP+A-RET+A-ROUTE | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | ac81f154c00d6450 |
| tg2-F10-P12-W04-ce688facafde | A-COMP+A-RET+A-ROUTE | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | ce688facafdeb3d8 |
| tg2-F10-P13-W01-f0ab91e575a8 | A-COMP+A-RET+A-ROUTE | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | f0ab91e575a8858b |
| tg2-F10-P13-W02-f0a8df9bb089 | A-COMP+A-RET+A-ROUTE | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | f0a8df9bb0894245 |
| tg2-F10-P13-W03-dbf8b1f032b4 | A-COMP+A-RET+A-ROUTE | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | dbf8b1f032b4da33 |
| tg2-F10-P13-W04-93384915d7ac | A-COMP+A-RET+A-ROUTE | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 93384915d7ac786b |
| tg2-F10-P14-W01-92b8291c2db1 | A-COMP+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 92b8291c2db166d4 |
| tg2-F10-P14-W02-033f9339b20c | A-COMP+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 033f9339b20c26f8 |
| tg2-F10-P14-W03-986ee81de5fa | A-COMP+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 986ee81de5fa094a |
| tg2-F10-P14-W04-bd29aa3bca28 | A-COMP+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | bd29aa3bca2827be |
| tg2-F10-P15-W01-e0c1a8443efe | A-COMP+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | e0c1a8443efe93b1 |
| tg2-F10-P15-W02-5fad88e7b636 | A-COMP+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 5fad88e7b63660f7 |
| tg2-F10-P15-W03-5f3918f34e31 | A-COMP+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 5f3918f34e3139ad |
| tg2-F10-P15-W04-859ac49f193d | A-COMP+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 859ac49f193d7d01 |
| tg2-F10-P16-W01-6a43405fdbc9 | A-COMP+A-RET+A-ROUTE | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 6a43405fdbc9d1f2 |
| tg2-F10-P16-W02-f8f1fa2cbbac | A-COMP+A-RET+A-ROUTE | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | f8f1fa2cbbac2a6a |
| tg2-F10-P16-W03-2e43e38d8063 | A-COMP+A-RET+A-ROUTE | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | 2e43e38d806315d4 |
| tg2-F10-P16-W04-ccc762b92550 | A-COMP+A-RET+A-ROUTE | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F10:predicate | F10.M (tokens,cost,latency,quality) | F10.G (new) | T2 | ccc762b9255086fc |
| tg2-F11-P01-W01-28e28b0456b3 | A-SUM+A-RET+A-SCHEMA | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 28e28b0456b32f39 |
| tg2-F11-P01-W02-3fd7549ebdeb | A-SUM+A-RET+A-SCHEMA | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 3fd7549ebdeb6ddf |
| tg2-F11-P01-W03-1e7674dacb95 | A-SUM+A-RET+A-SCHEMA | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 1e7674dacb954385 |
| tg2-F11-P01-W04-65cf57ff3929 | A-SUM+A-RET+A-SCHEMA | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 65cf57ff39299d79 |
| tg2-F11-P02-W01-23c14443e786 | A-SUM+A-RET+A-SCHEMA | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 23c14443e786fcda |
| tg2-F11-P02-W02-c99ecd85bf29 | A-SUM+A-RET+A-SCHEMA | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | c99ecd85bf292052 |
| tg2-F11-P02-W03-cbec07b4f715 | A-SUM+A-RET+A-SCHEMA | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | cbec07b4f715ca8c |
| tg2-F11-P02-W04-695291a243ca | A-SUM+A-RET+A-SCHEMA | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 695291a243cab8f4 |
| tg2-F11-P03-W01-659fed8462df | A-SUM+A-RET+A-SCHEMA | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 659fed8462df4f2f |
| tg2-F11-P03-W02-f836d925143e | A-SUM+A-RET+A-SCHEMA | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f836d925143e2b31 |
| tg2-F11-P03-W03-f8f6ed00bfb6 | A-SUM+A-RET+A-SCHEMA | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f8f6ed00bfb6407f |
| tg2-F11-P03-W04-f79eb94e793b | A-SUM+A-RET+A-SCHEMA | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f79eb94e793bab07 |
| tg2-F11-P04-W01-537f71ab2115 | A-SUM+A-RET+A-SCHEMA | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 537f71ab2115d9e0 |
| tg2-F11-P04-W02-cb95e18cad50 | A-SUM+A-RET+A-SCHEMA | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | cb95e18cad50495c |
| tg2-F11-P04-W03-edda4b7d2f80 | A-SUM+A-RET+A-SCHEMA | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | edda4b7d2f80f82e |
| tg2-F11-P04-W04-8dfa98e2743e | A-SUM+A-RET+A-SCHEMA | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 8dfa98e2743e4be2 |
| tg2-F11-P05-W01-f892d49f0154 | A-SUM+A-RET+A-SCHEMA | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f892d49f0154722d |
| tg2-F11-P05-W02-f1b08c654a42 | A-SUM+A-RET+A-SCHEMA | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f1b08c654a42cafb |
| tg2-F11-P05-W03-b0b7ec7ce229 | A-SUM+A-RET+A-SCHEMA | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | b0b7ec7ce2291f91 |
| tg2-F11-P05-W04-7f84a94cb822 | A-SUM+A-RET+A-SCHEMA | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 7f84a94cb822fc45 |
| tg2-F11-P06-W01-f6cb477c210c | A-SUM+A-RET+A-SCHEMA | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f6cb477c210c241e |
| tg2-F11-P06-W02-8b0122e6c7c2 | A-SUM+A-RET+A-SCHEMA | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 8b0122e6c7c2f54e |
| tg2-F11-P06-W03-f4e2ab4cb4e5 | A-SUM+A-RET+A-SCHEMA | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f4e2ab4cb4e5cec8 |
| tg2-F11-P06-W04-f94edfb21eb2 | A-SUM+A-RET+A-SCHEMA | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f94edfb21eb2c750 |
| tg2-F11-P07-W01-4d419d594d5e | A-SUM+A-RET+A-SCHEMA | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 4d419d594d5ee573 |
| tg2-F11-P07-W02-56f41ff67e05 | A-SUM+A-RET+A-SCHEMA | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 56f41ff67e055c4d |
| tg2-F11-P07-W03-9fdf8432a7eb | A-SUM+A-RET+A-SCHEMA | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 9fdf8432a7eb7f6b |
| tg2-F11-P07-W04-a1d77c1063a6 | A-SUM+A-RET+A-SCHEMA | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | a1d77c1063a6b603 |
| tg2-F11-P08-W01-035c8b9bdfcd | A-SUM+A-RET+A-SCHEMA | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 035c8b9bdfcd4df4 |
| tg2-F11-P08-W02-987c35960132 | A-SUM+A-RET+A-SCHEMA | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 987c359601320f18 |
| tg2-F11-P08-W03-4f54091eb043 | A-SUM+A-RET+A-SCHEMA | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 4f54091eb043296a |
| tg2-F11-P08-W04-0ce5573e40c3 | A-SUM+A-RET+A-SCHEMA | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 0ce5573e40c37f5e |
| tg2-F11-P09-W01-a81f19d181e3 | A-SUM+A-RET+A-SCHEMA | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | a81f19d181e379d1 |
| tg2-F11-P09-W02-ea13b2825cef | A-SUM+A-RET+A-SCHEMA | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | ea13b2825cef1497 |
| tg2-F11-P09-W03-6ee817687d48 | A-SUM+A-RET+A-SCHEMA | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 6ee817687d485e4d |
| tg2-F11-P09-W04-52a1890e976e | A-SUM+A-RET+A-SCHEMA | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 52a1890e976e11a1 |
| tg2-F11-P10-W01-0bb074076633 | A-SUM+A-RET+A-SCHEMA | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 0bb0740766338bfb |
| tg2-F11-P10-W02-56e5a49343e5 | A-SUM+A-RET+A-SCHEMA | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 56e5a49343e52715 |
| tg2-F11-P10-W03-aee0bf034001 | A-SUM+A-RET+A-SCHEMA | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | aee0bf0340016ca3 |
| tg2-F11-P10-W04-88b95df1a723 | A-SUM+A-RET+A-SCHEMA | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 88b95df1a723583b |
| tg2-F11-P11-W01-c4a9c3da6141 | A-SUM+A-RET+A-SCHEMA | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | c4a9c3da61412026 |
| tg2-F11-P11-W02-b53c8d49427f | A-SUM+A-RET+A-SCHEMA | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | b53c8d49427f7916 |
| tg2-F11-P11-W03-5f16e00e9e23 | A-SUM+A-RET+A-SCHEMA | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 5f16e00e9e236500 |
| tg2-F11-P11-W04-fd4cf02b668e | A-SUM+A-RET+A-SCHEMA | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | fd4cf02b668e3ea8 |
| tg2-F11-P12-W01-e30efc803c5f | A-SUM+A-RET+A-SCHEMA | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | e30efc803c5f1295 |
| tg2-F11-P12-W02-0787f719dfe8 | A-SUM+A-RET+A-SCHEMA | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 0787f719dfe80883 |
| tg2-F11-P12-W03-9505ef3562ce | A-SUM+A-RET+A-SCHEMA | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 9505ef3562ce01c9 |
| tg2-F11-P12-W04-84a65c686b53 | A-SUM+A-RET+A-SCHEMA | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 84a65c686b53727d |
| tg2-F11-P13-W01-7a89dcf53944 | A-SUM+A-RET+A-SCHEMA | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 7a89dcf539441528 |
| tg2-F11-P13-W02-b29c02c7ae22 | A-SUM+A-RET+A-SCHEMA | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | b29c02c7ae2216a4 |
| tg2-F11-P13-W03-b5cce9fe8a0a | A-SUM+A-RET+A-SCHEMA | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | b5cce9fe8a0aa6e6 |
| tg2-F11-P13-W04-67cfb57aae1b | A-SUM+A-RET+A-SCHEMA | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 67cfb57aae1b075a |
| tg2-F11-P14-W01-500b63ee5f56 | A-SUM+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 500b63ee5f56d2f7 |
| tg2-F11-P14-W02-64bd8c916068 | A-SUM+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 64bd8c9160681319 |
| tg2-F11-P14-W03-d0d9093d161b | A-SUM+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | d0d9093d161bc757 |
| tg2-F11-P14-W04-062d6af5672e | A-SUM+A-RET+A-SCHEMA | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 062d6af5672e8d5f |
| tg2-F11-P15-W01-e694a5d35a63 | A-SUM+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | e694a5d35a63cee2 |
| tg2-F11-P15-W02-f62282bf8dd7 | A-SUM+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f62282bf8dd7aa7a |
| tg2-F11-P15-W03-7d45b50406ce | A-SUM+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 7d45b50406cedc04 |
| tg2-F11-P15-W04-594ae2ac6400 | A-SUM+A-RET+A-SCHEMA | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | 594ae2ac6400d48c |
| tg2-F11-P16-W01-bd606f5a538c | A-SUM+A-RET+A-SCHEMA | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | bd606f5a538cec61 |
| tg2-F11-P16-W02-d406016d01f5 | A-SUM+A-RET+A-SCHEMA | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | d406016d01f537c7 |
| tg2-F11-P16-W03-b4c05a98e409 | A-SUM+A-RET+A-SCHEMA | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | b4c05a98e4090e9d |
| tg2-F11-P16-W04-f4c6aa736745 | A-SUM+A-RET+A-SCHEMA | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F11:predicate | F11.M (tokens,cost,latency,quality) | F11.G (new) | T1 | f4c6aa7367454111 |
| tg2-F12-P01-W01-0d63dd094904 | A-SUM+A-RET+A-TOOLS | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 0d63dd0949044cfa |
| tg2-F12-P01-W02-ddebb29d0436 | A-SUM+A-RET+A-TOOLS | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | ddebb29d04365a72 |
| tg2-F12-P01-W03-260a548b96da | A-SUM+A-RET+A-TOOLS | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 260a548b96da072c |
| tg2-F12-P01-W04-706e24e43fd9 | A-SUM+A-RET+A-TOOLS | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 706e24e43fd9ca94 |
| tg2-F12-P02-W01-aa0e2b9cef19 | A-SUM+A-RET+A-TOOLS | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | aa0e2b9cef192a59 |
| tg2-F12-P02-W02-239fc8037c8f | A-SUM+A-RET+A-TOOLS | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 239fc8037c8ff7ff |
| tg2-F12-P02-W03-aa753a6dc0b4 | A-SUM+A-RET+A-TOOLS | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | aa753a6dc0b4c2a5 |
| tg2-F12-P02-W04-c64a9fd3a67c | A-SUM+A-RET+A-TOOLS | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | c64a9fd3a67c0399 |
| tg2-F12-P03-W01-6c3d95285342 | A-SUM+A-RET+A-TOOLS | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 6c3d95285342495c |
| tg2-F12-P03-W02-f25e7bf82bd5 | A-SUM+A-RET+A-TOOLS | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | f25e7bf82bd51040 |
| tg2-F12-P03-W03-985df128db13 | A-SUM+A-RET+A-TOOLS | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 985df128db13e382 |
| tg2-F12-P03-W04-012383307cd5 | A-SUM+A-RET+A-TOOLS | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 012383307cd53556 |
| tg2-F12-P04-W01-9fab9c6fd29d | A-SUM+A-RET+A-TOOLS | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 9fab9c6fd29d0b93 |
| tg2-F12-P04-W02-443a703d52f0 | A-SUM+A-RET+A-TOOLS | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 443a703d52f0e86d |
| tg2-F12-P04-W03-6150f256962d | A-SUM+A-RET+A-TOOLS | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 6150f256962d0e0b |
| tg2-F12-P04-W04-d38b42cef777 | A-SUM+A-RET+A-TOOLS | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d38b42cef7777823 |
| tg2-F12-P05-W01-4ac56f58b16f | A-SUM+A-RET+A-TOOLS | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 4ac56f58b16f58be |
| tg2-F12-P05-W02-57e8b146933c | A-SUM+A-RET+A-TOOLS | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 57e8b146933c926e |
| tg2-F12-P05-W03-d0570d62213c | A-SUM+A-RET+A-TOOLS | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d0570d62213c03e8 |
| tg2-F12-P05-W04-d2ffb8671fc5 | A-SUM+A-RET+A-TOOLS | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d2ffb8671fc56670 |
| tg2-F12-P06-W01-738b9576ac34 | A-SUM+A-RET+A-TOOLS | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 738b9576ac34c1cd |
| tg2-F12-P06-W02-72cb815deee8 | A-SUM+A-RET+A-TOOLS | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 72cb815deee8011b |
| tg2-F12-P06-W03-a0fd23b63b0f | A-SUM+A-RET+A-TOOLS | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | a0fd23b63b0f47b1 |
| tg2-F12-P06-W04-78499f6806a9 | A-SUM+A-RET+A-TOOLS | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 78499f6806a9e965 |
| tg2-F12-P07-W01-8f5e717a343a | A-SUM+A-RET+A-TOOLS | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 8f5e717a343abb80 |
| tg2-F12-P07-W02-b9eac9a855ea | A-SUM+A-RET+A-TOOLS | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | b9eac9a855ea66fc |
| tg2-F12-P07-W03-b0006f0b2b14 | A-SUM+A-RET+A-TOOLS | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | b0006f0b2b14a5ce |
| tg2-F12-P07-W04-4bb793c1c273 | A-SUM+A-RET+A-TOOLS | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 4bb793c1c2737e82 |
| tg2-F12-P08-W01-0b6f322b13d8 | A-SUM+A-RET+A-TOOLS | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 0b6f322b13d83747 |
| tg2-F12-P08-W02-ba1ab1fddc01 | A-SUM+A-RET+A-TOOLS | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | ba1ab1fddc01a2c9 |
| tg2-F12-P08-W03-e60c7ed69b02 | A-SUM+A-RET+A-TOOLS | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | e60c7ed69b02f8a7 |
| tg2-F12-P08-W04-3de89ca4c30c | A-SUM+A-RET+A-TOOLS | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 3de89ca4c30c3c8f |
| tg2-F12-P09-W01-4946cbf2abf6 | A-SUM+A-RET+A-TOOLS | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 4946cbf2abf68b32 |
| tg2-F12-P09-W02-65a986e09830 | A-SUM+A-RET+A-TOOLS | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 65a986e09830aeaa |
| tg2-F12-P09-W03-aa2a993f0339 | A-SUM+A-RET+A-TOOLS | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | aa2a993f0339ee14 |
| tg2-F12-P09-W04-76ccf8bf636a | A-SUM+A-RET+A-TOOLS | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 76ccf8bf636a403c |
| tg2-F12-P10-W01-fc1f49eb1249 | A-SUM+A-RET+A-TOOLS | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | fc1f49eb12494970 |
| tg2-F12-P10-W02-0431bec33b5a | A-SUM+A-RET+A-TOOLS | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 0431bec33b5aef4c |
| tg2-F12-P10-W03-161bcde75b90 | A-SUM+A-RET+A-TOOLS | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 161bcde75b9048be |
| tg2-F12-P10-W04-8116a79575da | A-SUM+A-RET+A-TOOLS | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 8116a79575da73d2 |
| tg2-F12-P11-W01-2875fec324d0 | A-SUM+A-RET+A-TOOLS | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 2875fec324d0777d |
| tg2-F12-P11-W02-a75e874fc1bb | A-SUM+A-RET+A-TOOLS | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | a75e874fc1bbbe6b |
| tg2-F12-P11-W03-3654d4075342 | A-SUM+A-RET+A-TOOLS | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 3654d40753429261 |
| tg2-F12-P11-W04-6662af3b809b | A-SUM+A-RET+A-TOOLS | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 6662af3b809be475 |
| tg2-F12-P12-W01-db6829462ed9 | A-SUM+A-RET+A-TOOLS | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | db6829462ed97a2e |
| tg2-F12-P12-W02-d7e7330e868e | A-SUM+A-RET+A-TOOLS | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d7e7330e868e293e |
| tg2-F12-P12-W03-25b8b10dae01 | A-SUM+A-RET+A-TOOLS | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 25b8b10dae016518 |
| tg2-F12-P12-W04-cd617fee0cc2 | A-SUM+A-RET+A-TOOLS | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | cd617fee0cc25940 |
| tg2-F12-P13-W01-76c2aa52d2e0 | A-SUM+A-RET+A-TOOLS | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 76c2aa52d2e06903 |
| tg2-F12-P13-W02-202f3b1ff66b | A-SUM+A-RET+A-TOOLS | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 202f3b1ff66b0efd |
| tg2-F12-P13-W03-21c264a58a8a | A-SUM+A-RET+A-TOOLS | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 21c264a58a8a22bb |
| tg2-F12-P13-W04-39d5c2c61fd5 | A-SUM+A-RET+A-TOOLS | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 39d5c2c61fd510f3 |
| tg2-F12-P14-W01-e1b6da519ab9 | A-SUM+A-RET+A-TOOLS | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | e1b6da519ab9dc8c |
| tg2-F12-P14-W02-345c526b23f9 | A-SUM+A-RET+A-TOOLS | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 345c526b23f90790 |
| tg2-F12-P14-W03-e182b95ed489 | A-SUM+A-RET+A-TOOLS | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | e182b95ed48963f2 |
| tg2-F12-P14-W04-a1b739900fdc | A-SUM+A-RET+A-TOOLS | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | a1b739900fdc60e6 |
| tg2-F12-P15-W01-d66dcbfff07a | A-SUM+A-RET+A-TOOLS | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d66dcbfff07a0109 |
| tg2-F12-P15-W02-d9e3c1d405e2 | A-SUM+A-RET+A-TOOLS | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | d9e3c1d405e26e0f |
| tg2-F12-P15-W03-afb92f6626a7 | A-SUM+A-RET+A-TOOLS | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | afb92f6626a76115 |
| tg2-F12-P15-W04-4ca735a48ae1 | A-SUM+A-RET+A-TOOLS | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 4ca735a48ae14fe9 |
| tg2-F12-P16-W01-683620f4d2d7 | A-SUM+A-RET+A-TOOLS | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 683620f4d2d7f8aa |
| tg2-F12-P16-W02-0d89e7ed4879 | A-SUM+A-RET+A-TOOLS | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 0d89e7ed48791102 |
| tg2-F12-P16-W03-3d1033063f70 | A-SUM+A-RET+A-TOOLS | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | 3d1033063f70f7dc |
| tg2-F12-P16-W04-cfb42db14ee6 | A-SUM+A-RET+A-TOOLS | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F12:predicate | F12.M (tokens,cost,latency,quality) | F12.G (new) | T1 | cfb42db14ee644a4 |
| tg2-F13-P01-W01-860be9614594 | A-WINDOW+A-RET+A-ROUTE | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 860be9614594309e |
| tg2-F13-P01-W02-7497a50a0767 | A-WINDOW+A-RET+A-ROUTE | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 7497a50a076776ce |
| tg2-F13-P01-W03-0e87c0905fad | A-WINDOW+A-RET+A-ROUTE | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 0e87c0905fad2848 |
| tg2-F13-P01-W04-ec2e780f31e0 | A-WINDOW+A-RET+A-ROUTE | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ec2e780f31e004d0 |
| tg2-F13-P02-W01-87d3768425dc | A-WINDOW+A-RET+A-ROUTE | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 87d3768425dc7ead |
| tg2-F13-P02-W02-db470e8889e7 | A-WINDOW+A-RET+A-ROUTE | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | db470e8889e74c7b |
| tg2-F13-P02-W03-ca5d01c08cf0 | A-WINDOW+A-RET+A-ROUTE | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ca5d01c08cf07911 |
| tg2-F13-P02-W04-726441a9cb50 | A-WINDOW+A-RET+A-ROUTE | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 726441a9cb5039c5 |
| tg2-F13-P03-W01-e2c01390459d | A-WINDOW+A-RET+A-ROUTE | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e2c01390459de660 |
| tg2-F13-P03-W02-b52c63afecf4 | A-WINDOW+A-RET+A-ROUTE | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | b52c63afecf4cadc |
| tg2-F13-P03-W03-077f60c0da48 | A-WINDOW+A-RET+A-ROUTE | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 077f60c0da4851ae |
| tg2-F13-P03-W04-80da313f876b | A-WINDOW+A-RET+A-ROUTE | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 80da313f876b8962 |
| tg2-F13-P04-W01-f4e08f698767 | A-WINDOW+A-RET+A-ROUTE | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | f4e08f6987675baf |
| tg2-F13-P04-W02-e1cd5b4853e2 | A-WINDOW+A-RET+A-ROUTE | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e1cd5b4853e2acb1 |
| tg2-F13-P04-W03-129c02446a7d | A-WINDOW+A-RET+A-ROUTE | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 129c02446a7d99ff |
| tg2-F13-P04-W04-ea7e51ab8c68 | A-WINDOW+A-RET+A-ROUTE | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ea7e51ab8c68e887 |
| tg2-F13-P05-W01-b301e6290c0f | A-WINDOW+A-RET+A-ROUTE | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | b301e6290c0f095a |
| tg2-F13-P05-W02-b3354fa8fecd | A-WINDOW+A-RET+A-ROUTE | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | b3354fa8fecda1d2 |
| tg2-F13-P05-W03-e5911cf8a1dd | A-WINDOW+A-RET+A-ROUTE | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e5911cf8a1dd240c |
| tg2-F13-P05-W04-5c3229ff56f7 | A-WINDOW+A-RET+A-ROUTE | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 5c3229ff56f7f674 |
| tg2-F13-P06-W01-b8232ce97b3b | A-WINDOW+A-RET+A-ROUTE | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | b8232ce97b3b3bb9 |
| tg2-F13-P06-W02-296dd6c1fd8f | A-WINDOW+A-RET+A-ROUTE | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 296dd6c1fd8fef5f |
| tg2-F13-P06-W03-381b8a1e765c | A-WINDOW+A-RET+A-ROUTE | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 381b8a1e765c9d05 |
| tg2-F13-P06-W04-58aef05c4c56 | A-WINDOW+A-RET+A-ROUTE | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 58aef05c4c56daf9 |
| tg2-F13-P07-W01-d27de37c6e3f | A-WINDOW+A-RET+A-ROUTE | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | d27de37c6e3ffd3c |
| tg2-F13-P07-W02-be0ff9988b1a | A-WINDOW+A-RET+A-ROUTE | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | be0ff9988b1a96a0 |
| tg2-F13-P07-W03-64a486f7b142 | A-WINDOW+A-RET+A-ROUTE | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 64a486f7b1421de2 |
| tg2-F13-P07-W04-b6a4ef007813 | A-WINDOW+A-RET+A-ROUTE | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | b6a4ef00781371b6 |
| tg2-F13-P08-W01-6d5b6aabcb27 | A-WINDOW+A-RET+A-ROUTE | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 6d5b6aabcb27b5ab |
| tg2-F13-P08-W02-166f585990aa | A-WINDOW+A-RET+A-ROUTE | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 166f585990aa26e5 |
| tg2-F13-P08-W03-ebf52afc4227 | A-WINDOW+A-RET+A-ROUTE | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ebf52afc4227f353 |
| tg2-F13-P08-W04-8b6850d38edf | A-WINDOW+A-RET+A-ROUTE | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 8b6850d38edfbb0b |
| tg2-F13-P09-W01-ab1c78f02acd | A-WINDOW+A-RET+A-ROUTE | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ab1c78f02acdd916 |
| tg2-F13-P09-W02-a5f29a73d739 | A-WINDOW+A-RET+A-ROUTE | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | a5f29a73d739e326 |
| tg2-F13-P09-W03-228f64ef988b | A-WINDOW+A-RET+A-ROUTE | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 228f64ef988b69f0 |
| tg2-F13-P09-W04-50bdeae93ebc | A-WINDOW+A-RET+A-ROUTE | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 50bdeae93ebc7f78 |
| tg2-F13-P10-W01-f8d857743b3f | A-WINDOW+A-RET+A-ROUTE | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | f8d857743b3fb8b4 |
| tg2-F13-P10-W02-ee48650c4084 | A-WINDOW+A-RET+A-ROUTE | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ee48650c4084ecd8 |
| tg2-F13-P10-W03-8b54bf99e647 | A-WINDOW+A-RET+A-ROUTE | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 8b54bf99e6473e2a |
| tg2-F13-P10-W04-1f468b51b728 | A-WINDOW+A-RET+A-ROUTE | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 1f468b51b728171e |
| tg2-F13-P11-W01-d4b2f141be5b | A-WINDOW+A-RET+A-ROUTE | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | d4b2f141be5bc391 |
| tg2-F13-P11-W02-e593f1ebc500 | A-WINDOW+A-RET+A-ROUTE | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e593f1ebc5000357 |
| tg2-F13-P11-W03-ee2a20a1dc60 | A-WINDOW+A-RET+A-ROUTE | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ee2a20a1dc60bb0d |
| tg2-F13-P11-W04-21a2ad992ab5 | A-WINDOW+A-RET+A-ROUTE | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 21a2ad992ab53f61 |
| tg2-F13-P12-W01-d3d6ba6916d5 | A-WINDOW+A-RET+A-ROUTE | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | d3d6ba6916d52852 |
| tg2-F13-P12-W02-11f4730b4c90 | A-WINDOW+A-RET+A-ROUTE | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 11f4730b4c90004a |
| tg2-F13-P12-W03-40e9803d4656 | A-WINDOW+A-RET+A-ROUTE | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 40e9803d46569d34 |
| tg2-F13-P12-W04-6608a4d4ed70 | A-WINDOW+A-RET+A-ROUTE | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 6608a4d4ed70e05c |
| tg2-F13-P13-W01-103e1b821308 | A-WINDOW+A-RET+A-ROUTE | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 103e1b821308dbe7 |
| tg2-F13-P13-W02-2f79bcb3f811 | A-WINDOW+A-RET+A-ROUTE | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 2f79bcb3f81156e9 |
| tg2-F13-P13-W03-e790e7c8a7fb | A-WINDOW+A-RET+A-ROUTE | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e790e7c8a7fb94c7 |
| tg2-F13-P13-W04-109050c04844 | A-WINDOW+A-RET+A-ROUTE | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 109050c0484470af |
| tg2-F13-P14-W01-31eb8189b37b | A-WINDOW+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 31eb8189b37ba698 |
| tg2-F13-P14-W02-d36958f95580 | A-WINDOW+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | d36958f955805374 |
| tg2-F13-P14-W03-1921c880d617 | A-WINDOW+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 1921c880d6173bd6 |
| tg2-F13-P14-W04-ced83e724546 | A-WINDOW+A-RET+A-ROUTE | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | ced83e7245460f6a |
| tg2-F13-P15-W01-a445dbb94dcb | A-WINDOW+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | a445dbb94dcb7505 |
| tg2-F13-P15-W02-d4af93bf9611 | A-WINDOW+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | d4af93bf96118e53 |
| tg2-F13-P15-W03-f1e8736f0215 | A-WINDOW+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | f1e8736f021579b9 |
| tg2-F13-P15-W04-296901d984ce | A-WINDOW+A-RET+A-ROUTE | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 296901d984ce5f8d |
| tg2-F13-P16-W01-9e6df9593e12 | A-WINDOW+A-RET+A-ROUTE | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | 9e6df9593e126856 |
| tg2-F13-P16-W02-edf4135a02b9 | A-WINDOW+A-RET+A-ROUTE | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | edf4135a02b92a66 |
| tg2-F13-P16-W03-fb90001f28c8 | A-WINDOW+A-RET+A-ROUTE | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | fb90001f28c85430 |
| tg2-F13-P16-W04-e07b20758448 | A-WINDOW+A-RET+A-ROUTE | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F13:predicate | F13.M (tokens,cost,latency,quality) | F13.G (new) | T2 | e07b20758448feb8 |
| tg2-F14-P01-W01-c2cf49e2517e | A-SCHEMA+A-TOOLS+A-RETRY | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | c2cf49e2517e95b3 |
| tg2-F14-P01-W02-865129b40498 | A-SCHEMA+A-TOOLS+A-RETRY | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 865129b40498a68d |
| tg2-F14-P01-W03-3bd3a9977ec3 | A-SCHEMA+A-TOOLS+A-RETRY | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 3bd3a9977ec34eab |
| tg2-F14-P01-W04-b46eb5d3c80e | A-SCHEMA+A-TOOLS+A-RETRY | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | b46eb5d3c80e6043 |
| tg2-F14-P02-W01-a5aef5b049f6 | A-SCHEMA+A-TOOLS+A-RETRY | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | a5aef5b049f6a520 |
| tg2-F14-P02-W02-ce5a2873bcc9 | A-SCHEMA+A-TOOLS+A-RETRY | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | ce5a2873bcc9b19c |
| tg2-F14-P02-W03-7ee7f4443c2c | A-SCHEMA+A-TOOLS+A-RETRY | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 7ee7f4443c2cf76e |
| tg2-F14-P02-W04-15b72b7ca256 | A-SCHEMA+A-TOOLS+A-RETRY | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 15b72b7ca2560122 |
| tg2-F14-P03-W01-498e7c2cf336 | A-SCHEMA+A-TOOLS+A-RETRY | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 498e7c2cf3365d6d |
| tg2-F14-P03-W02-b9084c6630d7 | A-SCHEMA+A-TOOLS+A-RETRY | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | b9084c6630d7753b |
| tg2-F14-P03-W03-cecea42d1f4b | A-SCHEMA+A-TOOLS+A-RETRY | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | cecea42d1f4b54d1 |
| tg2-F14-P03-W04-d3d98db40697 | A-SCHEMA+A-TOOLS+A-RETRY | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | d3d98db406974685 |
| tg2-F14-P04-W01-b8c932c9b6c9 | A-SCHEMA+A-TOOLS+A-RETRY | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | b8c932c9b6c9471a |
| tg2-F14-P04-W02-9ae3190647b8 | A-SCHEMA+A-TOOLS+A-RETRY | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 9ae3190647b81592 |
| tg2-F14-P04-W03-3e458efa4056 | A-SCHEMA+A-TOOLS+A-RETRY | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 3e458efa405628cc |
| tg2-F14-P04-W04-5b6402d6a671 | A-SCHEMA+A-TOOLS+A-RETRY | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 5b6402d6a6718d34 |
| tg2-F14-P05-W01-f4186bb306b4 | A-SCHEMA+A-TOOLS+A-RETRY | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | f4186bb306b40d6f |
| tg2-F14-P05-W02-73eaafc4814b | A-SCHEMA+A-TOOLS+A-RETRY | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 73eaafc4814b1e71 |
| tg2-F14-P05-W03-9ce799ceaa85 | A-SCHEMA+A-TOOLS+A-RETRY | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 9ce799ceaa85b4bf |
| tg2-F14-P05-W04-3b272cfcc217 | A-SCHEMA+A-TOOLS+A-RETRY | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 3b272cfcc2170047 |
| tg2-F14-P06-W01-8d2dbc2411ac | A-SCHEMA+A-TOOLS+A-RETRY | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 8d2dbc2411ac97fc |
| tg2-F14-P06-W02-405d40730e77 | A-SCHEMA+A-TOOLS+A-RETRY | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 405d40730e77ca60 |
| tg2-F14-P06-W03-1ee871462d08 | A-SCHEMA+A-TOOLS+A-RETRY | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 1ee871462d08f3a2 |
| tg2-F14-P06-W04-7110651dc1f0 | A-SCHEMA+A-TOOLS+A-RETRY | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 7110651dc1f0eb76 |
| tg2-F14-P07-W01-be01fd7c42ae | A-SCHEMA+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | be01fd7c42ae1279 |
| tg2-F14-P07-W02-f92fe3d289b6 | A-SCHEMA+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | f92fe3d289b66c1f |
| tg2-F14-P07-W03-5c9352cb025b | A-SCHEMA+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 5c9352cb025bc5c5 |
| tg2-F14-P07-W04-4d803457e5be | A-SCHEMA+A-TOOLS+A-RETRY | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 4d803457e5be64b9 |
| tg2-F14-P08-W01-d14d5c6991bb | A-SCHEMA+A-TOOLS+A-RETRY | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | d14d5c6991bbded6 |
| tg2-F14-P08-W02-9171af3d361d | A-SCHEMA+A-TOOLS+A-RETRY | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 9171af3d361d99e6 |
| tg2-F14-P08-W03-e68b02cd1c0d | A-SCHEMA+A-TOOLS+A-RETRY | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | e68b02cd1c0d7bb0 |
| tg2-F14-P08-W04-fb86f533ad3d | A-SCHEMA+A-TOOLS+A-RETRY | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | fb86f533ad3d5a38 |
| tg2-F14-P09-W01-d410b4b236af | A-SCHEMA+A-TOOLS+A-RETRY | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | d410b4b236af836b |
| tg2-F14-P09-W02-4aad71185ef7 | A-SCHEMA+A-TOOLS+A-RETRY | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 4aad71185ef7fea5 |
| tg2-F14-P09-W03-8e5253b686c0 | A-SCHEMA+A-TOOLS+A-RETRY | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 8e5253b686c06213 |
| tg2-F14-P09-W04-d356ca6bca1b | A-SCHEMA+A-TOOLS+A-RETRY | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | d356ca6bca1b26cb |
| tg2-F14-P10-W01-910ea243bc74 | A-SCHEMA+A-TOOLS+A-RETRY | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 910ea243bc747c7d |
| tg2-F14-P10-W02-7d677862e273 | A-SCHEMA+A-TOOLS+A-RETRY | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 7d677862e273256b |
| tg2-F14-P10-W03-2d520675ddc7 | A-SCHEMA+A-TOOLS+A-RETRY | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 2d520675ddc7e961 |
| tg2-F14-P10-W04-c5c582bd2c50 | A-SCHEMA+A-TOOLS+A-RETRY | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | c5c582bd2c506375 |
| tg2-F14-P11-W01-64b7ed6ba9ed | A-SCHEMA+A-TOOLS+A-RETRY | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 64b7ed6ba9ed4e70 |
| tg2-F14-P11-W02-da3aafd65c12 | A-SCHEMA+A-TOOLS+A-RETRY | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | da3aafd65c12564c |
| tg2-F14-P11-W03-0d190055e615 | A-SCHEMA+A-TOOLS+A-RETRY | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 0d190055e6159fbe |
| tg2-F14-P11-W04-e0797b17218e | A-SCHEMA+A-TOOLS+A-RETRY | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | e0797b17218ef2d2 |
| tg2-F14-P12-W01-df5b4dd36a84 | A-SCHEMA+A-TOOLS+A-RETRY | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | df5b4dd36a846e03 |
| tg2-F14-P12-W02-f6382c331722 | A-SCHEMA+A-TOOLS+A-RETRY | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | f6382c33172275fd |
| tg2-F14-P12-W03-18bf9714150f | A-SCHEMA+A-TOOLS+A-RETRY | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 18bf9714150f79bb |
| tg2-F14-P12-W04-99389647cb89 | A-SCHEMA+A-TOOLS+A-RETRY | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 99389647cb898ff3 |
| tg2-F14-P13-W01-4400ccc6c67d | A-SCHEMA+A-TOOLS+A-RETRY | P13:CO-COMMAND | W01/chat/I01/V01 | conditional | P13:CO-COMMAND;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | 4400ccc6c67d7f2e |
| tg2-F14-P13-W02-adf02421a745 | A-SCHEMA+A-TOOLS+A-RETRY | P13:CO-COMMAND | W02/rag/I02/V03 | conditional | P13:CO-COMMAND;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | adf02421a745903e |
| tg2-F14-P13-W03-1cb5e37c3886 | A-SCHEMA+A-TOOLS+A-RETRY | P13:CO-COMMAND | W03/extract/I03/V02 | conditional | P13:CO-COMMAND;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | 1cb5e37c3886bc18 |
| tg2-F14-P13-W04-2cc4536fb876 | A-SCHEMA+A-TOOLS+A-RETRY | P13:CO-COMMAND | W04/agent/I04/V04 | conditional | P13:CO-COMMAND;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | 2cc4536fb876d840 |
| tg2-F14-P14-W01-3f066f80881e | A-SCHEMA+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 3f066f80881e0609 |
| tg2-F14-P14-W02-afecb2e72699 | A-SCHEMA+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | afecb2e72699d50f |
| tg2-F14-P14-W03-a6b661d4b12c | A-SCHEMA+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | a6b661d4b12cb815 |
| tg2-F14-P14-W04-ac0a09263695 | A-SCHEMA+A-TOOLS+A-RETRY | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | ac0a09263695cee9 |
| tg2-F14-P15-W01-4a4f7dd2325d | A-SCHEMA+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 4a4f7dd2325de18c |
| tg2-F14-P15-W02-0a65437e44b0 | A-SCHEMA+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 0a65437e44b06e90 |
| tg2-F14-P15-W03-d87febcd5f0e | A-SCHEMA+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | d87febcd5f0ebaf2 |
| tg2-F14-P15-W04-011a0d11bb90 | A-SCHEMA+A-TOOLS+A-RETRY | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new) | T1 | 011a0d11bb90dfe6 |
| tg2-F14-P16-W01-f8c0558dfefa | A-SCHEMA+A-TOOLS+A-RETRY | P16:BR-MIXED | W01/chat/I01/V01 | conditional | P16:BR-MIXED;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | f8c0558dfefa6eff |
| tg2-F14-P16-W02-4f491a70c813 | A-SCHEMA+A-TOOLS+A-RETRY | P16:BR-MIXED | W02/rag/I02/V03 | conditional | P16:BR-MIXED;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | 4f491a70c8135721 |
| tg2-F14-P16-W03-c07aca454a19 | A-SCHEMA+A-TOOLS+A-RETRY | P16:BR-MIXED | W03/extract/I03/V02 | conditional | P16:BR-MIXED;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | c07aca454a19c10f |
| tg2-F14-P16-W04-dead3a39b3ed | A-SCHEMA+A-TOOLS+A-RETRY | P16:BR-MIXED | W04/agent/I04/V04 | conditional | P16:BR-MIXED;F14:predicate | F14.M (tokens,cost,latency,quality) | F14.G (new-if-capability-captured) | T1 | dead3a39b3ed3337 |
| tg2-F15-P01-W01-2700814ad838 | A-RET+A-ROUTE+A-CACHEAPP | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2700814ad838e3db |
| tg2-F15-P01-W02-2e7a3b8ac033 | A-RET+A-ROUTE+A-CACHEAPP | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2e7a3b8ac0339775 |
| tg2-F15-P01-W03-1b786091c4d1 | A-RET+A-ROUTE+A-CACHEAPP | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 1b786091c4d1cd83 |
| tg2-F15-P01-W04-0cdd89e42b27 | A-RET+A-ROUTE+A-CACHEAPP | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 0cdd89e42b27b89b |
| tg2-F15-P02-W01-792bab34122b | A-RET+A-ROUTE+A-CACHEAPP | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 792bab34122b4108 |
| tg2-F15-P02-W02-57747843f7ad | A-RET+A-ROUTE+A-CACHEAPP | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 57747843f7adf204 |
| tg2-F15-P02-W03-00e391a85c5e | A-RET+A-ROUTE+A-CACHEAPP | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 00e391a85c5e14c6 |
| tg2-F15-P02-W04-ec767446d6a1 | A-RET+A-ROUTE+A-CACHEAPP | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | ec767446d6a1583a |
| tg2-F15-P03-W01-53b3690e7b5c | A-RET+A-ROUTE+A-CACHEAPP | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 53b3690e7b5c0bf5 |
| tg2-F15-P03-W02-0dd5039dc929 | A-RET+A-ROUTE+A-CACHEAPP | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 0dd5039dc9291263 |
| tg2-F15-P03-W03-ae487602150c | A-RET+A-ROUTE+A-CACHEAPP | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | ae487602150c71a9 |
| tg2-F15-P03-W04-fd45b2b9d7d1 | A-RET+A-ROUTE+A-CACHEAPP | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | fd45b2b9d7d1635d |
| tg2-F15-P04-W01-5a41c8b8b2c6 | A-RET+A-ROUTE+A-CACHEAPP | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 5a41c8b8b2c6fa42 |
| tg2-F15-P04-W02-80825678dc5b | A-RET+A-ROUTE+A-CACHEAPP | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 80825678dc5b4b5a |
| tg2-F15-P04-W03-45edae775d1e | A-RET+A-ROUTE+A-CACHEAPP | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 45edae775d1ec864 |
| tg2-F15-P04-W04-02a1ac5d29b1 | A-RET+A-ROUTE+A-CACHEAPP | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 02a1ac5d29b15dec |
| tg2-F15-P05-W01-e1fb0a0fd0cf | A-RET+A-ROUTE+A-CACHEAPP | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | e1fb0a0fd0cf0557 |
| tg2-F15-P05-W02-2548bf2aa3cc | A-RET+A-ROUTE+A-CACHEAPP | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2548bf2aa3ccce79 |
| tg2-F15-P05-W03-d5d179f2c2d9 | A-RET+A-ROUTE+A-CACHEAPP | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | d5d179f2c2d9c9b7 |
| tg2-F15-P05-W04-c0490980d1c4 | A-RET+A-ROUTE+A-CACHEAPP | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | c0490980d1c4f3bf |
| tg2-F15-P06-W01-2053f2f961f5 | A-RET+A-ROUTE+A-CACHEAPP | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2053f2f961f52fa4 |
| tg2-F15-P06-W02-2cf46178d416 | A-RET+A-ROUTE+A-CACHEAPP | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2cf46178d416c3a8 |
| tg2-F15-P06-W03-a0e28c6d7eb2 | A-RET+A-ROUTE+A-CACHEAPP | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | a0e28c6d7eb2c59a |
| tg2-F15-P06-W04-f3cc74bd1a64 | A-RET+A-ROUTE+A-CACHEAPP | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | f3cc74bd1a64c5ee |
| tg2-F15-P07-W01-0a7a4c980f2f | A-RET+A-ROUTE+A-CACHEAPP | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 0a7a4c980f2f2541 |
| tg2-F15-P07-W02-a36a5f6a93e3 | A-RET+A-ROUTE+A-CACHEAPP | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | a36a5f6a93e3fc27 |
| tg2-F15-P07-W03-8c84844ed526 | A-RET+A-ROUTE+A-CACHEAPP | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 8c84844ed5267ffd |
| tg2-F15-P07-W04-3e92c1ff0155 | A-RET+A-ROUTE+A-CACHEAPP | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 3e92c1ff01551c71 |
| tg2-F15-P08-W01-fb8c7bbe93cb | A-RET+A-ROUTE+A-CACHEAPP | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | fb8c7bbe93cba0ce |
| tg2-F15-P08-W02-21eb497a2451 | A-RET+A-ROUTE+A-CACHEAPP | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 21eb497a245199de |
| tg2-F15-P08-W03-29b061ced6ec | A-RET+A-ROUTE+A-CACHEAPP | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 29b061ced6ecd338 |
| tg2-F15-P08-W04-48dad03ed531 | A-RET+A-ROUTE+A-CACHEAPP | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 48dad03ed531b960 |
| tg2-F15-P09-W01-a53b4ce8782f | A-RET+A-ROUTE+A-CACHEAPP | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | a53b4ce8782f1123 |
| tg2-F15-P09-W02-117448b13694 | A-RET+A-ROUTE+A-CACHEAPP | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 117448b13694c91d |
| tg2-F15-P09-W03-5ac49cb8b121 | A-RET+A-ROUTE+A-CACHEAPP | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 5ac49cb8b121afdb |
| tg2-F15-P09-W04-f2decc8917a1 | A-RET+A-ROUTE+A-CACHEAPP | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | f2decc8917a16913 |
| tg2-F15-P10-W01-7274758804d2 | A-RET+A-ROUTE+A-CACHEAPP | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 7274758804d25205 |
| tg2-F15-P10-W02-f6bf7743e2fe | A-RET+A-ROUTE+A-CACHEAPP | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | f6bf7743e2febd53 |
| tg2-F15-P10-W03-1d368cc17df1 | A-RET+A-ROUTE+A-CACHEAPP | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 1d368cc17df118b9 |
| tg2-F15-P10-W04-89755c1a8577 | A-RET+A-ROUTE+A-CACHEAPP | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 89755c1a8577e68d |
| tg2-F15-P11-W01-001a1b586a82 | A-RET+A-ROUTE+A-CACHEAPP | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 001a1b586a828398 |
| tg2-F15-P11-W02-f5793c7da26d | A-RET+A-ROUTE+A-CACHEAPP | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | f5793c7da26d8274 |
| tg2-F15-P11-W03-446fe1d351f2 | A-RET+A-ROUTE+A-CACHEAPP | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 446fe1d351f2dad6 |
| tg2-F15-P11-W04-2ee498b345ef | A-RET+A-ROUTE+A-CACHEAPP | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 2ee498b345ef966a |
| tg2-F15-P12-W01-6f5feb709a0c | A-RET+A-ROUTE+A-CACHEAPP | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 6f5feb709a0ce9eb |
| tg2-F15-P12-W02-c93fb8b97880 | A-RET+A-ROUTE+A-CACHEAPP | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | c93fb8b97880be25 |
| tg2-F15-P12-W03-cea56a5b0f56 | A-RET+A-ROUTE+A-CACHEAPP | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | cea56a5b0f56d993 |
| tg2-F15-P12-W04-18574feea1d0 | A-RET+A-ROUTE+A-CACHEAPP | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 18574feea1d0524b |
| tg2-F15-P13-W01-6c9c9327f519 | A-RET+A-ROUTE+A-CACHEAPP | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 6c9c9327f5194556 |
| tg2-F15-P13-W02-1003f6de4fa6 | A-RET+A-ROUTE+A-CACHEAPP | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 1003f6de4fa65966 |
| tg2-F15-P13-W03-26de1971a4a3 | A-RET+A-ROUTE+A-CACHEAPP | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 26de1971a4a3f330 |
| tg2-F15-P13-W04-40877ab684f2 | A-RET+A-ROUTE+A-CACHEAPP | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 40877ab684f285b8 |
| tg2-F15-P14-W01-a2e18b107562 | A-RET+A-ROUTE+A-CACHEAPP | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | a2e18b107562a091 |
| tg2-F15-P14-W02-07a3d57011ed | A-RET+A-ROUTE+A-CACHEAPP | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 07a3d57011ed3257 |
| tg2-F15-P14-W03-197839f4583c | A-RET+A-ROUTE+A-CACHEAPP | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 197839f4583c5a0d |
| tg2-F15-P14-W04-81af07da2b5e | A-RET+A-ROUTE+A-CACHEAPP | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 81af07da2b5ec661 |
| tg2-F15-P15-W01-c706f142f246 | A-RET+A-ROUTE+A-CACHEAPP | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | c706f142f24695b4 |
| tg2-F15-P15-W02-105848908d72 | A-RET+A-ROUTE+A-CACHEAPP | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 105848908d721bd8 |
| tg2-F15-P15-W03-b6a2d8ec6222 | A-RET+A-ROUTE+A-CACHEAPP | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | b6a2d8ec6222dd2a |
| tg2-F15-P15-W04-7f52e592b7d1 | A-RET+A-ROUTE+A-CACHEAPP | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 7f52e592b7d19e1e |
| tg2-F15-P16-W01-de6cb550ca0f | A-RET+A-ROUTE+A-CACHEAPP | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | de6cb550ca0fb8e7 |
| tg2-F15-P16-W02-5189a03844fe | A-RET+A-ROUTE+A-CACHEAPP | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 5189a03844fe85e9 |
| tg2-F15-P16-W03-12df011b23d7 | A-RET+A-ROUTE+A-CACHEAPP | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 12df011b23d733c7 |
| tg2-F15-P16-W04-709cab0148ed | A-RET+A-ROUTE+A-CACHEAPP | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F15:predicate | F15.M (tokens,cost,latency,quality) | F15.G (new) | T2 | 709cab0148edf7af |
| tg2-F16-P01-W01-d12e4297fe71 | A-RET+A-ROUTE+A-SUM | P01:OA-GPT56 | W01/chat/I01/V01 | allowed | P01:OA-GPT56;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | d12e4297fe71f06c |
| tg2-F16-P01-W02-44601d213666 | A-RET+A-ROUTE+A-SUM | P01:OA-GPT56 | W02/rag/I02/V03 | allowed | P01:OA-GPT56;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 44601d213666a370 |
| tg2-F16-P01-W03-42b93fb4d27d | A-RET+A-ROUTE+A-SUM | P01:OA-GPT56 | W03/extract/I03/V02 | allowed | P01:OA-GPT56;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 42b93fb4d27d1352 |
| tg2-F16-P01-W04-88a308ab314b | A-RET+A-ROUTE+A-SUM | P01:OA-GPT56 | W04/agent/I04/V04 | allowed | P01:OA-GPT56;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 88a308ab314bfc46 |
| tg2-F16-P02-W01-e10abcf095de | A-RET+A-ROUTE+A-SUM | P02:OA-MINI | W01/chat/I01/V01 | allowed | P02:OA-MINI;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | e10abcf095de6e5f |
| tg2-F16-P02-W02-548bc2edbde8 | A-RET+A-ROUTE+A-SUM | P02:OA-MINI | W02/rag/I02/V03 | allowed | P02:OA-MINI;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 548bc2edbde8b481 |
| tg2-F16-P02-W03-0d1e184113b0 | A-RET+A-ROUTE+A-SUM | P02:OA-MINI | W03/extract/I03/V02 | allowed | P02:OA-MINI;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 0d1e184113b095ef |
| tg2-F16-P02-W04-7e4972672dc4 | A-RET+A-ROUTE+A-SUM | P02:OA-MINI | W04/agent/I04/V04 | allowed | P02:OA-MINI;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 7e4972672dc44117 |
| tg2-F16-P03-W01-dcd936565099 | A-RET+A-ROUTE+A-SUM | P03:AN-SONNET | W01/chat/I01/V01 | allowed | P03:AN-SONNET;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | dcd936565099198a |
| tg2-F16-P03-W02-08cf3138d6c0 | A-RET+A-ROUTE+A-SUM | P03:AN-SONNET | W02/rag/I02/V03 | allowed | P03:AN-SONNET;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 08cf3138d6c02062 |
| tg2-F16-P03-W03-2bfa4b8979f0 | A-RET+A-ROUTE+A-SUM | P03:AN-SONNET | W03/extract/I03/V02 | allowed | P03:AN-SONNET;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 2bfa4b8979f0fcbc |
| tg2-F16-P03-W04-a4abff103c6f | A-RET+A-ROUTE+A-SUM | P03:AN-SONNET | W04/agent/I04/V04 | allowed | P03:AN-SONNET;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | a4abff103c6f0c84 |
| tg2-F16-P04-W01-1e364e526493 | A-RET+A-ROUTE+A-SUM | P04:AN-HAIKU | W01/chat/I01/V01 | allowed | P04:AN-HAIKU;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 1e364e526493bfdd |
| tg2-F16-P04-W02-0c60bba6a5cf | A-RET+A-ROUTE+A-SUM | P04:AN-HAIKU | W02/rag/I02/V03 | allowed | P04:AN-HAIKU;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 0c60bba6a5cf01cb |
| tg2-F16-P04-W03-bee70f26118d | A-RET+A-ROUTE+A-SUM | P04:AN-HAIKU | W03/extract/I03/V02 | allowed | P04:AN-HAIKU;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | bee70f26118dcec1 |
| tg2-F16-P04-W04-c01e2078ebdf | A-RET+A-ROUTE+A-SUM | P04:AN-HAIKU | W04/agent/I04/V04 | allowed | P04:AN-HAIKU;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | c01e2078ebdf0a55 |
| tg2-F16-P05-W01-654d666c95f2 | A-RET+A-ROUTE+A-SUM | P05:GG-PRO | W01/chat/I01/V01 | allowed | P05:GG-PRO;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 654d666c95f246d0 |
| tg2-F16-P05-W02-b5552708f0c3 | A-RET+A-ROUTE+A-SUM | P05:GG-PRO | W02/rag/I02/V03 | allowed | P05:GG-PRO;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | b5552708f0c3122c |
| tg2-F16-P05-W03-5508f722c3a2 | A-RET+A-ROUTE+A-SUM | P05:GG-PRO | W03/extract/I03/V02 | allowed | P05:GG-PRO;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 5508f722c3a2139e |
| tg2-F16-P05-W04-9e192a26d793 | A-RET+A-ROUTE+A-SUM | P05:GG-PRO | W04/agent/I04/V04 | allowed | P05:GG-PRO;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 9e192a26d793e0b2 |
| tg2-F16-P06-W01-e98cdca77219 | A-RET+A-ROUTE+A-SUM | P06:GG-FLASH | W01/chat/I01/V01 | allowed | P06:GG-FLASH;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | e98cdca772192863 |
| tg2-F16-P06-W02-21deb11762ba | A-RET+A-ROUTE+A-SUM | P06:GG-FLASH | W02/rag/I02/V03 | allowed | P06:GG-FLASH;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 21deb11762ba135d |
| tg2-F16-P06-W03-da36daea35b6 | A-RET+A-ROUTE+A-SUM | P06:GG-FLASH | W03/extract/I03/V02 | allowed | P06:GG-FLASH;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | da36daea35b6cb1b |
| tg2-F16-P06-W04-f860b500ab79 | A-RET+A-ROUTE+A-SUM | P06:GG-FLASH | W04/agent/I04/V04 | allowed | P06:GG-FLASH;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f860b500ab794253 |
| tg2-F16-P07-W01-b102ffd71dd7 | A-RET+A-ROUTE+A-SUM | P07:BR-CLAUDE | W01/chat/I01/V01 | allowed | P07:BR-CLAUDE;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | b102ffd71dd7a80e |
| tg2-F16-P07-W02-dc356bcf330f | A-RET+A-ROUTE+A-SUM | P07:BR-CLAUDE | W02/rag/I02/V03 | allowed | P07:BR-CLAUDE;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | dc356bcf330fab1e |
| tg2-F16-P07-W03-f828799209f0 | A-RET+A-ROUTE+A-SUM | P07:BR-CLAUDE | W03/extract/I03/V02 | allowed | P07:BR-CLAUDE;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f828799209f02b78 |
| tg2-F16-P07-W04-9d3b1db26d6e | A-RET+A-ROUTE+A-SUM | P07:BR-CLAUDE | W04/agent/I04/V04 | allowed | P07:BR-CLAUDE;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 9d3b1db26d6e23a0 |
| tg2-F16-P08-W01-17d3b4e3c750 | A-RET+A-ROUTE+A-SUM | P08:XA-GROK | W01/chat/I01/V01 | allowed | P08:XA-GROK;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 17d3b4e3c7505e81 |
| tg2-F16-P08-W02-f281658cb1f6 | A-RET+A-ROUTE+A-SUM | P08:XA-GROK | W02/rag/I02/V03 | allowed | P08:XA-GROK;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f281658cb1f62767 |
| tg2-F16-P08-W03-e2d445825582 | A-RET+A-ROUTE+A-SUM | P08:XA-GROK | W03/extract/I03/V02 | allowed | P08:XA-GROK;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | e2d445825582353d |
| tg2-F16-P08-W04-a07de41f6ef7 | A-RET+A-ROUTE+A-SUM | P08:XA-GROK | W04/agent/I04/V04 | allowed | P08:XA-GROK;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | a07de41f6ef712b1 |
| tg2-F16-P09-W01-a304336adf9b | A-RET+A-ROUTE+A-SUM | P09:DS-V4 | W01/chat/I01/V01 | allowed | P09:DS-V4;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | a304336adf9b42e4 |
| tg2-F16-P09-W02-d0d5221383b7 | A-RET+A-ROUTE+A-SUM | P09:DS-V4 | W02/rag/I02/V03 | allowed | P09:DS-V4;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | d0d5221383b799e8 |
| tg2-F16-P09-W03-1f1dac927b69 | A-RET+A-ROUTE+A-SUM | P09:DS-V4 | W03/extract/I03/V02 | allowed | P09:DS-V4;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 1f1dac927b691fda |
| tg2-F16-P09-W04-1caa4dc7fabf | A-RET+A-ROUTE+A-SUM | P09:DS-V4 | W04/agent/I04/V04 | allowed | P09:DS-V4;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 1caa4dc7fabfe32e |
| tg2-F16-P10-W01-1c3de7e4f9ed | A-RET+A-ROUTE+A-SUM | P10:KI-K27 | W01/chat/I01/V01 | allowed | P10:KI-K27;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 1c3de7e4f9ed11fa |
| tg2-F16-P10-W02-d0b6d97accb6 | A-RET+A-ROUTE+A-SUM | P10:KI-K27 | W02/rag/I02/V03 | allowed | P10:KI-K27;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | d0b6d97accb60172 |
| tg2-F16-P10-W03-871cd3ef78cb | A-RET+A-ROUTE+A-SUM | P10:KI-K27 | W03/extract/I03/V02 | allowed | P10:KI-K27;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 871cd3ef78cb9e2c |
| tg2-F16-P10-W04-95b39831db60 | A-RET+A-ROUTE+A-SUM | P10:KI-K27 | W04/agent/I04/V04 | allowed | P10:KI-K27;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 95b39831db608994 |
| tg2-F16-P11-W01-5a283a878ff7 | A-RET+A-ROUTE+A-SUM | P11:QW-Q3 | W01/chat/I01/V01 | allowed | P11:QW-Q3;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 5a283a878ff7ed4f |
| tg2-F16-P11-W02-243c9b761275 | A-RET+A-ROUTE+A-SUM | P11:QW-Q3 | W02/rag/I02/V03 | allowed | P11:QW-Q3;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 243c9b761275fa51 |
| tg2-F16-P11-W03-7663b7ff382a | A-RET+A-ROUTE+A-SUM | P11:QW-Q3 | W03/extract/I03/V02 | allowed | P11:QW-Q3;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 7663b7ff382a871f |
| tg2-F16-P11-W04-6aad608a3b04 | A-RET+A-ROUTE+A-SUM | P11:QW-Q3 | W04/agent/I04/V04 | allowed | P11:QW-Q3;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 6aad608a3b046327 |
| tg2-F16-P12-W01-7b17a004042b | A-RET+A-ROUTE+A-SUM | P12:MI-SMALL | W01/chat/I01/V01 | allowed | P12:MI-SMALL;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 7b17a004042b0e5c |
| tg2-F16-P12-W02-e529a2d5f454 | A-RET+A-ROUTE+A-SUM | P12:MI-SMALL | W02/rag/I02/V03 | allowed | P12:MI-SMALL;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | e529a2d5f454b740 |
| tg2-F16-P12-W03-f970708cbd05 | A-RET+A-ROUTE+A-SUM | P12:MI-SMALL | W03/extract/I03/V02 | allowed | P12:MI-SMALL;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f970708cbd057a82 |
| tg2-F16-P12-W04-2668f67e185b | A-RET+A-ROUTE+A-SUM | P12:MI-SMALL | W04/agent/I04/V04 | allowed | P12:MI-SMALL;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 2668f67e185bf456 |
| tg2-F16-P13-W01-b8e83678a001 | A-RET+A-ROUTE+A-SUM | P13:CO-COMMAND | W01/chat/I01/V01 | allowed | P13:CO-COMMAND;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | b8e83678a001ef59 |
| tg2-F16-P13-W02-166aeee1450f | A-RET+A-ROUTE+A-SUM | P13:CO-COMMAND | W02/rag/I02/V03 | allowed | P13:CO-COMMAND;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 166aeee1450f9eff |
| tg2-F16-P13-W03-0b87b9d1a2a6 | A-RET+A-ROUTE+A-SUM | P13:CO-COMMAND | W03/extract/I03/V02 | allowed | P13:CO-COMMAND;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 0b87b9d1a2a659a5 |
| tg2-F16-P13-W04-eb9013214202 | A-RET+A-ROUTE+A-SUM | P13:CO-COMMAND | W04/agent/I04/V04 | allowed | P13:CO-COMMAND;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | eb9013214202c299 |
| tg2-F16-P14-W01-599f7a346258 | A-RET+A-ROUTE+A-SUM | P14:SELF-VLLM-LLAMA | W01/chat/I01/V01 | allowed | P14:SELF-VLLM-LLAMA;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 599f7a3462581dbe |
| tg2-F16-P14-W02-4ab3d8245bbc | A-RET+A-ROUTE+A-SUM | P14:SELF-VLLM-LLAMA | W02/rag/I02/V03 | allowed | P14:SELF-VLLM-LLAMA;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 4ab3d8245bbc396e |
| tg2-F16-P14-W03-31698cc6032d | A-RET+A-ROUTE+A-SUM | P14:SELF-VLLM-LLAMA | W03/extract/I03/V02 | allowed | P14:SELF-VLLM-LLAMA;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 31698cc6032d9ae8 |
| tg2-F16-P14-W04-f8452bb4bb4c | A-RET+A-ROUTE+A-SUM | P14:SELF-VLLM-LLAMA | W04/agent/I04/V04 | allowed | P14:SELF-VLLM-LLAMA;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f8452bb4bb4c2570 |
| tg2-F16-P15-W01-ae85a74b8385 | A-RET+A-ROUTE+A-SUM | P15:SELF-VLLM-QWEN | W01/chat/I01/V01 | allowed | P15:SELF-VLLM-QWEN;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | ae85a74b8385d093 |
| tg2-F16-P15-W02-3705971b1b70 | A-RET+A-ROUTE+A-SUM | P15:SELF-VLLM-QWEN | W02/rag/I02/V03 | allowed | P15:SELF-VLLM-QWEN;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 3705971b1b708f6d |
| tg2-F16-P15-W03-c26371ba781e | A-RET+A-ROUTE+A-SUM | P15:SELF-VLLM-QWEN | W03/extract/I03/V02 | allowed | P15:SELF-VLLM-QWEN;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | c26371ba781ea50b |
| tg2-F16-P15-W04-f8d0b61c92fe | A-RET+A-ROUTE+A-SUM | P15:SELF-VLLM-QWEN | W04/agent/I04/V04 | allowed | P15:SELF-VLLM-QWEN;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | f8d0b61c92fe3723 |
| tg2-F16-P16-W01-9e387c55e523 | A-RET+A-ROUTE+A-SUM | P16:BR-MIXED | W01/chat/I01/V01 | allowed | P16:BR-MIXED;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 9e387c55e5238080 |
| tg2-F16-P16-W02-acb5f0861e6a | A-RET+A-ROUTE+A-SUM | P16:BR-MIXED | W02/rag/I02/V03 | allowed | P16:BR-MIXED;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | acb5f0861e6a0dfc |
| tg2-F16-P16-W03-1112ee6f0d06 | A-RET+A-ROUTE+A-SUM | P16:BR-MIXED | W03/extract/I03/V02 | allowed | P16:BR-MIXED;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 1112ee6f0d063cce |
| tg2-F16-P16-W04-70fd070f5dfa | A-RET+A-ROUTE+A-SUM | P16:BR-MIXED | W04/agent/I04/V04 | allowed | P16:BR-MIXED;F16:predicate | F16.M (tokens,cost,latency,quality) | F16.G (new) | T2 | 70fd070f5dfa3d82 |

## 5. Generator design (how to expand without duplicate methods)

The materialized table is generated by a checked-in registry job, not by title generation:

```text
for family in interactionFamilies:
  for provider in providerProfiles:
    for workload in workloadFixtures:
      candidate = bind(family, provider, workload)
      for inputVariant in allowedInputVariants(candidate):
        key = normalize(family.atoms, provider.binding, workload, inputVariant,
                        family.treatmentParams, qualityGate)
        if capability(candidate) and evidenceScope(candidate) and
           compatibility(candidate) == allowed_or_conditional and
           requestDiff(candidate) has >= 2 declared dimensions and
           novelty(key, methodAliases, recipeRegistry):
             emit(id(key), fingerprint(key), manifest(candidate))
```

The production generator should use provider **bindings**, not provider names, in `key`: for example `OA-explicit-boundary`, `AN-moving-breakpoint`, `GG-named-cache`, `DS-64-token-prefix`, and `MI-64-token-block`. Two rows with the same binding, atoms, workload, input shape, and treatment parameters collapse even if their model labels differ. A different binding survives only when the A/B request/processing path and evidence scope genuinely differ. The compact table uses the profile surface as the binding placeholder; the final importer must resolve and validate the binding before release.

### QA stages and failure statuses

1. **Schema:** require exactly three unique atoms, a family ID, profile ID, workload fixture, A/B patch, quality gate, source refs, and canonical fingerprint.
2. **Alias/canonical check:** resolve report-10 aliases and the report-12 160 recipe fingerprints; reject same intervention signatures, provider-only changes, effort/TTL sweeps presented as methods, and title variants.
3. **Capability:** check the exact API/model/region. Native schema, cache breakpoint, media, Batch, Flex, Priority, and tool fields fail closed when undocumented or absent in captured requests.
4. **Evidence:** intersect atom claim scopes with provider profile scope. `official` requires direct primary support; an unverified interaction is `derived` or `research`, never silently official.
5. **Request diff:** capture A and B. Reject a prose-only candidate when the family says request configuration, or a multi-variable diff when only one binding is declared.
6. **State/order:** cache runs are cold → controlled warm-up → warm repeats; Batch runs create real jobs; routing records route decisions; retries preserve every consumed attempt.
7. **Quality:** run at least three exploratory paired repeats per fixture, report median/spread, and use the predeclared exact/schema/task metric and non-inferiority margin. Production claims require a variance pilot, MDE/sample-size calculation, and stopping rule.
8. **Cost/latency:** record provider usage fields, billable units, queue wait, TTFT, completion time, retries, cache reads/writes, and price revision. Connected-plan token totals are never converted to API dollars.
9. **Release:** `T1` can be exposed after request/evidence/quality capture; `T2` needs a pilot or external service/interaction proof; unsupported rows remain research-only. A failed row is retained as a negative capability test, not counted as a recipe.

### Tier meanings

* **T1 — deterministic compound:** request/schema/cache/tool composition has an observable diff and deterministic or exact quality checks. It still needs end-to-end capture.
* **T2 — adaptive/economic compound:** routing, compression, summaries, application caches, retries, or provider economics add a learned threshold, state, or operational interaction. It needs a pilot, calibration, or accounting proof before a savings claim.
* A future `T3` may cover self-hosted serving/fine-tune/spot combinations; it must include amortized infrastructure cost and is not implied by these rows.

## 6. Truthful scale model

There are three different counts:

| Object | Meaning | Can be called a method? |
|---|---|---|
| atomic method | one intervention after semantic deduplication | yes |
| recipe/configuration | a valid compound interaction bound to a surface, workload, input variant, and quality contract | no; call it a recipe/configuration |
| evaluation run | one execution of a recipe on one fixture/repeat/order/state | no; call it a run |

The 1,024 rows are configurations. A product can truthfully expose **thousands** by adding valid workload fixtures, input sizes, cache states, regions, and model bindings to the same atomic methods. It can execute **millions of evaluations** by running each configuration over many fixtures and repeats. It must not multiply those axes into a “millions of methods” claim.

For example, after a registry has 150 deduplicated atoms/methods, 10 valid provider bindings, 8 workload families, 6 input variants, and 4 quality contracts, the upper configuration envelope is `150 × 10 × 8 × 6 × 4 = 288,000` candidate configurations. Capability/evidence/compatibility filtering should remove most of the Cartesian product; if 20% survive, 57,600 configurations is a defensible planning figure. With 25 fixtures × 3 exploratory repeats, that is 4.32 million evaluation runs—not 4.32 million methods. The current file makes the smaller, auditable claim of 1,024 materialized candidates and leaves future expansion to the generator gates.

## 7. Handoff contract

Persist each accepted manifest with:

```json
{
  "recipeId":"tg2-F01-P01-W02-<hash>",
  "fingerprint":"<fnv1a64>; optional sha256",
  "kind":"configuration",
  "methodAtoms":["A-CAN","A-CACHE","A-RET"],
  "providerProfile":"P01",
  "workloadFixture":"W02",
  "inputVariant":"V03",
  "qualityGate":"Q02",
  "compatibility":"allowed|conditional",
  "evidenceRefs":["provider docs", "atom sources"],
  "status":"new|new-if-capability-captured|supported|guided|research|rejected",
  "canonicalKey":"<sorted normalized JSON>"
}
```

No UI count should include `rejected`, `unsupported`, or alias rows. Counts should distinguish `atomicMethods`, `recipeConfigurations`, and `evaluationRuns`, and expose the evidence/support status beside each number.
