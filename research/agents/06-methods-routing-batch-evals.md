# LLM Token and Cost-Saving Methods: Routing, Deferred Compute, Evals, and Architecture

**Research snapshot:** 2026-08-15
**Scope:** model routing and cascades; batch, flex, and off-peak processing; provider selection; evaluation and observability; tuning and distillation economics; retry/rate controls; and application architecture.
**Recommendation labels:** **Free-first** means no incremental optimization product or license is required beyond ordinary inference/infrastructure; it does not mean the underlying inference is free. **Paid/provider feature** means the saving depends on a metered provider service, reserved capacity, or extra compute/storage.
**Evidence grades:** **A** = an official price/mechanism with an explicit saving, or original controlled research demonstrating the method; **B** = official mechanism or measurement guidance whose saving is workload-dependent; **C** = an engineering control derived from official billing/error semantics and requiring local validation.

## Provider differences that must not be normalized away

| Area | Material differences at this snapshot |
|---|---|
| Batch discounts | OpenAI, Anthropic, Google Gemini, and Mistral advertise roughly 50% batch discounts on supported models. xAI advertises 20%. Model eligibility, limits, completion windows, and cache interaction differ. |
| Flex / best-effort | OpenAI Flex uses Batch-rate tokens with slower and occasionally unavailable processing. Google and Amazon Bedrock use their own Flex/best-effort products and capacity semantics; the labels are not interchangeable. |
| Prompt caching | OpenAI and xAI favor repeated exact prefixes; Anthropic exposes 5-minute and 1-hour write TTL economics; Gemini combines implicit caching with separately billed explicit-cache storage; Bedrock uses model-specific checkpoints and does not combine prompt caching with batch inference. |
| Token accounting | Provider tokenizers differ. Anthropic says Claude 4.7+ may produce about 30% more tokens for the same text than earlier models, workload-dependent. Compare actual billed input, output, cache, and reasoning tokens—not list price alone. |
| Geography | Anthropic documents a 1.1× premium for US-only inference on supported models; other providers and partner clouds have distinct regional pricing. Geography and residency are hard routing constraints, not after-the-fact optimizations. |
| 2026 lifecycle caveat | OpenAI says its hosted Evals platform becomes read-only on 2026-10-31 and shuts down on 2026-11-30, and its current fine-tuning platform is winding down and unavailable to new users. The evaluation and tuning methods below are therefore portable rather than dependent on those surfaces. |
| DeepSeek off-peak change | As of this snapshot, DeepSeek has announced a new peak/off-peak schedule effective **2026-08-16 16:00 UTC**. Do not apply the future schedule before its effective time; re-check the official page after launch. |

## Model routing and provider selection

### MRE-001 — Static task-to-model routing

