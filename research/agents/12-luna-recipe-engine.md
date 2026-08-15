# TokenGauge recipe engine: evidence, compatibility, and honest combinatorics

**Status:** design and research deliverable, 2026-08-15 UTC
**Scope:** compound, testable recipes built from the atomic interventions in `src/data/research-methods.json` and reports 04–08. This file does not change the application catalogue or claim that every listed recipe is currently runnable by the lab.

## Executive decision

TokenGauge should count an atomic method once and represent provider/model differences as scoped profiles. A recipe is a new, sellable unit only when it combines at least two non-overlapping interventions whose joint A/B procedure changes a real request, processing path, or serving architecture and whose interaction is measured. Renaming the same intervention, switching `low` to `minimal`, or appending a provider name is not a recipe.

The recipe set below contains **160 candidate recipes**. They are deliberately bounded, source-linked, and marked with applicability/caveat rules. They are not a promise that 160 adapters already exist. A recipe is `supported` only after its manifest and end-to-end capture pass the acceptance checks in §9; otherwise it is `guided` or `research`.

## 1. Atomic dimensions

An atom is a normalized intervention, not a title. Each atom has `atomId`, `kind`, `parameterDomain`, `supportedSurfaces`, `sourceRefs`, `grade`, and `lastVerified`. A provider profile supplies the exact model/API/region limits without cloning the atom.

| Dimension | Canonical values and examples | What must be held constant in A/B |
|---|---|---|
| provider/model surface (`P`) | `openai.responses:gpt-5.6`, `anthropic.messages:claude-*`, `google.generateContent:gemini-*`, `aws.bedrock:<model>`, `xai.responses:grok-*`, `deepseek.chat:deepseek-*`, `kimi.chat:k-*`, `qwen.dashscope:qwen-*`, `mistral.chat:mistral-*`, `cohere.v2:command-*`, `selfhost:vllm` | exact returned model ID, API version, account/project, auth path, tokenizer, and price revision |
| workload (`W`) | chat, extraction, classification, RAG, vision, video/audio, agent/tool loop, batch/eval, embedding/rerank, fine-tune/serving | same versioned fixtures, labels, corpus, tool backend, and correctness rubric |
| input shape (`I`) | text tokens, stable prefix + variable tail, image dimensions/detail, PDF/video duration, retrieved chunks, tool schemas/results, history blocks | same semantic input and byte-identical non-treatment fields; record rendered token count |
| cache state (`C`) | cold, warm, explicit named, implicit, moving-prefix, multi-breakpoint, disabled | cache key/prefix fingerprint, TTL, warm-up order, hit/miss/read/write tokens, and time between calls |
| routing (`R`) | fixed model, static task map, learned router, confidence cascade, capability/policy gate, semantic answer cache | candidate model availability, route policy, quality threshold, and fallback budget |
| output contract (`O`) | free text, verbosity, output cap, native JSON schema, enum/ID, array bound, tool arguments, stop delimiter | identical task and evaluator; validate syntax and semantics separately |
| latency tier (`L`) | interactive, standard, flex/off-peak, priority, batch/deferred, streaming | SLA/deadline, queue wait, time-to-first-token, completion time, and timeout policy |
| geography (`G`) | provider default, region/endpoint, data-residency region, self-host zone | same region eligibility, network path, residency/policy, and capacity class |
| batch mode (`B`) | synchronous, provider batch, flex, off-peak, spot/preemptible, continuous batch | same request set, completion deadline, retry/idempotency policy, and per-item accounting |
| quality gate (`Q`) | deterministic exact/JSON/schema, task metric, pairwise human/LLM judge, non-inferiority margin, abstain/fallback | predeclared rubric, seed/order policy, sample size, and stopping rule |

An atom may affect one dimension while depending on another. For example, `PS-AN-01` is a cache TTL *profile*, not a second caching method; `PS-XA-04` is a latency-price profile; `PS-CO-01` changes accounting, not model quality. Such dependencies are recorded in the recipe, but do not inflate the atomic count.

### Atom registry used by the recipes

The IDs below point to existing research IDs; the provider profile is explicit in each recipe.

* `A-CAN` = PC-02 (byte-stable canonical prefix); `A-CACHE` = PC-04/06/07/12/14/16 (provider-specific cache placement/boundaries); `A-CM` = PC-15 (read/write/miss telemetry); `A-TTL` = PC-11; `A-WARM` = CA-03; `A-STABLE` = CA-04.
* `A-WINDOW` = CTX-02/08/09; `A-COMP` = CTX-10/11/12/13; `A-SUM` = CMP-05/06/07/08/09/10/11; `A-RET` = RET-01/03/05/06/07/08/09/10/11/12.
* `A-SCHEMA` = SO-03/05/06/07; `A-TOOLS` = TL-02/03/04/05/06/07/08/10/11/12/13; `A-MEDIA` = MM-01–07.
* `A-ROUTE` = MRE-002/003/004/006; `A-CACHEAPP` = MRE-026; `A-QUALITY` = MRE-031–040; `A-BATCH` = MRE-011–020; `A-RETRY` = ER-01–07/MRE-047–052; `A-SERVE` = MRE-041/045/046.
* Provider-specific profiles: `P-OA` = PS-OA-01–06; `P-AN` = PS-AN-01–06; `P-GG` = PS-GG-01–06; `P-XA` = PS-XA-01–05; `P-DS` = PS-DS-01–05; `P-KI` = PS-KI-01–05; `P-QW` = PS-QW-01–06; `P-MI` = PS-MI-01–06; `P-CO` = PS-CO-01–06.

## 2. Compatibility and incompatibility rules

These rules are evaluated before a recipe ID is issued. `forbidden` means reject the manifest; `conditional` means require the stated fixture or provider profile; `allowed` means the composition is semantically meaningful.

1. **Same-lever prohibition (forbidden):** two atoms that mutate the same canonical field are one parameter sweep, not a compound recipe. Examples: `A-CACHE + A-CAN` is allowed (serialization plus cache placement), but `PC-02 + another “stable prefix” alias` is not; `OC-06 + OC-07` is one Gemini thinking ladder.
2. **Evidence intersection (conditional):** every provider/model/API/region claim must have a source for that exact surface. If a source only documents one provider, the recipe grade is `derived` and the unsupported provider is excluded—not silently inherited.
3. **Stateful cache order (conditional):** cache recipes require cold baseline, deterministic warm-up, warm repeats, prefix fingerprint, TTL, and read/write/miss fields. Randomized arm order is forbidden when warmth is the treatment.
4. **Batch/latency separation (conditional):** Batch, Flex, off-peak, Priority, and spot capacity are different `B/L` values. A synchronous request containing the word “batch” is not a Batch recipe. Completion time and deadline must be measured.
5. **Routing quality gate (conditional):** a router/cascade must report route counts, fallback rate, cost per successful task, and quality by route. A different model name without a route decision is a provider profile, not a recipe.
6. **Output/schema exclusivity:** native structured output, prompt-only JSON, and output caps are distinct only when request payloads and validators differ. “Return JSON” prose added to a native-schema request is not a new recipe.
7. **Preprocessing versus provider setting:** downsampling/cropping/transcript extraction may compose with provider media resolution; two provider resolution values alone are a single sweep. The original media must be retained for quality scoring.
8. **Geography policy:** region changes are a recipe dimension only when endpoint, data residency, or serving price/latency changes and policy permits both arms. Region spelling alone is not a recipe.
9. **Quality is a gate, not an intervention:** `Q` never creates a recipe by itself. It makes a compound intervention testable. Evaluation controls (randomization, repeats, graders) remain metadata/playbook atoms.
10. **No stacking discounts without proof:** cache + Batch, Batch + regional multiplier, or off-peak + Batch is allowed only if both provider docs and price/accounting fixtures show that discounts stack. Otherwise make separate recipes or mark `incompatible`.
11. **No cross-request semantic drift:** A and B must answer the same task. Changing the model, prompt, retrieval corpus, output contract, and quality rubric together is forbidden; at most declared treatment dimensions may change.
12. **Failure safety:** retry, timeout, idempotency, and admission-control atoms may compose with any request atom only if consumed attempts and partial work are retained in accounting.