- **Category:** Model routing
- **Recommendation:** **Free-first** — implement a small rules table in the existing gateway before buying a routing product.
- **Evidence:** **B** — official model-selection guidance supports choosing the smallest model that meets task requirements.
- **Summary:** Predictable task classes such as extraction, classification, drafting, and complex reasoning rarely need the same model tier. A static map captures the obvious savings with little operational risk.
- **Exact action:** Label requests by task, modality, tool need, context size, latency SLA, and compliance; map each allowed combination to the cheapest model that passes its slice-specific quality floor.
- **Measurement:** Report cost per accepted result, failure/escalation rate, p95 latency, and quality by route versus the former single-model baseline.
- **Caveat:** Refresh routes after model or prompt changes; a global “small/large” split hides failures in minority slices.
- **Providers:** Provider-neutral; OpenAI model tiers are one concrete implementation.
- **Source:** [OpenAI — Using GPT-5.6: choose a tier and test lower effort](https://developers.openai.com/api/docs/guides/latest-model)

### MRE-002 — Learned weak/strong model router

- **Category:** Model routing
- **Recommendation:** **Free-first** — train a lightweight router from existing preference/evaluation logs when volume justifies it.
- **Evidence:** **A** — RouteLLM reports more than 2× cost reduction in studied settings while maintaining response quality.
- **Summary:** A learned router predicts when a cheaper model is sufficient and sends only harder prompts to a stronger model.
- **Exact action:** Build paired weak/strong outcomes, train a router on preference or correctness labels, calibrate a routing threshold on held-out production-like data, and keep hard safety/capability constraints outside the learned score.
- **Measurement:** Plot quality and dollars per request over the full routing-threshold curve; compare with random routing, all-small, and all-large baselines.
- **Caveat:** Router accuracy can drift when prompts, models, or traffic mix change; retraining on public benchmarks alone is weak evidence for production.
- **Providers:** Provider-neutral and can route across providers if policy permits.
- **Source:** [RouteLLM — Learning to Route LLMs with Preference Data](https://arxiv.org/abs/2406.18665)

### MRE-003 — Confidence-gated cascade

- **Category:** Model cascade
- **Recommendation:** **Free-first** — add a calibrated acceptance gate after the lowest-cost model.
- **Evidence:** **A** — FrugalGPT experimentally demonstrates LLM cascades and reports up to 98% cost reduction in its evaluated tasks/settings.
- **Summary:** Run the cheapest candidate first, accept high-confidence results, and escalate uncertain cases to increasingly capable models.
- **Exact action:** Define a verifiable confidence signal—schema validity, retrieval support, calibrated classifier, or task grader—then choose escalation thresholds against a quality constraint.
- **Measurement:** Track cascade depth, acceptance accuracy at each stage, false accepts, false escalations, average tokens, and cost per successful task.
- **Caveat:** Self-reported model confidence is often poorly calibrated. High-stakes outputs need external checks or conservative escalation.
- **Providers:** Provider-neutral; stages may use one or multiple providers.
- **Source:** [FrugalGPT — How to Use Large Language Models While Reducing Cost and Improving Performance](https://arxiv.org/abs/2305.05176)

### MRE-004 — Route on expected marginal quality gain

- **Category:** Model routing
- **Recommendation:** **Free-first** — estimate the large model’s incremental benefit rather than “difficulty” in isolation.
- **Evidence:** **A** — RouteLMT formalizes routing by expected marginal gain and includes a guarded routing variant.
- **Summary:** A prompt can be intrinsically hard yet equally poorly handled by both models. Spending more is justified only when the expensive model is likely to improve the outcome.
- **Exact action:** Train a predictor for `quality_large − quality_small`; route upward only when expected gain exceeds the price/latency penalty and any risk threshold.
- **Measurement:** Measure realized uplift among escalated prompts, regret versus an oracle route, quality at each budget, and spend wasted on no-gain escalations.
- **Caveat:** Requires paired labels or judge scores for both models; biased judges can teach the router the wrong preference.
- **Providers:** Provider-neutral.
- **Source:** [RouteLMT — Route by Expected Marginal Gain](https://arxiv.org/abs/2604.22520)

### MRE-005 — Adaptive retrieval depth

- **Category:** Retrieval and routing
- **Recommendation:** **Free-first** — classify queries into no-retrieval, single-step, or iterative retrieval paths.
- **Evidence:** **A** — Adaptive-RAG evaluates a complexity-aware classifier that selects among these retrieval strategies.
- **Summary:** Retrieval, reranking, and long evidence contexts are not free. Simple queries can skip retrieval; moderate ones use a single lookup; only complex questions pay for multi-step RAG.
- **Exact action:** Train or rule-build a complexity gate, retain a no-retrieval path for closed-book queries, and cap the number of retrieval/answer loops.
- **Measurement:** Compare answer quality, retrieved tokens, model tokens, retrieval calls, latency, and total cost by complexity bucket.
- **Caveat:** False “no retrieval” decisions can create unsupported answers; freshness- or citation-sensitive requests should force retrieval.
- **Providers:** Provider-neutral.
- **Source:** [Adaptive-RAG — Learning to Adapt Retrieval-Augmented Large Language Models](https://arxiv.org/abs/2403.14403)

### MRE-006 — Managed Bedrock prompt routing

- **Category:** Managed model routing
- **Recommendation:** **Paid/provider feature** — use when both candidate models are supported and the operational simplicity beats a custom router.
- **Evidence:** **B** — Amazon documents dynamic routing that predicts which of two same-family models can satisfy a request.
- **Summary:** Bedrock Intelligent Prompt Routing can shift eligible prompts to a lower-cost model without maintaining a custom router.
- **Exact action:** Create a router with exactly two supported models from the same family, run a representative offline comparison, and set application-level fallbacks for unsupported modalities or failures.
- **Measurement:** Compare routed versus fixed-model quality, dollar cost, p95 latency, route share, and errors for each production slice.
- **Caveat:** The router is English-optimized, allows exactly two models, and does not learn application-specific performance. It is not a drop-in replacement for custom policy routing.
- **Providers:** Amazon Bedrock only.
- **Source:** [Amazon Bedrock — Intelligent prompt routing](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-routing.html)

### MRE-007 — Hard capability and policy prefilter

- **Category:** Provider/model selection
- **Recommendation:** **Free-first** — eliminate invalid candidates before price optimization.
- **Evidence:** **B** — official model comparison pages expose differing modalities, context, tools, and endpoints.
- **Summary:** The cheapest listed model is irrelevant if it lacks required tool calling, modality, context, region, or data controls. A prefilter prevents expensive retries and silent capability degradation.
- **Exact action:** Maintain machine-readable model metadata; reject candidates that violate modality, context, tool, residency, retention, or latency requirements, then optimize price only inside the feasible set.
- **Measurement:** Count prevented invalid calls, post-route capability failures, fallback frequency, and realized cost among policy-compliant candidates.
- **Caveat:** Provider capabilities and availability change; stale metadata can be worse than no prefilter.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Compare models](https://developers.openai.com/api/docs/models/compare)

### MRE-008 — Token-count-aware routing

- **Category:** Provider/model selection
- **Recommendation:** **Free-first** — count the exact request before choosing a model or context tier.
- **Evidence:** **B** — OpenAI provides a token-counting endpoint that includes tools, files, images, and request structure.
- **Summary:** Long-context thresholds and tool schemas can change both model eligibility and price. Character estimates routinely miss those costs.
- **Exact action:** Preflight exact tokens for requests near context or price thresholds; route short requests to low-cost tiers and long ones to models whose context and long-context rates remain economical.
- **Measurement:** Track estimate error, threshold crossings, context failures, chosen-model cost, and savings versus routing on characters or raw message text.
- **Caveat:** Tokenizers and count semantics differ by provider; use each provider’s tokenizer or counting API rather than one universal estimate.
- **Providers:** Provider-neutral; official exact endpoint cited for OpenAI.
- **Source:** [OpenAI — Counting tokens](https://developers.openai.com/api/docs/guides/token-counting)

### MRE-009 — Select on realized cost per successful task

- **Category:** Provider selection
- **Recommendation:** **Free-first** — benchmark providers with actual billed usage instead of input-list price.
- **Evidence:** **B** — Anthropic explicitly documents model-dependent tokenization and says Claude 4.7+ can produce about 30% more tokens for the same text, workload-dependent.
- **Summary:** A lower price per million tokens can lose after tokenizer expansion, verbosity, reasoning tokens, cache behavior, retries, or lower first-pass success.
- **Exact action:** Replay a representative corpus through allowed providers; calculate total billed cost divided by accepted outcomes, with usage normalized only after retaining native billing fields.
- **Measurement:** Report billed input, output, cache write/read, reasoning/tool charges, retry count, acceptance rate, and dollars per accepted task.
- **Caveat:** Published tokenization differences are directional, not a substitute for testing the application’s languages and formats.
- **Providers:** Provider-neutral; Anthropic difference is explicitly documented.
- **Source:** [Anthropic — Pricing and token-count differences](https://platform.claude.com/docs/en/about-claude/pricing)

### MRE-010 — Route to the cheapest compliant geography

- **Category:** Provider selection
- **Recommendation:** **Free-first** — use global inference unless residency, latency, or contract requirements justify a regional premium.
- **Evidence:** **A** — Anthropic documents a 1.1× price multiplier for US-only inference on supported models.
- **Summary:** Geography is a measurable cost dimension. Treat region as a policy constraint and avoid paying for restrictive routing where no requirement exists.
- **Exact action:** Encode residency rules per tenant/data class; select global routes for eligible traffic and regional routes only for regulated or latency-sensitive traffic.
- **Measurement:** Compare regional request share, compliance exceptions, p95 latency, and spend with and without the geographic constraint.
- **Caveat:** Partner-cloud prices and residency guarantees differ; never infer compliance solely from an endpoint’s name.
- **Providers:** Anthropic direct API and provider-neutral policy pattern.
- **Source:** [Anthropic — Inference geography pricing](https://platform.claude.com/docs/en/about-claude/pricing)

## Batch, flex, off-peak, and capacity economics

### MRE-011 — OpenAI Batch API for deferred work

- **Category:** Batch processing
- **Recommendation:** **Paid/provider feature** — move asynchronous work with a 24-hour tolerance to Batch.
- **Evidence:** **A** — OpenAI documents asynchronous Batch processing at a 50% discount from synchronous rates.
- **Summary:** Offline enrichment, scoring, summarization, and evaluation can trade immediate latency for lower input and output prices.
- **Exact action:** Buffer independent requests into JSONL batches, give every row a stable custom ID, submit before the job deadline, and reconcile completed/error rows.
- **Measurement:** Compare effective input/output price, completion time, expiry/error share, and resubmission cost against synchronous processing.
- **Caveat:** Only supported endpoints/models qualify; the 24-hour completion window is unsuitable for interactive traffic.
- **Providers:** OpenAI.
- **Source:** [OpenAI — Batch API guide](https://developers.openai.com/api/docs/guides/batch)

### MRE-012 — OpenAI Flex processing

- **Category:** Best-effort processing
- **Recommendation:** **Paid/provider feature** — use for lower-priority synchronous-style work that can tolerate slower or temporarily unavailable service.
- **Evidence:** **A** — OpenAI documents Flex tokens at Batch rates and warns of slower responses and occasional resource unavailability.
- **Summary:** Flex avoids assembling a batch while monetizing latency tolerance.
- **Exact action:** Mark eligible jobs with the Flex service tier, set generous deadlines, and fall back to a queue rather than automatically upgrading every capacity error to Standard.
- **Measurement:** Track Flex completion rate, p50/p95 latency, retry/up-tier rate, and effective cost versus Standard and Batch.
- **Caveat:** Model support is limited and availability is best effort; cache discounts and pricing must be checked for the selected model.
- **Providers:** OpenAI only; similarly named products elsewhere have different semantics.
- **Source:** [OpenAI — Flex processing](https://developers.openai.com/api/docs/guides/flex-processing)

### MRE-013 — Anthropic Message Batches

- **Category:** Batch processing
- **Recommendation:** **Paid/provider feature** — use for independent Claude requests that can finish asynchronously.
- **Evidence:** **A** — Anthropic documents a 50% discount on input and output tokens for Message Batches.
- **Summary:** Batch pricing can halve model-token charges for offline Claude workloads while retaining per-request results.
- **Exact action:** Group at most the documented request/size limits, assign unique custom IDs, poll or stream results, and resubmit only errored or expired items.
- **Measurement:** Track token savings, time to completion, expired/canceled share, and duplicate custom IDs or resubmissions.
- **Caveat:** Batches expire after 24 hours; cache prewarming with `max_tokens: 0` is not supported, and spend limits can be slightly exceeded while a batch runs.
- **Providers:** Anthropic.
- **Source:** [Anthropic — Message Batches](https://platform.claude.com/docs/en/build-with-claude/batch-processing)

### MRE-014 — Gemini Batch API

- **Category:** Batch processing
- **Recommendation:** **Paid/provider feature** — send large, non-urgent Gemini workloads through the Batch API.
- **Evidence:** **A** — Google publishes lower Batch prices, generally 50% below Standard for supported Gemini models.
- **Summary:** Gemini Batch separates throughput-tolerant offline work from interactive requests and prices eligible tokens lower.
- **Exact action:** Stage requests in the supported inline/file form, submit a batch job, preserve row identifiers, and retry only failed rows after inspecting their status.
- **Measurement:** Compare Batch versus Standard billed tokens, job duration, failure/expiry rate, and end-to-end dollars per completed record.
- **Caveat:** Model and feature eligibility changes; do not assume Batch combines with every cache, grounding, or priority feature.
- **Providers:** Google Gemini API / Vertex AI, subject to the selected surface.
- **Source:** [Google — Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api) and [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

### MRE-015 — xAI Batch API

- **Category:** Batch processing
- **Recommendation:** **Paid/provider feature** — use for supported text-model jobs that can wait up to the best-effort 24-hour window.
- **Evidence:** **A** — xAI publishes a 20% Batch discount and separates Batch from real-time rate limits.
- **Summary:** xAI Batch provides modest price savings and protects real-time quota for interactive work.
- **Exact action:** Submit only supported model requests, assign unique `batch_request_id` values, consume completed results, and explicitly handle expired rows.
- **Measurement:** Track the realized 20% price delta, completion latency, expiry/failure rate, and impact on real-time throttling.
- **Caveat:** The discount is smaller than several competitors’ 50%; completion within 24 hours is best effort and model support is restricted.
- **Providers:** xAI.
- **Source:** [xAI — Batch API](https://docs.x.ai/developers/advanced-api-usage/batch-api) and [xAI — Batch pricing](https://docs.x.ai/developers/pricing#batch-api-pricing)

### MRE-016 — Mistral Batch processing

- **Category:** Batch processing
- **Recommendation:** **Paid/provider feature** — use the batch endpoint for supported offline inference.
- **Evidence:** **A** — Mistral publishes a 50% discount for Batch API usage.
- **Summary:** Mistral Batch is a direct price lever for evaluation, enrichment, and back-office generation that does not need interactive latency.
- **Exact action:** Package independent requests with stable identifiers, submit to the supported batch endpoint/model, and reconcile success/error outputs before retrying.
- **Measurement:** Compare synchronous and batch token charges, job latency, failures, duplicates, and cost per completed item.
- **Caveat:** Check the current model eligibility and limits; a headline discount does not offset poor quality or excess output tokens.
- **Providers:** Mistral AI.
- **Source:** [Mistral — Batch processing](https://docs.mistral.ai/studio/batch-processing) and [Mistral — API pricing](https://mistral.ai/pricing/api/)

### MRE-017 — DeepSeek off-peak scheduling

- **Category:** Off-peak processing
- **Recommendation:** **Paid/provider feature** — delay eligible jobs into the official lower-price UTC window after the announced schedule takes effect.
- **Evidence:** **A** — DeepSeek publishes peak/off-peak hours and rates; the announced 2026-08-16 schedule prices off-peak tokens at half peak.
- **Summary:** Time-shifting is a pure scheduling saving for jobs whose deadlines cross a cheaper window.
- **Exact action:** Store deadlines in UTC, schedule only deferrable work into the documented off-peak hours, and keep a kill switch keyed to the pricing effective date.
- **Measurement:** Attribute tokens by official pricing window; report delay, missed deadlines, and actual dollar savings versus immediate execution.
- **Caveat:** At this 2026-08-15 snapshot the new schedule becomes effective **2026-08-16 16:00 UTC**. Revalidate the live page and never hard-code the schedule indefinitely.
- **Providers:** DeepSeek.
- **Source:** [DeepSeek — Models and pricing](https://api-docs.deepseek.com/quick_start/pricing/)

### MRE-018 — Split interactive and deferred queues by SLA

- **Category:** Application architecture
- **Recommendation:** **Free-first** — expose latency tolerance as a product/API field and route accordingly.
- **Evidence:** **B** — official provider guidance distinguishes Standard, Flex, and Batch processing by latency and cost.
- **Summary:** A queue boundary prevents non-urgent work from consuming high-price interactive capacity and makes multiple discounted channels usable.
- **Exact action:** Define at least `interactive`, `best_effort`, and `24h_batch` service classes; enforce deadlines, priority, and permitted provider tiers for each.
- **Measurement:** Track traffic and spend by service class, deadline misses, queue age, and inappropriate Standard-tier usage.
- **Caveat:** A hidden batch queue surprises users; service class and expected completion must be explicit in the product contract.
- **Providers:** Provider-neutral; OpenAI offers all three reference tiers.
- **Source:** [OpenAI — Cost optimization](https://developers.openai.com/api/docs/guides/cost-optimization)

### MRE-019 — Run evaluation and backfill traffic through batch

- **Category:** Evaluation economics
- **Recommendation:** **Paid/provider feature** — use discounted batch channels for offline evals, embeddings, migrations, and historical backfills.
- **Evidence:** **A** — provider batch discounts apply to eligible asynchronous requests regardless of whether the business purpose is evaluation or production.
- **Summary:** Evaluation is often high-volume and deadline-tolerant, making it one of the safest first workloads to move off Standard pricing.
- **Exact action:** Generate an immutable eval manifest, submit it through the provider’s batch service, and join results to expected labels by stable ID.
- **Measurement:** Report eval cost per case, total wall-clock completion, missing/failed cases, and savings versus synchronous replay.
- **Caveat:** Keep inference configuration identical to the candidate production path; batching can introduce unsupported feature differences.
- **Providers:** OpenAI, Anthropic, Google, Mistral, xAI where eligible.
- **Source:** [Anthropic — Message Batches](https://platform.claude.com/docs/en/build-with-claude/batch-processing)

### MRE-020 — Spot GPU capacity for fault-tolerant offline work

- **Category:** Self-hosted batch infrastructure
- **Recommendation:** **Paid/infrastructure feature** — run restartable inference, tuning, and preprocessing on Spot capacity.
- **Evidence:** **A** — Google documents Spot VMs at discounts up to 91%; AWS documents Spot savings up to 90%, both with interruption risk.
- **Summary:** Interruptible accelerators materially reduce compute cost when jobs can checkpoint and resume.
- **Exact action:** Containerize the job, shard work into idempotent units, checkpoint to durable storage, monitor interruption signals, and fall back only when the deadline demands it.
- **Measurement:** Compare GPU-hour price, completed examples per dollar, interruption/restart overhead, lost work, and deadline success against on-demand GPUs.
- **Caveat:** Poor checkpointing can erase the discount. Interactive serving and tightly synchronized distributed jobs are usually poor fits.
- **Providers:** Google Cloud and AWS; analogous spot products require separate validation.
- **Source:** [Google Cloud — Spot VMs](https://docs.cloud.google.com/compute/docs/instances/spot) and [AWS — EC2 Spot best practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html)

## Caching and application architecture

### MRE-021 — OpenAI stable-prefix prompt design

- **Category:** Prompt caching
- **Recommendation:** **Free-first** — restructure existing requests to maximize automatic cache hits.
- **Evidence:** **B** — OpenAI documents exact-prefix matching and cached-token usage fields.
- **Summary:** Put stable system instructions, tools, and examples before per-request content so repeated prefixes qualify for cheaper cached input.
- **Exact action:** Canonicalize serialization; order stable content first and user-specific content last; keep tool definitions and whitespace byte-stable; group traffic by shared prefix.
- **Measurement:** Record `cached_tokens`, total input tokens, hit rate by prefix version, cache savings, and quality before/after reordering.
- **Caveat:** Near matches do not count; cache write/read rates and retention differ by model. Do not assume caching means zero-cost input.
- **Providers:** OpenAI.
- **Source:** [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### MRE-022 — Anthropic cache-TTL break-even selection

- **Category:** Prompt caching
- **Recommendation:** **Free-first** — choose the 5-minute or 1-hour cache by measured reuse interval rather than always selecting longer retention.
- **Evidence:** **A** — Anthropic prices 5-minute writes at 1.25× base input, 1-hour writes at 2×, and cache reads at 0.1×; it documents respective break-even behavior after one and two reads.
- **Summary:** TTL is an economic decision: longer retention costs more to write but can save cold misses across slower reuse.
- **Exact action:** Measure inter-arrival time per prefix; use 5 minutes for bursty reuse, 1 hour only when at least two reads are likely before expiry, and place cache breakpoints after stable blocks.
- **Measurement:** Track write/read tokens, read count per write, expirations before reuse, and net spend versus uncached input.
- **Caveat:** Generation time counts against TTL, and edits before a breakpoint invalidate the following prefix.
- **Providers:** Anthropic.
- **Source:** [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) and [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### MRE-023 — Gemini implicit-versus-explicit cache break-even

- **Category:** Prompt caching
- **Recommendation:** **Free-first first; paid storage selectively** — rely on implicit caching for naturally repeated prefixes, then use explicit caching only for predictable high reuse.
- **Evidence:** **B** — Google documents implicit caching on Gemini 2.5+ and hourly storage charges for explicit caches.
- **Summary:** Explicit caching can lower repeated input processing but adds storage cost; its value depends on token size, reuse count, and lifetime.
- **Exact action:** Put large common content first, send similar prefixes close together, inspect `total_cached_tokens`, and create explicit caches only after a reuse/storage break-even calculation.
- **Measurement:** Compare cached token share, cache storage hours, misses, total request charges, and dollars saved per cached prefix.
- **Caveat:** Minimum cacheable token counts vary by model, implicit hits are not guaranteed, and explicit caching is not available on every Gemini surface.
- **Providers:** Google Gemini API / Vertex AI.
- **Source:** [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching)

### MRE-024 — Bedrock cache checkpoints with compatibility guard

- **Category:** Prompt caching
- **Recommendation:** **Paid/provider feature** — insert cache checkpoints only for supported models and repeated stable blocks.
- **Evidence:** **B** — Bedrock documents model-specific cache checkpoints, minimum tokens, TTLs, and write/read charging.
- **Summary:** Explicit checkpoints can reuse long system prompts, documents, or tool schemas, but eligibility and economics vary by model.
- **Exact action:** Discover model cache limits, place checkpoints after stable content, and route cached and batch workloads through separate paths.
- **Measurement:** Track cache read/write tokens, invalidations, hit rate, latency, and net spend by model.
- **Caveat:** Bedrock prompt caching is not supported with batch inference. Write/read multipliers, TTLs, and supported fields are not uniform.
- **Providers:** Amazon Bedrock.
- **Source:** [Amazon Bedrock — Prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)

### MRE-025 — xAI cache-key and conversation affinity

- **Category:** Prompt caching
- **Recommendation:** **Free-first** — consistently reuse the documented conversation/cache key for requests sharing a prefix.
- **Evidence:** **B** — xAI documents automatic prompt caching and recommends `x-grok-conv-id` / `prompt_cache_key` to improve affinity.
- **Summary:** Stable message prefixes plus consistent cache keys increase the chance that repeat requests reach reusable cache state.
- **Exact action:** Canonicalize the initial messages, assign a durable key per shared prompt lineage, and rotate it only when the stable prefix changes.
- **Measurement:** Inspect `cached_tokens`, cache-hit rate per key, long-context threshold crossings, latency, and effective input cost.
- **Caveat:** Cached and non-cached tokens can both count toward long-context thresholds; exact pricing and model behavior must be checked.
- **Providers:** xAI.
- **Source:** [xAI — Prompt caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching) and [xAI — Cache usage and pricing](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing)

### MRE-026 — Semantic answer cache

- **Category:** Application response caching
- **Recommendation:** **Free-first** — start with an application-owned cache for low-risk, repeated, semantically equivalent questions.
- **Evidence:** **A** — GPTCache is original research/software describing semantic caching for LLM queries.
- **Summary:** Unlike provider prompt caching, an answer cache skips model generation entirely when a previous answer is safely reusable.
- **Exact action:** Embed normalized queries, retrieve within a conservative similarity threshold, scope entries by tenant/policy/version, and bypass the cache for time-sensitive or personalized requests.
- **Measurement:** Track exact and semantic hit rate, model calls avoided, false-hit rate from review, staleness incidents, latency, and net cost including embedding/vector search.
- **Caveat:** Semantic similarity does not prove answer equivalence. Privacy, authorization, freshness, and model/prompt versioning are mandatory cache keys or filters.
- **Providers:** Provider-neutral.
- **Source:** [GPTCache — An Open-Source Semantic Cache for LLM Applications](https://aclanthology.org/anthology-files/pdf/nlposs/2023.nlposs-1.24.pdf)

### MRE-027 — Compact long-running conversations

- **Category:** Context architecture
- **Recommendation:** **Free-first** — compact history before it repeatedly dominates each turn.
- **Evidence:** **B** — OpenAI documents compaction as a way to reduce context size while balancing quality, cost, and latency.
- **Summary:** Stateful agents otherwise resend an ever-growing history. A compact state representation lowers later-turn input and avoids long-context price tiers.
- **Exact action:** Set a token threshold; compact older conversation state; preserve durable facts, unresolved tasks, safety constraints, and latest turns; discard content before the latest compaction artifact in stateless chains.
- **Measurement:** Plot input tokens per turn, compaction frequency/cost, task success, fact-loss errors, latency, and net cumulative spend over conversation length.
- **Caveat:** Compaction is lossy and itself consumes tokens. Evaluate long-horizon tasks, not just the immediate next turn.
- **Providers:** Provider-neutral; OpenAI exposes a native compaction mechanism.
- **Source:** [OpenAI — Compaction](https://developers.openai.com/api/docs/guides/compaction)

### MRE-028 — Defer tool schemas until needed

- **Category:** Tool architecture
- **Recommendation:** **Free-first** — group tools into namespaces and load only the relevant schemas.
- **Evidence:** **B** — OpenAI documents tool search for deferring tool definitions and recommends fewer than ten functions per namespace.
- **Summary:** Large tool catalogs are input tokens on every turn even when almost none are used. Deferred discovery shrinks the prompt surface.
- **Exact action:** Partition tools by domain, provide concise namespace descriptions, defer eligible definitions, and invoke tool search only when the task requires that namespace.
- **Measurement:** Track tool-schema tokens per request, search invocations, tool-selection accuracy, end-to-end calls, latency, and cost.
- **Caveat:** OpenAI’s native tool search is limited to supported newer models; other providers need an application-level catalog/router.
- **Providers:** OpenAI GPT-5.4+ natively; provider-neutral architectural pattern.
- **Source:** [OpenAI — Tool search](https://developers.openai.com/api/docs/guides/tools-tool-search)

### MRE-029 — Programmatic tool orchestration for bounded workflows

- **Category:** Tool architecture
- **Recommendation:** **Free-first** — move deterministic loops, joins, and filters from repeated model turns into code.
- **Evidence:** **B** — OpenAI recommends programmatic tool calling for bounded workflows and explicitly advises benchmarking tokens, calls, latency, and cost.
- **Summary:** A model need not narrate every intermediate step. Code can execute predictable control flow while the model handles semantic decisions.
- **Exact action:** Identify repeated tool-call loops, implement the deterministic portion in a sandboxed function, return only the compact result needed for the next reasoning step, and cap tool iterations.
- **Measurement:** Compare model round trips, tool-output tokens returned to the model, latency, task success, and total cost.
- **Caveat:** Do not hide consequential decisions in opaque code; preserve auditability and enforce tool permissions and output limits.
- **Providers:** Provider-neutral; OpenAI provides a native programmatic tool-calling facility.
- **Source:** [OpenAI — Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)

### MRE-030 — Lean, versioned system prompts

- **Category:** Prompt architecture
- **Recommendation:** **Free-first** — delete redundant instructions and examples after evaluation proves they add no value.
- **Evidence:** **B** — OpenAI reports internal lean-prompt evaluations with 41–66% fewer tokens and 33–67% lower cost, while warning users to validate locally.
- **Summary:** Repeated boilerplate is charged on every request and enlarges cache writes. Concise prompts also make routing and evaluation easier to reason about.
- **Exact action:** Deduplicate rules, replace prose with compact constraints where unambiguous, remove examples one at a time, and version each candidate against the same eval set.
- **Measurement:** Track system/tool tokens, output quality, violation rate, cache behavior, and total cost per accepted task.
- **Caveat:** The published percentages are an OpenAI internal result, not a universal guarantee; overcompression can create costly retries or failures.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Using GPT-5.6: lean prompts](https://developers.openai.com/api/docs/guides/latest-model)

## Evaluation, measurement, and observability

### MRE-031 — Production-distribution evaluation set

- **Category:** Evaluation design
- **Recommendation:** **Free-first** — build a small, continuously refreshed set from real traffic before optimizing price.
- **Evidence:** **B** — OpenAI evaluation guidance recommends task-specific evals representative of the production distribution.
- **Summary:** Cost optimization without representative quality measurement simply moves failures into unseen slices.
- **Exact action:** Sample and de-identify production cases, stratify by task, language, length, risk, and difficulty, add expected outcomes/rubrics, and reserve a held-out set.
- **Measurement:** Report coverage per slice, inter-annotator agreement, model quality, cost per case, and gaps between eval and live failure rates.
- **Caveat:** OpenAI’s hosted Evals platform is winding down in 2026; implement the dataset and harness portably.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)

### MRE-032 — Cost-quality Pareto frontier by task slice

- **Category:** Evaluation economics
- **Recommendation:** **Free-first** — choose routes from a frontier, not a single average score.
- **Evidence:** **A** — RouteLLM evaluates quality-versus-cost tradeoffs over routing thresholds rather than treating model choice as a single point.
- **Summary:** The useful operating choice is the cheapest configuration that meets each slice’s quality floor. One global average can subsidize easy traffic while failing rare hard cases.
- **Exact action:** Evaluate every candidate model/prompt/router at several thresholds; construct cost-quality frontiers for each slice; reject dominated configurations.
- **Measurement:** Store score, confidence interval, mean/p95 cost, latency, and failure rate for every frontier point.
- **Caveat:** A frontier changes with provider pricing, token mix, and traffic distribution; refresh it when any component changes.
- **Providers:** Provider-neutral.
- **Source:** [RouteLLM — Learning to Route LLMs with Preference Data](https://arxiv.org/abs/2406.18665)

### MRE-033 — Pairwise or ranking evaluation

- **Category:** Evaluation design
- **Recommendation:** **Free-first** — compare candidate outputs directly when absolute scoring is unreliable.
- **Evidence:** **B** — OpenAI recommends pairwise comparison, classification, or scoring against criteria because LLM judges are better at discrimination than open-ended judging.
- **Summary:** Routing decisions usually need to know whether the cheaper answer is materially worse, not assign an abstract universal score.
- **Exact action:** Randomize output order, blind model identity, define tie and material-difference rules, and aggregate pairwise wins by production slice.
- **Measurement:** Track win/tie/loss, order bias, judge-human agreement, cost delta, and confidence intervals.
- **Caveat:** Pairwise judging can favor verbosity or style; normalize formatting and calibrate against humans.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)

### MRE-034 — Human-calibrated LLM judge

- **Category:** Evaluation design
- **Recommendation:** **Paid inference, free-first harness** — use a judge to scale only after agreement with human ground truth is acceptable.
- **Evidence:** **B** — Google documents model-based evaluation as scalable and advises validating against human evaluation data.
- **Summary:** Judge models lower the marginal cost of large eval suites, but an uncalibrated judge can optimize toward its own bias.
- **Exact action:** Double-label a stratified calibration set with humans and the judge, revise the rubric, set an uncertainty/manual-review band, then scale evaluation.
- **Measurement:** Report judge-human agreement, false-pass/false-fail rates, bias by slice, judge tokens/cost, and manual-review load.
- **Caveat:** Avoid using the candidate model as the sole judge of itself; periodically recalibrate after model or rubric changes.
- **Providers:** Provider-neutral; Vertex AI offers a managed judge model.
- **Source:** [Google Cloud — Evaluate with a judge model](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/evaluate-judge-model)

### MRE-035 — Continuous regression gate for cost changes

- **Category:** Evaluation operations
- **Recommendation:** **Free-first** — run the eval suite on every model, prompt, route, cache, and retry-policy change.
- **Evidence:** **B** — OpenAI recommends continuous evaluation on every change.
- **Summary:** Savings are fragile: a cheaper model can increase retries, verbosity, or downstream failures after an unrelated prompt edit.
- **Exact action:** Require a versioned eval report before rollout; block if any critical slice falls below quality or if cost/latency exceed the approved envelope; canary accepted changes.
- **Measurement:** Track regressions caught before release, live-versus-eval drift, cost and quality deltas, rollback rate, and confidence intervals.
- **Caveat:** A stale eval suite creates false confidence; continually add novel production failures.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)

### MRE-036 — Deterministic graders before model judges

- **Category:** Evaluation economics
- **Recommendation:** **Free-first** — run exact-match, schema, code, citation, and rule checks before paying for an LLM judge.
- **Evidence:** **B** — OpenAI documents string, similarity, and code graders alongside model graders.
- **Summary:** Many failures are mechanically detectable. A staged grader pipeline avoids judge tokens for obvious passes/failures and reserves semantic evaluation for ambiguous cases.
- **Exact action:** Order graders from cheapest to most expensive; short-circuit definitive results; send only the unresolved band to a calibrated judge or human.
- **Measurement:** Track cases resolved per stage, grader precision/recall, judge calls avoided, eval latency, and cost per evaluated case.
- **Caveat:** Never let a weak string heuristic declare semantic correctness; use deterministic checks only where their validity is known.
- **Providers:** Provider-neutral.
- **Source:** [OpenAI — Graders](https://developers.openai.com/api/docs/guides/graders)

### MRE-037 — Capture every billed usage dimension per request

- **Category:** Observability
- **Recommendation:** **Free-first** — persist native provider usage fields at the gateway.
- **Evidence:** **B** — providers expose input, output, cached, and sometimes reasoning/tool token fields; Anthropic provides a usage-reporting API.
- **Summary:** Aggregate “tokens” hides whether savings came from shorter inputs, cache reads, lower reasoning, or less output—and can miss chargeable categories.
- **Exact action:** Store request/model/version, input/output, cache write/read, reasoning, tool/search charges, service tier, region, retries, latency, outcome, and provider request ID.
- **Measurement:** Audit field population, compare estimated and reported cost, and report cost per successful task by usage dimension.
- **Caveat:** Schemas differ by provider and can change; preserve raw usage payloads alongside normalized fields.
- **Providers:** Provider-neutral; Anthropic exposes organization usage reports.
- **Source:** [Anthropic — Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)

### MRE-038 — Measure cache write/read break-even

- **Category:** Observability
- **Recommendation:** **Free-first** — approve caching only after prefix-level net-savings analysis.
- **Evidence:** **A** — Anthropic publishes distinct write and read multipliers, making the break-even explicitly measurable.
- **Summary:** Cache hit rate alone is misleading: expensive writes that expire before reuse can raise spend.
- **Exact action:** For each prefix version, join cache writes to subsequent reads within TTL; compute uncached counterfactual cost minus write, read, and storage charges.
- **Measurement:** Report reads per write, token-weighted hit rate, expiry-without-read rate, storage cost, latency, and net dollars saved.
- **Caveat:** Provider caches have different TTLs and charges; do not reuse one provider’s break-even formula for another.
- **Providers:** Provider-neutral measurement; Anthropic provides the clearest explicit multipliers.
- **Source:** [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### MRE-039 — Tag spend by feature, tenant, and experiment

- **Category:** Cost attribution
- **Recommendation:** **Free-first** — attach application metadata to every invocation and propagate it into logs.
- **Evidence:** **B** — Bedrock supports request metadata in invocation logs for granular cost analysis.
- **Summary:** Optimization is actionable only when spend can be assigned to a product feature, customer, route, and experiment.
- **Exact action:** Define low-cardinality tags such as feature, tenant class, environment, route, prompt version, and experiment; enforce propagation at the gateway.
- **Measurement:** Report untagged spend, cost per feature/tenant/outcome, top regressions, and variance by experiment arm.
- **Caveat:** Do not place sensitive customer content in tags. Bedrock’s per-request estimates omit some discounts/commitments and must be reconciled.
- **Providers:** Provider-neutral; Bedrock has native request metadata support.
- **Source:** [Amazon Bedrock — Cost allocation using application inference profiles and request metadata](https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-request-metadata.html)

### MRE-040 — Reconcile telemetry to the invoice and alert on anomalies

- **Category:** Cost observability
- **Recommendation:** **Free-first** — compare gateway estimates with provider cost reports on a daily cadence.
- **Evidence:** **B** — Anthropic’s Cost API exposes costs grouped by model, product, context, and inference geography.
- **Summary:** Request logs can miss batch adjustments, cache writes, tool charges, discounts, or regional premiums. Invoice reconciliation catches drift and instrumentation gaps.
- **Exact action:** Aggregate usage in billing time zones, pull official cost data, reconcile by model/tier/region, define tolerance bands, and alert on unexplained variance or unit-cost jumps.
- **Measurement:** Track reconciliation error, unexplained spend, cost anomalies detected, mean time to resolution, and forecast error.
- **Caveat:** Provider cost APIs may require organization-admin credentials and can lag; individual accounts or partner clouds may lack the same surface.
- **Providers:** Provider-neutral; Anthropic official Cost API is cited.
- **Source:** [Anthropic — Cost Report API](https://platform.claude.com/docs/en/api/admin/analytics/cost)

## Fine-tuning, distillation, and self-hosting economics

### MRE-041 — Fine-tune a smaller model for a fixed task

- **Category:** Fine-tuning economics
- **Recommendation:** **Paid training after free-first prompt baseline** — tune only when high recurring inference volume can repay training and maintenance.
- **Evidence:** **B** — Google documents supervised tuning for task specialization and notes that tuned models can use shorter prompts and reduce inference cost/latency.
- **Summary:** A smaller specialized model can replace a larger general model on stable, narrow tasks such as extraction or classification.
- **Exact action:** Establish a prompt-only baseline, collect at least a representative high-quality training set, tune the smallest plausible model, and calculate break-even requests from training cost divided by per-request savings.
- **Measurement:** Track training/hosting cost, quality by slice, prompt/output tokens, throughput, and cumulative break-even date.
- **Caveat:** Drift, retraining, safety evaluation, and endpoint hosting costs can erase savings. OpenAI’s current fine-tuning platform is winding down; use a supported provider or self-hosted workflow.
- **Providers:** Google Vertex AI or self-hosted; concept is provider-neutral.
- **Source:** [Google Cloud — Tune Gemini models](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/tune-models)

### MRE-042 — Fine-tune to remove repeated few-shot tokens

- **Category:** Fine-tuning economics
- **Recommendation:** **Paid training** — use only when long repeated examples dominate input and behavior is stable.
- **Evidence:** **B** — OpenAI model-optimization guidance identifies shorter prompts and smaller specialized models as fine-tuning benefits.
- **Summary:** Moving behavior demonstrated by large few-shot blocks into weights can lower every subsequent request’s input tokens.
- **Exact action:** Measure the recurring example-token block, train on the same behavior, retest with a minimal system prompt, and compute break-even including training and hosted-model price.
- **Measurement:** Compare prompt tokens, output quality, violation rate, latency, per-request cost, and requests to amortize training.
- **Caveat:** This is a durable commitment to a task/data distribution. Because OpenAI’s hosted fine-tuning surface is winding down, treat its guide as methodology, not a recommendation to start there.
- **Providers:** Provider-neutral; Google/self-hosted are current implementation options.
- **Source:** [OpenAI — Model optimization](https://developers.openai.com/api/docs/guides/model-optimization)

### MRE-043 — Teacher-student distillation

- **Category:** Distillation
- **Recommendation:** **Paid training** — distill a costly teacher when the task is stable and inference volume is high.
- **Evidence:** **A** — MiniLLM is original research on knowledge distillation from large to smaller language models.
- **Summary:** Use high-quality teacher outputs to train a smaller student whose inference cost is lower, preserving enough task performance to replace repeated teacher calls.
- **Exact action:** Create diverse prompts, generate/filter teacher responses, train the student, and retain a confidence gate that escalates uncertain or out-of-distribution cases to the teacher.
- **Measurement:** Include teacher-data generation, training, hosting, student quality, escalation share, and cost per accepted result in the break-even model.
- **Caveat:** Distillation can transfer teacher errors and licensing/data restrictions may limit output reuse. The paper’s results are not a guarantee for a specific task.
- **Providers:** Provider-neutral; self-hosted or managed training.
- **Source:** [MiniLLM — Knowledge Distillation of Large Language Models](https://arxiv.org/abs/2306.08543)

### MRE-044 — QLoRA or adapter-based tuning

- **Category:** Efficient fine-tuning
- **Recommendation:** **Paid compute, lower-capex method** — prefer parameter-efficient tuning before full-model training when quality is sufficient.
- **Evidence:** **A** — QLoRA reports fine-tuning a quantized 65B model on a single 48 GB GPU while preserving 16-bit fine-tuning task performance in studied settings.
- **Summary:** Freeze a quantized base model and train small adapters, reducing accelerator memory and storage per specialization.
- **Exact action:** Quantize the supported base model, train LoRA adapters on representative data, compare with full-precision and prompt-only baselines, and store adapters separately from shared weights.
- **Measurement:** Track GPU-hours, peak memory, adapter storage, training energy/cost, task quality, and serving overhead.
- **Caveat:** Quantization and adapter serving may reduce throughput or quality for some tasks; validate the exact stack and license.
- **Providers:** Self-hosted and managed platforms that support PEFT.
- **Source:** [QLoRA — Efficient Finetuning of Quantized LLMs](https://arxiv.org/abs/2305.14314)

### MRE-045 — PagedAttention and continuous batching

- **Category:** Self-hosted inference
- **Recommendation:** **Free-first software, paid compute** — use an optimized serving engine before buying more GPUs.
- **Evidence:** **A** — the vLLM paper introduces PagedAttention and evaluates throughput improvements from efficient KV-cache management and batching.
- **Summary:** Better KV-cache allocation and continuous batching raise useful tokens per GPU, lowering infrastructure cost per request.
- **Exact action:** Benchmark the current server against vLLM or an equivalent engine at realistic prompt/output lengths, concurrency, quantization, and latency SLOs; tune batch and memory limits.
- **Measurement:** Report requests/tokens per second, time to first token, inter-token latency, GPU utilization, OOM rate, and dollars per million generated tokens.
- **Caveat:** Throughput gains are workload/hardware/model-specific; maximizing batching can violate interactive latency targets.
- **Providers:** Self-hosted/open-weight models.
- **Source:** [vLLM — Easy, Fast, and Cheap LLM Serving with PagedAttention](https://arxiv.org/abs/2309.06180)

### MRE-046 — Speculative decoding

- **Category:** Self-hosted inference
- **Recommendation:** **Paid compute optimization** — add a cheap draft model when output generation is the serving bottleneck.
- **Evidence:** **A** — the original paper reports 2–3× acceleration on T5-XXL in studied settings while preserving the target model’s output distribution.
- **Summary:** A small draft model proposes multiple tokens; the target verifies them in parallel, reducing sequential expensive-model steps.
- **Exact action:** Pair a compatible draft and target, tune proposal length on production prompts, and disable speculation for slices with low acceptance.
- **Measurement:** Track accepted draft tokens, target passes, output tokens/sec, latency, total GPU-seconds, energy, and quality equivalence.
- **Caveat:** Low draft acceptance or extra memory can erase gains; it reduces serving compute/latency, not provider-billed tokens when an API hides the implementation.
- **Providers:** Self-hosted; some providers may implement it internally without exposing savings.
- **Source:** [Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a.html)

## Rate, retry, and overload controls

### MRE-047 — Exponential backoff with full jitter

- **Category:** Retry control
- **Recommendation:** **Free-first** — use bounded exponential backoff and jitter for retryable throttling and server errors.
- **Evidence:** **B** — AWS SDK guidance documents exponential backoff, jitter, and retry quotas/token buckets.
- **Summary:** Immediate synchronized retries amplify overload, waste requests, and delay recovery. Jitter spreads retry traffic.
- **Exact action:** Retry only classified transient errors; apply exponential delay with full jitter; bound maximum delay, attempts, and elapsed deadline.
- **Measurement:** Track retries per original request, recovered success, retry-after latency, duplicate cost, and contribution to 429/5xx traffic.
- **Caveat:** Backoff is not a capacity plan and does not make non-idempotent operations safe.
- **Providers:** Provider-neutral.
- **Source:** [AWS SDKs — Retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)

### MRE-048 — Honor `Retry-After` and avoid stacked retry loops

- **Category:** Retry control
- **Recommendation:** **Free-first** — centralize retry ownership and respect server-provided delay.
- **Evidence:** **B** — Anthropic documents that its SDKs retry connection, rate-limit, and 5xx errors twice by default with exponential backoff and honor `Retry-After`.
- **Summary:** If both the SDK and application retry independently, one logical request can fan out into many paid attempts.
- **Exact action:** Inventory SDK defaults, designate one layer as retry owner, disable or reduce the other, parse `Retry-After`, and propagate a single request deadline.
- **Measurement:** Count physical attempts per logical request, stacked-retry incidents, recovered calls, added tokens, and latency.
- **Caveat:** Defaults differ by SDK/version; confirm deployed configuration rather than relying on documentation memory.
- **Providers:** Provider-neutral; Anthropic behavior is the cited example.
- **Source:** [Anthropic — API errors and SDK retries](https://platform.claude.com/docs/en/api/errors)

### MRE-049 — Validate locally; never retry permanent 4xx errors

- **Category:** Request validation
- **Recommendation:** **Free-first** — reject malformed or unauthorized requests before inference and fail permanent errors immediately.
- **Evidence:** **B** — Anthropic classifies 400, 401, 403, 404, and related client errors separately from transient 429/500/529 conditions.
- **Summary:** Retrying a bad schema, invalid key, forbidden resource, or oversized payload burns latency and may duplicate upstream work without any chance of success.
- **Exact action:** Validate schema, model, size, permissions, and account state locally; map provider status/type to permanent versus transient; retry only the latter.
- **Measurement:** Track local rejects, permanent-error retries prevented, failure latency, and tokens/requests avoided.
- **Caveat:** Some 409/408 cases can be transient and some providers use nonstandard error bodies; classify by official provider semantics.
- **Providers:** Provider-neutral.
- **Source:** [Anthropic — API errors](https://platform.claude.com/docs/en/api/errors)

### MRE-050 — Retry budget and end-to-end deadline

- **Category:** Retry control
- **Recommendation:** **Free-first** — cap the attempts, elapsed time, and estimated spend of each logical task.
- **Evidence:** **B** — AWS Bedrock scaling guidance recommends limited attempts with exponential backoff/jitter and moving persistent failures to a queue or lower-priority path.
- **Summary:** A success after many expensive retries may cost more than a controlled fallback or delayed queue.
- **Exact action:** Set per-task attempt, deadline, and cost ceilings; after exhaustion, queue, degrade to a cheaper fallback, or return a retriable application error.
- **Measurement:** Track budget-exhausted tasks, spend per logical task including retries, recovered-success curve by attempt number, and fallback quality.
- **Caveat:** Too-tight budgets lower availability; tune them per SLA and risk class, not globally.
- **Providers:** Provider-neutral; Bedrock operational guidance is cited.
- **Source:** [Amazon Bedrock — Scaling throughput and handling errors](https://docs.aws.amazon.com/bedrock/latest/userguide/scaling-throughput-best-practices.html)

### MRE-051 — Smooth admission rate, queue, and shed low priority

- **Category:** Rate control
- **Recommendation:** **Free-first** — place a token-aware admission controller ahead of provider APIs.
- **Evidence:** **B** — Bedrock guidance recommends reducing rate for throttling, queuing persistent failures, and shedding lower-priority traffic under pressure.
- **Summary:** Bursty admission causes throttles and retry storms even when average volume fits quota. A queue smooths demand and preserves capacity for valuable work.
- **Exact action:** Estimate input plus reserved output tokens, enforce per-provider/model token buckets, prioritize interactive work, queue deferrable jobs, and shed expired low-value items.
- **Measurement:** Track admitted/queued/shed tokens, queue age, 429/503 rate, retry cost, utilization, and SLA attainment.
- **Caveat:** Token reservation can be conservative—Bedrock notes quota burndown may depend on `max_tokens`—so calibrate estimates and release unused reservations promptly.
- **Providers:** Provider-neutral; Bedrock documents token quota behavior.
- **Source:** [Amazon Bedrock — Scaling throughput best practices](https://docs.aws.amazon.com/bedrock/latest/userguide/scaling-throughput-best-practices.html) and [Token quota burndown](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas-token-burndown.html)

### MRE-052 — Idempotency ledger and in-flight deduplication

- **Category:** Application reliability
- **Recommendation:** **Free-first** — prevent duplicate logical jobs before they become multiple billable inference calls.
- **Evidence:** **C** — xAI documents custom batch request IDs as useful for idempotency; application-level deduplication is still required.
- **Summary:** Client timeouts, worker restarts, and replayed webhooks can submit the same expensive request more than once.
- **Exact action:** Derive an idempotency key from tenant, operation, input version, and generation settings; atomically record in-flight/completed state; return the prior result or status on duplicates.
- **Measurement:** Track duplicate submissions suppressed, duplicate provider calls observed, stale-lock recoveries, and cost avoided.
- **Caveat:** A client-provided ID does not universally guarantee provider-side deduplication. Set retention windows carefully and never conflate distinct randomized generations.
- **Providers:** Provider-neutral; xAI Batch exposes a useful request identifier.
- **Source:** [xAI — Batch API](https://docs.x.ai/developers/advanced-api-usage/batch-api)

## Practical adoption order

1. Instrument billed usage and outcomes (MRE-037–040), then build a production-distribution eval set (MRE-031).
2. Capture no-license changes first: static routing, prefix stability, lean prompts, compaction, tool deferral, and retry controls.
3. Move clearly asynchronous traffic to provider Batch/Flex/off-peak channels, preserving stable IDs and explicit deadlines.
4. Add learned routing/cascades only after paired outcomes and slice-specific quality floors exist.
5. Consider tuning, distillation, or self-hosting only with a full break-even model that includes training, serving, evaluation, drift, and operations.

The percentages and provider capabilities above are snapshot facts, not permanent constants. Re-fetch official pricing and eligibility immediately before implementation or budgeting.