## 3. Canonicalization, deduplication, and evidence inheritance

### Canonical form

Normalize a recipe before hashing:

```json
{
  "schemaVersion":"tg.recipe.v1",
  "atoms":["A-CAN","A-CACHE"],
  "provider":{"name":"openai","api":"responses","model":"gpt-5.6","region":"default"},
  "workload":"rag",
  "inputShape":"stable_prefix_variable_tail",
  "cacheState":"warm_30m",
  "routing":"fixed",
  "outputContract":"native_json",
  "latencyTier":"interactive",
  "geography":"default",
  "batchMode":"sync",
  "qualityGate":"exact_plus_noninferiority_2pct",
  "variant":{"a":"existing","b":"canonical_prefix_plus_explicit_breakpoint"}
}
```

Canonicalization steps: lowercase enums; resolve aliases to the surviving atomic ID; use exact provider/API/model/region IDs; normalize token counts to integers and durations to ISO-8601 seconds; sort `atoms` by atom ID; remove default-valued optional fields; encode JSON with sorted keys and no whitespace; hash UTF-8 bytes with SHA-256. The deterministic recipe ID is `tg-r1-<first-16-hex>`; a human slug may follow it but never determines identity. Same canonical form means same recipe, even if the title or prose differs.

Merge rules: provider-only changes become `providerProfiles[]`; model effort/verbosity values become `parameterSweep[]`; different workload/input shape, cache state, route decision, latency tier, geography, batch mode, or output contract may create a new recipe only when its A/B fixture changes and the compatibility matrix permits it. The eight duplicates in report 10 (`PC-08/CA-06`, CTX-10/PD-09, CTX-11/PD-06, CTX-12/PD-07, SO-01, TL-01, TL-09) are aliases, never recipe atoms. `lower-reasoning-effort` and server compaction similarly remain canonical methods with provider profiles.

### Evidence inheritance

Each atom source has `claimKeys` (mechanism, parameter, limit, price, API shape) and scope. Recipe evidence is the union of atom evidence plus a composition record:

* `official` only when each externally asserted mechanism/limit is directly supported for the exact provider/API/model surface;
* `derived` when the composition is a defensible engineering hypothesis from official atoms, with each unverified interaction explicitly labelled;
* `experiment` when the saving/quality effect is empirical and must be measured locally;
* `unsupported` when a required API field, price rule, or model capability is not documented or captured.

The recipe grade is the minimum atom grade, then downgraded one level for every unverified interaction (official → derived → experiment). Evidence is not proof of savings: the result remains `inconclusive` until the declared quality gate and repeat rule pass. Source records must include URL, publisher, claim key, provider/API/model/region scope, retrieval date, and optional effective interval.

### Evidence register (primary documentation/original papers)

`E-OA-CACHE` [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching); `E-OA-COUNT` [OpenAI token counting](https://developers.openai.com/api/docs/guides/token-counting); `E-OA-STRUCT` [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs); `E-OA-TOOLS` [OpenAI tools](https://developers.openai.com/api/docs/guides/function-calling); `E-OA-BATCH` [OpenAI Batch](https://developers.openai.com/api/docs/guides/batch); `E-OA-FLEX` [OpenAI Flex](https://developers.openai.com/api/docs/guides/flex-processing); `E-OA-COMP` [OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction); `E-OA-RET` [OpenAI retrieval](https://developers.openai.com/api/docs/guides/retrieval); `E-OA-MODEL` [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model); `E-OA-QUALITY` [OpenAI evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

`E-AN-CACHE` [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); `E-AN-TOOLS` [Anthropic context editing/tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context); `E-AN-COMP` [Anthropic compaction](https://platform.claude.com/docs/en/build-with-claude/compaction); `E-AN-BATCH` [Anthropic Message Batches](https://platform.claude.com/docs/en/build-with-claude/batch-processing); `E-AN-ERR` [Anthropic errors/retries](https://platform.claude.com/docs/en/api/errors).

`E-GG-CACHE` [Gemini caching](https://ai.google.dev/gemini-api/docs/generate-content/caching); `E-GG-STRUCT` [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output); `E-GG-FUNC` [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling); `E-GG-MEDIA` [Gemini image/video](https://ai.google.dev/gemini-api/docs/video-understanding); `E-GG-BATCH` [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api); `E-GG-THINK` [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking).

`E-BR-CACHE` [Bedrock prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html); `E-BR-ROUTE` [Bedrock prompt routing](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-routing.html); `E-BR-SPOT` [EC2 Spot best practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html).

`E-XA-CACHE` [xAI prompt caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching); `E-XA-BATCH` [xAI Batch](https://docs.x.ai/developers/advanced-api-usage/batch-api); `E-XA-PRIORITY` [xAI Priority](https://docs.x.ai/developers/advanced-api-usage/priority-processing); `E-DS-CACHE` [DeepSeek KV cache](https://api-docs.deepseek.com/guides/kv_cache/); `E-DS-THINK` [DeepSeek thinking](https://api-docs.deepseek.com/guides/thinking_mode/); `E-KI-CACHE` [Kimi context caching](https://platform.kimi.ai/docs/guide/use-context-caching-feature-of-kimi-api.md); `E-KI-BATCH` [Kimi Batch pricing](https://platform.kimi.ai/docs/pricing/batch.md); `E-QW-CACHE` [Qwen context cache](https://www.alibabacloud.com/help/en/model-studio/context-cache); `E-QW-THINK` [Qwen deep thinking](https://www.alibabacloud.com/help/en/model-studio/deep-thinking); `E-MI-BATCH` [Mistral Batch](https://docs.mistral.ai/studio/batch-processing); `E-MI-REGION` [Mistral regional inference](https://docs.mistral.ai/inference/regional-inference); `E-CO-UNITS` [Cohere billed units](https://docs.cohere.com/docs/how-does-cohere-pricing-work).

`E-PRESS-LING` [LLMLingua original paper](https://arxiv.org/abs/2310.05736); `E-PRESS-LONG` [LongLLMLingua original paper](https://arxiv.org/abs/2310.06839); `E-PRESS-SEL` [Selective Context original paper](https://arxiv.org/abs/2304.12102); `E-SPEC` [speculative decoding paper](https://proceedings.mlr.press/v202/leviathan23a.html); `E-PAGED` [PagedAttention paper](https://arxiv.org/abs/2309.06180).

### Measurement and caveat codes used in the catalogue

`M1` = paired median/p95 input, output, total tokens; provider billable units; latency; attempts; cost per successful task. `M2` = cache prefix fingerprint, hit/read/write/miss tokens, warm interval, storage rent and cost. `M3` = quality pass rate and non-inferiority margin, plus malformed/repair/abstain rate. `M4` = route counts, fallback rate, quality and cost by route. `M5` = queue wait, TTFT, completion time, deadline misses, and per-item batch cost. `M6` = schema/tool conformance, correct-tool/argument rate, round trips and tool-result tokens. `M7` = image/video/audio bytes, dimensions/frames/duration, media tokens, latency and task score. `M8` = retry class, `Retry-After`, attempts, duplicated tokens, success rate and deadline. `M9` = GPU utilization, throughput, memory, preemptions and cost per successful item. `M10` = retrieval recall/precision, retrieved tokens, answer score, citation support and latency. `M11` = exact task metric, human/LLM pairwise score, confidence interval and stopping rule.

`C1` provider/model/API fields and prices change; reverify at run time. `C2` cache behavior is stateful; cold/warm order and TTL are part of treatment. `C3` compression/media reduction can reduce quality; use a declared margin. `C4` batch/flex/priority trades latency or availability for price. `C5` routing/quality gates can add judge or fallback calls. `C6` self-host figures exclude hardware depreciation/ops unless explicitly included. `C7` connected ChatGPT-plan token totals are not API dollars. `C8` an interaction is derived until a local paired fixture validates it.

## 4. Recipe catalogue (160 concrete candidates)

Notation in each row is exact: `A:` baseline procedure; `B:` candidate procedure. `same` means all unmentioned dimensions are byte- and fixture-identical. The evidence column uses the register above. `N:` explains the semantic difference from every atom and from provider spelling aliases. `status` is the honest implementation expectation today.

### Cache, context, and retrieval (R001–R040)

| ID | Provider/model · workload/input · atoms | A → B procedure | Measure | Caveat; evidence | N / status |
|---|---|---|---|---|---|
| R001 | `openai:gpt-5.6` · RAG, 32k stable corpus + 1k query · CAN+CACHE+CM | A sends serialized corpus each call; B canonicalizes bytes, sets one explicit stable-prefix boundary, sends query unchanged. | M1,M2 | C1,C2; E-OA-CACHE,E-OA-COUNT | serialization + boundary, not either alone; guided |
| R002 | `openai:gpt-5.6` · agent, tools + variable history · CACHE+STABLE+CM | A changes effort/tool config between turns; B fixes both inside same cached session and varies only user tail. | M1,M2,M3 | C1,C2; E-OA-CACHE | config stability interaction; guided |
| R003 | `openai:gpt-5.6` · long chat · CACHE+TTL+CM | A implicit cache; B explicit 30-minute boundary on policy/tools only, with uncached tail. | M1,M2 | C1,C2; E-OA-CACHE | explicit write control + TTL; guided |
| R004 | `openai:gpt-5.6` · multimodal RAG · CAN+CACHE+MEDIA | A resends 20MB PDF; B canonicalizes immutable asset ID and caches asset before new questions. | M1,M2,M7 | C1,C2,C3; E-OA-CACHE | asset identity plus cache, not generic prefix; research |
| R005 | `openai:gpt-5.6` · support classification · CACHE+RET | A injects full 100k FAQ; B retrieves top 8 chunks under the stable policy prefix. | M1,M2,M10 | C2,C3,C8; E-OA-CACHE,E-OA-RET | retrieval changes input shape while cache preserves policy; guided |
| R006 | `anthropic:claude` · growing chat · CACHE(moving)+CM | A rewrites all history; B top-level ephemeral cache on every turn and appends one new tail. | M1,M2 | C1,C2; E-AN-CACHE | moving-prefix state, not generic caching; guided |
| R007 | `anthropic:claude` · tool agent · CACHE(4 breaks)+TOOLS+CM | A one breakpoint after full transcript; B breaks tools/policy/corpus/anchor separately, ≤4 slots. | M1,M2,M6 | C1,C2; E-AN-CACHE,E-AN-TOOLS | hierarchy interaction; guided |
| R008 | `anthropic:claude` · tool-heavy chat · CACHE(anchor)+TOOLS | A leaves 25+ blocks between writes; B consolidates tool blocks and places anchor within 20 blocks. | M1,M2,M6 | C1,C2; E-AN-CACHE | lookback constraint, not another cache key; guided |
| R009 | `anthropic:claude` · RAG · CACHE+TTL+RET | A 5m cache on corpus; B chooses 1h only when inter-arrival p90 exceeds 5m. | M1,M2,M10 | C1,C2,C8; E-AN-CACHE | empirically selected TTL; research |
| R010 | `anthropic:claude` · agent · WARM+CACHE | A parallel fan-out starts cold; B one warm request completes cache then releases 20 parallel calls. | M1,M2,M5 | C2,C4; E-AN-CACHE | concurrency/warm-up interaction; guided |
| R011 | `anthropic:claude` · agent · STABLE+CACHE | A changes effort/thinking on each turn; B keeps config constant through a cached session, then tests a new session. | M1,M2,M3 | C1,C2; E-AN-CACHE | stable config plus cache state; guided |
| R012 | `anthropic:claude` · PDF QA · CACHE+MEDIA | A uploads PDF on every question; B caches user-turn document and sends only question tail. | M1,M2,M7 | C1,C2,C3; E-AN-CACHE | document reuse, not text-only cache; research |
| R013 | `google:gemini` · legal RAG · CACHE(named)+TTL | A sends corpus inline; B creates named CachedContent once, references it for 30 questions, then deletes/records expiry. | M1,M2,M10 | C1,C2; E-GG-CACHE | explicit object economics; guided |
| R014 | `google:gemini` · chat · CACHE(implicit)+CAN | A variable JSON/tool order; B canonicalizes serialization and repeats same prefix 10 times. | M1,M2 | C1,C2; E-GG-CACHE | implicit cache diagnostic, not guarantee; research |
| R015 | `google:gemini` · video QA · CACHE(named)+MEDIA | A resends 10-minute video; B stores named cache of video and asks 20 unchanged questions. | M1,M2,M7 | C1,C2,C3; E-GG-CACHE,E-GG-MEDIA | video asset reuse; guided |
| R016 | `google:gemini` · extraction · CACHE(named)+SCHEMA | A sends schema and 50k document each call; B caches document/system, sends same native schema + one query. | M1,M2,M3 | C1,C2; E-GG-CACHE,E-GG-STRUCT | cache + contract interaction; guided |
| R017 | `google:gemini` · RAG · RET+CTX-COMP | A top-k=20 full chunks; B extracts query-relevant sentences from top-k=20 before generation. | M1,M3,M10 | C3,C8; E-OA-RET,E-PRESS-LONG | retrieval output compression, not chunk tuning; research |
| R018 | `google:gemini` · RAG · RET+QUALITY | A always retrieves; B skips retrieval when lexical/semantic gate score < threshold and compares answer quality. | M1,M3,M10 | C3,C5,C8; E-GG-CACHE | adaptive retrieval gate; research |
| R019 | `aws:bedrock:claude` · support chat · CACHE+CAN+CM | A sends noncanonical policy/tool order; B canonicalizes and adds provider-supported checkpoints after policy and corpus. | M1,M2 | C1,C2; E-BR-CACHE | Bedrock profile, not Anthropic duplicate; guided |
| R020 | `aws:bedrock:claude` · agent · CACHE+WINDOW | A retains all old tool blocks; B applies context-window pruning but preserves cached policy anchor. | M1,M2,M6 | C1,C2; E-BR-CACHE | pruning/cache interaction; guided |
| R021 | `xai:grok` · chat · CAN+CACHE | A rotates prompt serialization and no routing key; B exact stable prefix plus one stable cache-routing key per tenant. | M1,M2 | C1,C2; E-XA-CACHE | xAI affinity profile + serialization; guided |
| R022 | `xai:grok` · RAG · CACHE+RET | A injects complete tenant handbook; B exact cached handbook + top-6 retrieved updates. | M1,M2,M10 | C1,C2,C8; E-XA-CACHE | cached base + dynamic retrieval; research |
| R023 | `deepseek:chat` · code chat · CAN+CACHE+THINK | A changes serialized prefix and thinking mode; B preserves first 64-token disk-cacheable prefix and keeps reasoning setting stable. | M1,M2,M3 | C1,C2; E-DS-CACHE,E-DS-THINK | DeepSeek floor/config profile; guided |
| R024 | `deepseek:chat` · tool continuation · CACHE+TOOLS | A resends prior reasoning as ordinary history; B preserves reasoning content only across tool-call continuation. | M1,M2,M6 | C1,C2; E-DS-THINK | continuation semantics; research |
| R025 | `kimi:k2.7` · chat · CACHE+CAN | A changes opening context and block order; B preserves exact opening context and meets 256-token cache floor. | M1,M2 | C1,C2; E-KI-CACHE | Kimi floor profile; guided |
| R026 | `kimi:k2.7` · RAG · CACHE+RET | A sends whole corpus per question; B caches stable 256+ token corpus and retrieves only fresh deltas. | M1,M2,M10 | C1,C2,C8; E-KI-CACHE | cache + retrieval; research |
| R027 | `qwen:qwen3` · chat · CACHE+CAN | A mixes implicit and explicit cache assumptions; B runs explicit cache object and implicit mode as separate arms with independent accounting. | M1,M2 | C1,C2; E-QW-CACHE | two cache economics, not provider alias; guided |
| R028 | `qwen:qwen3` · batch RAG · CACHE+BATCH | A forecasts cache + Batch stacking; B measures Batch-only and cache-only arms, rejecting unverified stacking. | M1,M2,M5 | C1,C4,C8; E-QW-CACHE | discount compatibility recipe; research |
| R029 | `mistral:small` · chat · CAN+CACHE | A prefix blocks are arbitrary; B aligns stable prefix to 64-token cache blocks and records regional setting unchanged. | M1,M2 | C1,C2; E-MI-BATCH | block alignment profile; guided |
| R030 | `cohere:command` · classification · WINDOW+QUALITY | A sends full history; B truncates to a measured context budget and evaluates billed units, not tokenizer count. | M1,M3 | C1,C3; E-CO-UNITS | accounting semantics + windowing; guided |
| R031 | provider-neutral · long RAG · COMP+RET | A injects top-20 raw chunks; B query-aware LongLLMLingua compresses the same retrieved set before generation. | M1,M3,M10 | C3,C8; E-PRESS-LONG | compressor is distinct from retrieval rank; research |
| R032 | provider-neutral · long RAG · COMP+RET | A keeps all retrieved sentences; B Selective Context removes low-information tokens at fixed budget. | M1,M3,M10 | C3,C8; E-PRESS-SEL | token filtering versus query-aware compression; research |
| R033 | provider-neutral · evidence QA · RET+WINDOW | A top-k=20 unconstrained; B cap retrieved tokens at 8k with strongest evidence at context edges. | M1,M3,M10 | C3,C8; E-OA-RET | budget/position interaction; research |
| R034 | provider-neutral · support chat · SUM+WINDOW | A full history; B rolling typed summary + last 6 turns + pinned invariants. | M1,M3 | C3,C8; E-OA-COMP | summary tail versus raw-history pruning; guided |
| R035 | provider-neutral · agent · SUM+TOOLS | A retains all tool results; B structured summary preserves task state and clears served tool results. | M1,M3,M6 | C3,C8; E-AN-TOOLS,E-OA-COMP | typed state + tool context editing; guided |
| R036 | provider-neutral · memory chat · SUM+RET | A injects all memory observations; B consolidates observations into reflections and retrieves top-5 by relevance/recency/importance. | M1,M3,M10 | C3,C8; E-AN-TOOLS | consolidation + retrieval rank; research |
| R037 | provider-neutral · knowledge QA · RET(chunk)+COMP | A chunk size=200 tokens, overlap=50; B chunk at evidence units, overlap=10, then extracts useful sentences. | M1,M3,M10 | C3,C8; E-OA-RET | indexing and generation transforms both declared; research |
| R038 | provider-neutral · conversational RAG · RET(query)+QUALITY | A searches raw user utterance; B rewrites it to standalone query, then applies same retriever and gate. | M1,M3,M10 | C3,C8; E-OA-RET | query formulation, not retrieval ranking; guided |
| R039 | provider-neutral · multi-doc QA · RET+SUM | A concatenates top-8 documents; B synthesizes a 500-token evidence summary before answer. | M1,M3,M10 | C3,C8; E-OA-RET | abstractive retrieval summary; research |
| R040 | provider-neutral · archive QA · RET(tree)+WINDOW | A searches flat corpus top-20; B traverses recursive summary tree and injects top-4 leaves under 8k budget. | M1,M3,M10 | C3,C8; E-OA-RET | hierarchical index, not ordinary top-k; research |

### Output contracts, tools, and multimodal inputs (R041–R080)

| ID | Provider/model · workload/input · atoms | A → B procedure | Measure | Caveat; evidence | N / status |
|---|---|---|---|---|---|
| R041 | `openai:gpt-5.6` · invoice extraction · SCHEMA+QUALITY | A asks “return JSON”; B uses native strict schema with only 6 consumer fields. | M1,M3,M6 | C1,C3; E-OA-STRUCT | native schema + minimal contract; guided |
| R042 | `openai:gpt-5.6` · order extraction · SCHEMA+QUALITY | A unbounded line-item array; B schema/prompt bound array to 50 and validates overflow as abstain. | M1,M3 | C1,C3; E-OA-STRUCT | cardinality gate; guided |
| R043 | `openai:gpt-5.6` · CRM lookup · SCHEMA+TOOLS | A emits full records; B emits record IDs/enums and hydrates locally. | M1,M3,M6 | C1,C3; E-OA-STRUCT | compact contract + local hydration; guided |
| R044 | `openai:gpt-5.6` · agent · TOOLS+SCHEMA | A retries whole response on one invalid field; B repairs only invalid field under same schema. | M1,M3,M6,M8 | C1,C5; E-OA-STRUCT,E-OA-TOOLS | semantic repair, not generic retry; guided |
| R045 | `openai:gpt-5.6` · customer agent · TOOLS+CACHE | A sends 40 tools every turn; B stable-caches 8 core tools and loads the rest on demand. | M1,M2,M6 | C1,C2; E-OA-CACHE,E-OA-TOOLS | tool catalog loading + cache; guided |
| R046 | `openai:gpt-5.6` · multi-tool workflow · TOOLS | A sequentially asks for three independent calls; B requests parallel calls and aggregates locally. | M1,M6 | C1; E-OA-TOOLS | orchestration changes round trips; guided |
| R047 | `openai:gpt-5.6` · support chat · TOOLS+QUALITY | A always exposes search tool; B capability gate skips it when answer is in pinned context. | M1,M3,M6 | C3,C5; E-OA-TOOLS | tool decision gate; research |
| R048 | `openai:gpt-5.6` · hosted web agent · TOOLS+WINDOW | A allows unbounded fetched content; B caps fetched content and excludes nested traces from client response. | M1,M3,M6 | C1,C3; E-OA-TOOLS | fetched-content cap + payload projection; guided |
| R049 | `anthropic:claude` · extraction · SCHEMA+QUALITY | A prose extraction; B native structured output, minimal schema, semantic-only field repair. | M1,M3,M6,M8 | C1,C3; E-AN-TOOLS | three fields changed? schema + repair are declared; guided |
| R050 | `anthropic:claude` · tool agent · TOOLS+CACHE | A tool catalog changes each turn; B loads relevant tools on demand and caches stable definitions. | M1,M2,M6 | C1,C2; E-AN-CACHE,E-AN-TOOLS | catalog/cache interaction; guided |
| R051 | `anthropic:claude` · tool agent · TOOLS+WINDOW | A retains stale tool results; B clears results after use while retaining typed state. | M1,M3,M6 | C3; E-AN-TOOLS | result clearing, not prompt compression; guided |
| R052 | `anthropic:claude` · independent tool workflow · TOOLS | A serial tool calls; B parallelizes only independent calls, preserving dependency order. | M1,M6 | C1; E-AN-TOOLS | concurrency semantics; guided |
| R053 | `anthropic:claude` · web agent · TOOLS+QUALITY | A unlimited web fetch; B caps uses/content and abstains when evidence threshold fails. | M1,M3,M6 | C3,C5; E-AN-TOOLS | hosted-tool budget + quality gate; guided |
| R054 | `google:gemini` · JSON extraction · SCHEMA+QUALITY | A prompt-only JSON; B native schema with enum/boolean IDs and bounded array. | M1,M3,M6 | C1,C3; E-GG-STRUCT | contract combination, not schema alias; guided |
| R055 | `google:gemini` · function agent · TOOLS+SCHEMA | A verbose arguments and nested optional fields; B concise descriptions and removes unused nesting. | M1,M3,M6 | C1,C3; E-GG-FUNC | schema reduction + description reduction; guided |
| R056 | `google:gemini` · agent · TOOLS | A calls tools serially; B uses parallel function calls for independent operations. | M1,M6 | C1; E-GG-FUNC | provider-native parallelism; guided |
| R057 | `aws:bedrock:claude` · extraction · SCHEMA+QUALITY | A returns full text records; B strict provider-supported schema returns IDs and local hydration. | M1,M3,M6 | C1,C3; E-BR-CACHE | Bedrock profile + output contract; guided |
| R058 | `xai:grok` · extraction · SCHEMA+QUALITY | A prose with post-parser; B provider-supported structured response or local validator, with unsupported native path marked. | M1,M3 | C1,C3,C8; E-XA-CACHE | capability-specific xAI profile; research |
| R059 | `qwen:qwen3` · tool agent · TOOLS+THINK | A leaves thinking maximum dynamic; B caps/turns off thinking for routine tool selection and validates call quality. | M1,M3,M6 | C1,C3; E-QW-THINK | thinking setting + tool task; guided |
| R060 | `mistral:small` · tool extraction · TOOLS+QUALITY | A full tool descriptions; B concise descriptions, remove unused parameters, and measure correct calls. | M1,M3,M6 | C1,C3; E-MI-BATCH | tool schema compaction; guided |
| R061 | `openai:gpt-5.6` · coarse image classification · MEDIA+QUALITY | A original image with detail high; B `detail:low` plus same label rubric. | M1,M3,M7 | C1,C3; E-OA-TOOLS | setting + quality, not downsample alone; guided |
| R062 | `openai:gpt-5.6` · receipt OCR · MEDIA+QUALITY | A 4k image; B downsample to smallest resolution preserving text legibility. | M1,M3,M7 | C1,C3; E-OA-TOOLS | preprocessing intervention; guided |
| R063 | `openai:gpt-5.6` · chart QA · MEDIA+QUALITY | A full page; B crop chart region and use low detail. | M1,M3,M7 | C1,C3; E-OA-TOOLS | crop + detail interaction; guided |
| R064 | `openai:gpt-5.6` · image RAG · MEDIA+CACHE | A resends image; B canonical asset ID/cache plus low detail for query-specific visual answer. | M1,M2,M3,M7 | C1–C3; E-OA-CACHE | asset cache + visual resolution; research |
| R065 | `anthropic:claude` · PDF extraction · MEDIA+SCHEMA | A sends full high-resolution PDF each question; B cache PDF, request minimal schema, repair invalid fields only. | M1,M2,M3,M7 | C1–C3; E-AN-CACHE | document cache + output contract; guided |
| R066 | `anthropic:claude` · image moderation · MEDIA+QUALITY | A original dimensions; B downsample to task-sufficient resolution, retaining moderation recall margin. | M1,M3,M7 | C1,C3; E-AN-TOOLS | quality-sensitive media preprocessing; guided |
| R067 | `google:gemini` · image classification · MEDIA+QUALITY | A default media resolution; B set low media resolution per part and test accuracy margin. | M1,M3,M7 | C1,C3; E-GG-MEDIA | provider-specific media setting; guided |
| R068 | `google:gemini` · video scene search · MEDIA+QUALITY | A full resolution video; B low media resolution plus trim to relevant time range. | M1,M3,M7 | C1,C3; E-GG-MEDIA | resolution + duration; guided |
| R069 | `google:gemini` · video transcript QA · MEDIA+QUALITY | A sends video; B sends transcript-only when questions are linguistic. | M1,M3,M7 | C3; E-GG-MEDIA | modality substitution; guided |
| R070 | `google:gemini` · repeated video QA · MEDIA+CACHE | A resends video; B named-cache video, low media resolution for non-visual follow-ups. | M1,M2,M3,M7 | C1–C3; E-GG-CACHE,E-GG-MEDIA | cache + media setting; research |
| R071 | `aws:bedrock:claude` · image support · MEDIA+CACHE | A resends PDF/image; B cached immutable asset with provider-supported content block and same question tail. | M1,M2,M7 | C1,C2,C3; E-BR-CACHE | Bedrock asset cache profile; guided |
| R072 | `xai:grok` · image classification · MEDIA+QUALITY | A original image; B provider-supported lower-resolution payload, or mark unsupported if surface lacks control. | M1,M3,M7 | C1,C3,C8; E-XA-CACHE | explicit capability check; research |
| R073 | `openai:gpt-5.6` · audio intent · MEDIA+SCHEMA | A sends audio + free text; B transcript-only + native intent enum when acoustic cues are irrelevant. | M1,M3,M7 | C1,C3; E-OA-COUNT,E-OA-STRUCT | modality + contract; guided |
| R074 | `google:gemini` · audio QA · MEDIA+QUALITY | A full audio; B trim silence/time range and compare answer score. | M1,M3,M7 | C3; E-GG-MEDIA | duration preprocessing; guided |
| R075 | provider-neutral · document extraction · MEDIA+COMP | A full OCR text; B extract only useful sentences before schema generation. | M1,M3,M7 | C3,C8; E-PRESS-SEL | media-to-text plus compression; research |
| R076 | provider-neutral · image batch · MEDIA+BATCH | A synchronous one-image calls; B preprocess/downsample then submit provider Batch. | M1,M3,M5,M7 | C3,C4; E-OA-BATCH,E-GG-BATCH | preprocessing + deferred tier; guided |
| R077 | provider-neutral · video batch · MEDIA+BATCH | A sync full videos; B trim to representative frames and submit deferred batch. | M1,M3,M5,M7 | C3,C4; E-GG-MEDIA,E-GG-BATCH | frame sampling + Batch; research |
| R078 | provider-neutral · screenshot extraction · MEDIA+QUALITY | A full screenshots; B ROI crop plus deterministic exact-field grader. | M1,M3,M7 | C3; E-OA-TOOLS | crop is intervention; grader only gate; guided |
| R079 | provider-neutral · multimodal RAG · MEDIA+RET | A inject all pages/images; B retrieve page regions, crop, then answer from selected evidence. | M1,M3,M7,M10 | C3,C8; E-OA-RET | multimodal retrieval; research |
| R080 | provider-neutral · video event detection · MEDIA+ROUTE | A use large model for every clip; B cheap transcript/thumbnail gate routes only ambiguous clips to vision model. | M1,M3,M4,M7 | C3,C5; E-GG-MEDIA | modality gate + route; research |

### Routing, quality, and model economics (R081–R120)

| ID | Provider/model · workload/input · atoms | A → B procedure | Measure | Caveat; evidence | N / status |
|---|---|---|---|---|---|
| R081 | cross-provider · FAQ classification · ROUTE+QUALITY | A fixed strong model; B learned weak/strong router trained on production features, fallback on uncertainty. | M1,M3,M4,M11 | C5,C8; E-OA-QUALITY | learned routing, not static model choice; research |
| R082 | cross-provider · support chat · ROUTE+QUALITY | A strong model every request; B confidence-gated cascade: small first, strong only below 0.9 confidence. | M1,M3,M4 | C5,C8; E-OA-QUALITY | cascade interaction; research |
| R083 | cross-provider · extraction · ROUTE+SCHEMA | A one model; B capability/policy prefilter routes schema-capable compliant tasks to cheapest eligible model. | M1,M3,M4 | C1,C5; E-OA-MODEL | policy route + output contract; guided |
| R084 | cross-provider · RAG · ROUTE+RET | A fixed top-k and model; B adaptive retrieval depth then routes unresolved queries to strong model. | M1,M3,M4,M10 | C3,C5,C8; E-OA-RET | retrieval depth + route; research |
| R085 | cross-provider · summarization · ROUTE+WINDOW | A strong model with full context; B token-count-aware route: short context small model, long context strong model with window cap. | M1,M3,M4 | C1,C3,C5; E-OA-COUNT | cost-aware route + input shape; guided |
| R086 | `aws:bedrock` · general chat · ROUTE+QUALITY | A fixed model; B managed Bedrock prompt routing with predeclared quality threshold. | M1,M3,M4 | C1,C5; E-BR-ROUTE | managed route, not provider profile; guided |
| R087 | `aws:bedrock` · regulated extraction · ROUTE+GEO | A default region/model; B hard capability/policy prefilter routes only to compliant region/model. | M1,M3,M4 | C1,C5; E-BR-ROUTE | geography is policy-bearing; guided |
| R088 | `openai:gpt-5.6` + mini · extraction · ROUTE+SCHEMA | A GPT-5.6 always; B mini handles schema-valid easy cases, strong model handles uncertainty. | M1,M3,M4 | C1,C5; E-OA-STRUCT | model cascade with same contract; guided |
| R089 | `anthropic:claude` + Haiku/Sonnet · agent · ROUTE+TOOLS | A Sonnet all turns; B static task map sends deterministic tool lookup to smaller model, reasoning turns strong. | M1,M3,M4,M6 | C1,C5; E-AN-TOOLS | task route, not effort ladder; guided |
| R090 | `google:gemini` Flash/Pro · RAG · ROUTE+QUALITY | A Pro all queries; B Flash answers high-confidence retrieval hits, Pro receives abstentions. | M1,M3,M4,M10 | C1,C5; E-GG-THINK | route + retrieval quality; guided |
| R091 | `xai:grok` · latency-valued chat · ROUTE+L | A Priority every request; B Standard default, Priority only when deadline value exceeds 2x price. | M1,M4,M5 | C1,C4; E-XA-PRIORITY | latency tier economics; guided |
| R092 | `deepseek` V4 Flash/Pro · routine QA · ROUTE+QUALITY | A Pro all tasks; B Flash handles routine class, Pro only low-confidence/complex cases. | M1,M3,M4 | C1,C5; E-DS-THINK | provider model route; guided |
| R093 | `kimi` K2.7 Highspeed/K3 · chat · ROUTE+L | A highest-speed tier all requests; B standard tier unless measured latency value crosses threshold. | M1,M4,M5 | C1,C4; E-KI-BATCH | latency route; guided |
| R094 | `qwen` Flash/Plus · extraction · ROUTE+QUALITY | A Plus all tasks; B Flash handles bounded schema tasks, Plus handles failed/ambiguous. | M1,M3,M4 | C1,C5; E-QW-THINK | model route + schema gate; guided |
| R095 | `mistral` Small/Medium · classification · ROUTE+QUALITY | A Medium all rows; B Small default, Medium for low-margin classes. | M1,M3,M4 | C1,C5; E-MI-REGION | route not mere provider profile; guided |
| R096 | `cohere` Command R7B/large · retrieval QA · ROUTE+QUALITY | A large all queries; B R7B for short retrieved context, large for evidence conflicts. | M1,M3,M4,M10 | C1,C5; E-CO-UNITS | billed units included; guided |
| R097 | provider-neutral · semantic FAQ · CACHEAPP+QUALITY | A calls model every query; B semantic answer cache with similarity threshold and invalidation on source version. | M1,M3,M4 | C5,C8; E-OA-QUALITY | application answer cache, not provider prompt cache; research |
| R098 | provider-neutral · support tickets · CACHEAPP+ROUTE | A semantic cache only; B cache exact high-confidence answers, route misses to small/strong cascade. | M1,M3,M4 | C5,C8; E-OA-QUALITY | answer cache + fallback route; research |
| R099 | provider-neutral · coding assistant · ROUTE+QUALITY | A strong model on every edit; B syntax/static checks route trivial edits to small model and failures to strong. | M1,M3,M4 | C5; E-OA-QUALITY | deterministic gate + route; guided |
| R100 | provider-neutral · moderation · ROUTE+QUALITY | A large model all content; B deterministic policy filter first, model only uncertain cases, human review on narrow band. | M1,M3,M4 | C5; E-OA-QUALITY | multi-stage safety gate; guided |
| R101 | provider-neutral · RAG · RET+ROUTE | A retrieve top-20 then strong model; B retrieval score chooses top-k and model tier jointly under cost budget. | M1,M3,M4,M10 | C3,C5,C8; E-OA-RET | joint route objective; research |
| R102 | provider-neutral · agent · ROUTE+TOOLS | A agent model can call all tools; B capability prefilter routes tool-free answers directly and tool tasks to agent. | M1,M3,M4,M6 | C5; E-OA-TOOLS | tool route, not tool catalog reduction; guided |
| R103 | provider-neutral · extraction · ROUTE+SCHEMA | A retry malformed outputs; B route schema-incompatible model away before first paid call. | M1,M3,M4,M8 | C1,C5; E-OA-STRUCT | capability gate avoids paid retries; guided |
| R104 | provider-neutral · batch evaluation · ROUTE+QUALITY | A judge model scores all outputs; B deterministic graders first, judge only disagreements. | M1,M3,M4,M11 | C5,C8; E-OA-QUALITY | evaluator routing; research |
| R105 | provider-neutral · long chat · ROUTE+SUM | A strong model sees full history; B summary quality gate routes compacted state to small model unless state loss detected. | M1,M3,M4 | C3,C5,C8; E-OA-COMP | state-aware route; research |
| R106 | `openai:gpt-5.6` · routine text · O(verbosity)+QUALITY | A default verbosity; B low verbosity setting with identical prompt and task-sized cap held constant. | M1,M3 | C1,C3; E-OA-MODEL | one request parameter, not prompt rewrite; guided |
| R107 | `openai:gpt-5.6` · routine reasoning · O(effort)+QUALITY | A medium reasoning effort; B low effort, same model/prompt/output contract. | M1,M3 | C1,C3; E-OA-MODEL | effort ladder is parameter sweep; guided |
| R108 | `anthropic:claude` · simple extraction · O(effort)+QUALITY | A default effort; B low effort with same cached prefix and schema. | M1,M2,M3 | C1,C2,C3; E-AN-CACHE | provider profile of effort atom; guided |
| R109 | `google:gemini` · routine classification · O(thinking)+QUALITY | A dynamic thinking; B disabled thinking, same prompt and label rubric. | M1,M3 | C1,C3; E-GG-THINK | thinking profile; guided |
| R110 | `google:gemini` · difficult extraction · O(thinking)+QUALITY | A unbounded thinking; B bounded thinking budget selected by pilot, same schema. | M1,M3 | C1,C3; E-GG-THINK | bounded versus disabled is a declared sweep; guided |
| R111 | `deepseek` · routine QA · O(thinking)+QUALITY | A V4 thinking on; B off for routine class, same output contract. | M1,M3 | C1,C3; E-DS-THINK | provider-specific setting; guided |
| R112 | `qwen` · routine extraction · O(thinking)+QUALITY | A maximum thinking; B cap thinking at fixed budget and measure billed thought tokens. | M1,M3 | C1,C3; E-QW-THINK | thought-token accounting; guided |
| R113 | `kimi:k3` · routine code · O(thinking)+QUALITY | A default maximum reasoning; B override to bounded reasoning, same test suite. | M1,M3 | C1,C3; E-KI-BATCH | parameter sweep; guided |
| R114 | `openai:gpt-5.6` · report generation · O(cap)+QUALITY | A no hard cap; B max output 600 tokens, long-output fixture and same rubric. | M1,M3 | C1,C3; E-OA-MODEL | transport must prove field survives; research |
| R115 | provider-neutral · list extraction · O(cap)+SCHEMA | A unbounded array; B schema max 20 plus output cap, overflow abstains. | M1,M3 | C3; E-OA-STRUCT | two distinct controls explicitly measured; guided |
| R116 | provider-neutral · API response · O(delimiter)+QUALITY | A free continuation; B stop at `END_RECORD` delimiter and validate truncation. | M1,M3 | C3; E-OA-STRUCT | delimiter differs from max token cap; guided |
| R117 | provider-neutral · eval scoring · QUALITY+ROUTE | A LLM judge every sample; B deterministic grader first and judge on disagreement. | M1,M3,M4,M11 | C5; E-OA-QUALITY | quality-infrastructure recipe; research |
| R118 | provider-neutral · eval scoring · QUALITY+ROUTE | A one model judge; B human-calibrated judge with blind pairwise ranking and calibration set. | M3,M11 | C5,C8; E-OA-QUALITY | judge calibration, not task routing; research |
| R119 | provider-neutral · cost program · QUALITY+M1 | A totals only; B capture every billed dimension, tag feature/tenant/experiment, reconcile invoice. | M1,M11 | C1,C8; E-OA-QUALITY | observability composition; guided |
| R120 | provider-neutral · regression suite · QUALITY+ROUTE | A deploy after mean-cost drop; B deploy only when cost Pareto improves and quality non-inferiority passes. | M1,M3,M11 | C5,C8; E-OA-QUALITY | release gate, not another optimization; research |

### Batch, latency, geography, retries, and serving (R121–R160)

| ID | Provider/model · workload/input · atoms | A → B procedure | Measure | Caveat; evidence | N / status |
|---|---|---|---|---|---|
| R121 | `openai` · offline classification · BATCH+QUALITY | A synchronous calls; B creates one real Batch job with same JSONL requests and records completion. | M1,M3,M5 | C1,C4; E-OA-BATCH | real Batch lifecycle required; guided |
| R122 | `openai` · latency-tolerant summarization · FLEX+QUALITY | A standard processing; B Flex processing under declared deadline and same fixtures. | M1,M3,M5 | C1,C4; E-OA-FLEX | Flex is not Batch; guided |
| R123 | `anthropic` · offline extraction · BATCH+QUALITY | A synchronous Messages; B Message Batch with identical requests and per-item result accounting. | M1,M3,M5 | C1,C4; E-AN-BATCH | Batch response order/status must be mapped; guided |
| R124 | `google` · offline vision · BATCH+QUALITY | A synchronous generateContent; B Gemini Batch with same media references and deadline. | M1,M3,M5,M7 | C1,C4; E-GG-BATCH | media URI/availability must match; guided |
| R125 | `xai:grok` · offline extraction · BATCH+QUALITY | A synchronous; B xAI Batch with stable request IDs and idempotent result join. | M1,M3,M5 | C1,C4; E-XA-BATCH | Batch discount/model list must be verified; guided |
| R126 | `mistral` · offline classification · BATCH+QUALITY | A synchronous; B Mistral Batch for supported model and request count. | M1,M3,M5 | C1,C4; E-MI-BATCH | 50% claim is model/account scoped; guided |
| R127 | `kimi` · offline chat eval · BATCH+QUALITY | A sync calls; B Kimi Batch on supported model list, retaining item-level failures. | M1,M3,M5 | C1,C4; E-KI-BATCH | batch price is profile; guided |
| R128 | `qwen` · offline RAG · BATCH+RET | A sync retrieval+generation; B batch only generation after identical retrieval snapshot. | M1,M3,M5,M10 | C1,C4,C8; E-QW-CACHE | separates retrieval timing from generation; research |
| R129 | `deepseek` · bulk classification · OFFPEAK+QUALITY | A peak schedule; B off-peak only after current UTC window is verified, same fixtures. | M1,M3,M5 | C1,C4; E-DS-CACHE | schedule is time-varying; research |
| R130 | `openai` · eval backfill · BATCH+QUALITY | A production queue; B route noninteractive eval/backfill to Batch, preserve exact seed/order. | M1,M3,M5 | C1,C4; E-OA-BATCH | workload split is the treatment; guided |
| R131 | `anthropic` · shared RAG corpus · CACHE+ BATCH | A Batch with repeated uncached corpus; B warm/cached corpus only if provider documents compatibility, otherwise mark incompatible. | M1,M2,M3,M5 | C1,C2,C4,C8; E-AN-CACHE,E-AN-BATCH | explicit non-stacking rule; research |
| R132 | `google` · shared RAG corpus · CACHE+BATCH | A explicit cache only; B Batch only; do not claim both discounts unless current docs/prices prove stacking. | M1,M2,M5 | C1,C2,C4,C8; E-GG-CACHE,E-GG-BATCH | compatibility test recipe; research |
| R133 | `xai:grok` · customer chat · PRIORITY+ROUTE | A Priority all; B Standard default, Priority only for SLA-critical route. | M1,M4,M5 | C1,C4; E-XA-PRIORITY | tier selection distinct from model route; guided |
| R134 | `mistral` · EU-regulated RAG · REGION+QUALITY | A default inference region; B regional inference endpoint with same model/corpus and residency gate. | M1,M3,M5 | C1,C4; E-MI-REGION | 10% multiplier must be billed per component; guided |
| R135 | `aws:bedrock` · regulated extraction · REGION+ROUTE | A global/default endpoint; B route to approved region only, fallback rejected rather than silently crossing policy. | M1,M3,M4,M5 | C1,C5; E-BR-ROUTE | geography + capability/policy gate; guided |
| R136 | self-host:vllm · offline eval · SPOT+BATCH | A on-demand GPU; B spot/preemptible worker with checkpointed batch and resume ledger. | M3,M5,M9 | C4,C6; E-BR-SPOT | interruption and restart cost included; research |
| R137 | self-host:vllm · serving · PAGED+QUALITY | A naïve per-request KV allocation; B PagedAttention with identical model and traffic replay. | M1,M3,M9 | C6,C8; E-PAGED | infrastructure effect, not API provider method; research |
| R138 | self-host:vllm · serving · PAGED+CONT_BATCH | A static batching; B continuous batching with same arrival trace and max latency SLA. | M1,M3,M5,M9 | C4,C6; E-PAGED | throughput/latency tradeoff; research |
| R139 | self-host · generation · SPEC+QUALITY | A ordinary decoding; B speculative decoding with fixed draft/target models and acceptance logging. | M1,M3,M9 | C6,C8; E-SPEC | implementation/model support required; research |
| R140 | self-host · fine-tuned classifier · FINETUNE+ROUTE | A large general model; B fine-tune smaller model on fixed task, route low-confidence to teacher. | M1,M3,M4,M9 | C5,C6,C8; E-OA-MODEL | training cost/amortization included; research |
| R141 | self-host · extraction · FINETUNE+SCHEMA | A few-shot prompt on general model; B fine-tuned small model with minimal schema and local validation. | M1,M3,M9 | C3,C6; E-OA-MODEL | data quality/drift caveat; research |
| R142 | provider-neutral · all workloads · RETRY+IDEMPOTENCY | A retries whole request on any error; B retry only transient class with idempotency ledger and in-flight dedupe. | M1,M8 | C1,C5; E-AN-ERR | failure-safe retry + dedupe; guided |
| R143 | provider-neutral · long generation · RETRY+STREAM | A buffered generation times out and replays; B stream and persist completed chunks before retrying only failed operation. | M1,M8 | C1,C8; E-AN-ERR | streaming availability differs; guided |
| R144 | provider-neutral · tool agent · RETRY+TOOLS | A retries whole agent turn after one tool failure; B preserve successful tool work and retry failed operation only. | M1,M6,M8 | C5; E-OA-TOOLS,E-AN-ERR | partial-work accounting; guided |
| R145 | provider-neutral · API client · RETRY+BACKOFF | A fixed immediate retries; B transient-only exponential backoff with full jitter and `Retry-After`. | M1,M8 | C1,C4; E-AN-ERR | rate-limit semantics vary; guided |
| R146 | provider-neutral · expensive generation · RETRY+BUDGET | A unlimited attempts; B max 3 attempts and token/deadline budget, retaining failed usage. | M1,M8 | C4,C5; E-AN-ERR | budget can lower completion rate; guided |
| R147 | provider-neutral · request ingress · ADMISSION+QUALITY | A accepts all traffic; B smooths admission, queues normal work, sheds low priority before provider rejection. | M1,M5,M8 | C4,C5; E-BR-ROUTE | queueing changes latency; guided |
| R148 | provider-neutral · duplicate webhook jobs · IDEMPOTENCY+ BATCH | A submits duplicate work after timeout; B idempotency ledger joins same request ID and charges once. | M1,M5,M8 | C4; E-XA-BATCH | provider idempotency guarantees differ; guided |
| R149 | provider-neutral · batch eval · ADMISSION+BATCH | A submit every item immediately; B queue by deadline and fill provider batch limits, preserving item-level IDs. | M1,M5,M8 | C4; E-OA-BATCH | queue policy must honor SLA; guided |
| R150 | provider-neutral · multi-tenant · ADMISSION+ROUTE | A one global queue; B per-tenant token budget and route low-priority tenants to deferred tier. | M1,M4,M5 | C4,C5; E-BR-ROUTE | fairness/policy gate required; guided |
| R151 | provider-neutral · prompt cache · CM+QUALITY | A reports token total only; B records prefix hashes and cache reads/writes, then rejects apparent savings without quality pass. | M1,M2,M3 | C2,C8; E-OA-CACHE,E-OA-COUNT | observability + quality gate; research |
| R152 | provider-neutral · retrieval · CM+QUALITY | A measures answer tokens only; B logs retrieved token count, citation support, and answer quality before changing top-k. | M1,M3,M10 | C3,C8; E-OA-RET | evidence measurement, not retrieval intervention; guided |
| R153 | provider-neutral · routing · CM+QUALITY | A averages route cost; B reports cost/quality/latency by route and blocks route if margin fails. | M1,M3,M4,M11 | C5,C8; E-OA-QUALITY | route-level guard; research |
| R154 | provider-neutral · batch · CM+QUALITY | A reports submission price; B includes queue wait, completion, failures, retries, and per-item quality. | M3,M5,M11 | C4,C8; E-OA-BATCH | real deferred economics; guided |
| R155 | provider-neutral · cache + retrieval · CAN+RET+QUALITY | A full corpus with arbitrary serialization; B canonical cached policy/corpus, retrieved delta, and citation non-inferiority gate. | M1,M2,M3,M10 | C2,C3,C8; E-OA-CACHE,E-OA-RET | three-way interaction with exact fixture; research |
| R156 | provider-neutral · agent · TOOLS+RETRY+QUALITY | A retries entire agent transcript; B concise tools, parallel independent calls, retry failed operation, score task completion. | M1,M3,M6,M8 | C5,C8; E-OA-TOOLS,E-AN-ERR | orchestration + failure handling; guided |
| R157 | provider-neutral · multimodal RAG · MEDIA+RET+QUALITY | A send all pages at high resolution; B ROI retrieve, low-resolution media, answer only with citation-supported evidence. | M1,M3,M7,M10 | C3,C8; E-GG-MEDIA,E-OA-RET | multimodal evidence pipeline; research |
| R158 | provider-neutral · offline eval · ROUTE+BATCH+QUALITY | A synchronous strong judge; B deterministic grader, small judge for disagreements, all deferred in Batch. | M3,M4,M5,M11 | C4,C5,C8; E-OA-BATCH,E-OA-QUALITY | evaluator route + batch; research |
| R159 | provider-neutral · long chat · SUM+CACHE+QUALITY | A full uncached history; B typed rolling summary + stable cached policy + recent raw tail, with state-preservation gate. | M1,M2,M3 | C2,C3,C8; E-OA-COMP,E-OA-CACHE | compaction and cache are orthogonal; guided |
| R160 | provider-neutral · production cost program · ROUTE+CACHEAPP+QUALITY | A fixed model/no answer cache; B semantic answer cache, confidence cascade on misses, and Pareto/non-inferiority release gate. | M1,M3,M4,M11 | C5,C8; E-OA-QUALITY | application cache + route + gate; research |

## 5. Deterministic recipe manifest and run contract

Every row expands to a manifest; prose never substitutes for a manifest. The minimum schema is:

```json
{
  "$schema":"https://tokengauge.local/schemas/recipe-v1.json",
  "recipeId":"tg-r1-<sha256-16>",
  "canonicalKey":"<canonical sorted JSON>",
  "status":"supported|guided|research|incompatible|unsupported",
  "atoms":[{"id":"A-CAN","role":"treatment","sourceRefs":["E-OA-CACHE"]}],
  "provider":{"name":"openai","api":"responses","model":"gpt-5.6","region":"default","effectiveAt":"2026-08-15T00:00:00Z"},
  "workload":{"kind":"rag","fixtureSet":"rag-v3","inputShape":"stable_prefix_variable_tail"},
  "arms":{"a":{"procedure":"...","requestPatch":{}},"b":{"procedure":"...","requestPatch":{}}},
  "heldConstant":["fixtureSet","model","qualityRubric","toolBackend"],
  "state":{"cache":"cold_then_warm","ttlSeconds":1800,"warmup":"controlled"},
  "measurement":{"metrics":["M1","M2","M3"],"repeats":3,"order":"balanced_or_controlled","margin":0.02},
  "evidence":{"refs":["E-OA-CACHE","E-OA-RET"],"grade":"derived","lastVerified":"2026-08-15"},
  "caveats":["C2","C8"],
  "notDuplicateOf":["research-pc-02","research-ret-01"]
}
```

The adapter must emit the exact request diff, returned model, usage fields, cache state, route, latency, geography, batch job/item ID, attempts, failures, and quality outcome. A result may say `winner` only after the declared quality margin passes; otherwise it says `inconclusive`, `quality_failed`, or `unsupported`. For exploratory runs use at least three paired repeats per fixture; production claims require a variance pilot, MDE/sample-size calculation, and predeclared stopping rule.

## 6. Defensible catalogue scale

The raw Cartesian product is intentionally **not** the catalogue size. If one multiplied ten providers × ten workloads × ten input shapes × seven cache states × six routes × six output contracts × five latency tiers × five geographies × five batch modes, the result would be 52.5 billion strings, most incompatible or semantically identical. That arithmetic has no product meaning.

Use a compatibility graph. A recipe occupies one valid tuple of `(atoms, provider profile, workload, input shape, state, route, output, latency, geography, batch, quality)`, and only tuples with a real A/B diff and evidence are counted. For the current 160-row design:

| family | valid combinations retained | reason the bound is credible |
|---|---:|---|
| cache/context/retrieval | 40 | 10 provider/profile surfaces × 4 workload/state patterns after alias and stacking exclusions |
| output/tools/media | 40 | 8 contract/tool/media patterns × provider capability profiles; unsupported native fields excluded |
| routing/quality/economics | 40 | 10 routing/quality patterns × one declared route threshold/fixture family |
| batch/latency/geo/reliability/serving | 40 | 10 deferred/region/retry/serving patterns × one SLA/accounting fixture |
| **candidate recipes in this file** | **160** | each row has a distinct canonical key and explicit A/B procedure |

For a release denominator, count only manifests that pass source scope, capability capture, request-diff, quality-gate, and duplicate checks. A useful planning ceiling is:

`N_release = Σ(provider profiles × workload fixtures × valid atom pairs × valid state/latency modes) − aliases − unsupported − unmeasured interactions`.

With the present 10 provider surfaces, 8 workload families, 15 canonical compound patterns, and an average of 2.0 valid profile/state variants after constraints, the upper planning envelope is about `10 × 8 × 15 × 2 = 2,400` manifests **before** evidence and adapter filtering. If an evidence/capability audit retains 25–40%, the defensible near-term range is **600–960 supported or guided recipes**, not millions. The 160 concrete rows are a reviewed seed set; expanding beyond it requires adding new fixtures, atom interactions, or provider profiles—not renaming rows.

## 7. Evidence QA checklist

Before accepting a recipe into a release catalogue:

1. Resolve every `sourceRef`; confirm URL, publisher, claim key, provider/API/model/region scope, and `lastVerified`.
2. Verify the request diff contains exactly the declared treatment dimensions; reject pasted prose that does not alter the intended request/processing path.
3. Confirm incompatible combinations (cache+Batch stacking, unsupported media setting, unavailable output cap, wrong region) fail closed.
4. Run cold/warm sequences for cache/stateful recipes; real provider Batch/Flex/priority jobs for deferred recipes; capture queue/completion time.
5. Preserve all consumed usage and failed attempts; never erase a failed arm by retrying it.
6. Apply the same fixture, task rubric, quality margin, and model identity to both arms; report median and spread.
7. Check canonical hash against aliases and existing recipes; provider profile changes alone must not create a new ID.
8. Keep API-price estimates separate from connected ChatGPT-plan token totals (`C7`).

## 8. What is intentionally not counted

Randomization, repeats, pinning model snapshots, declaring a quality margin, invoice reconciliation, and cache telemetry are essential evidence controls but do not become methods merely by being composed with a prompt. Provider-specific price/effort/cache spellings are profiles. A title change, a different example, a different synonym, a 5-minute versus 1-hour TTL sweep, or `low` versus `minimal` reasoning is a parameter or state variant under one canonical recipe unless the workload and A/B procedure differ materially.

The honest claim for TokenGauge is therefore: **160 concrete, source-linked compound recipe designs in this research set; a smaller number become supported product recipes after adapter and evidence gates; scale grows through valid interactions and provider profiles, not duplicate names.**
