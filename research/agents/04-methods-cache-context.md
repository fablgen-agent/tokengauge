# Token- and cost-saving methods: prompt caching, context, history, compaction, and retrieval

Snapshot/verification date: **2026-08-15 UTC**
Scope: production tactics that reduce billed input cost, tokens actually placed in the active context, or repeated context-processing work. Sources are limited to live first-party provider documentation and original research papers.

## Reading guide

- **Evidence grade — official:** the provider directly documents the feature or behavior.
- **Evidence grade — derived:** an implementation tactic follows directly from documented provider behavior, but the provider does not claim the exact application-level outcome.
- **Evidence grade — experiment:** an original paper reports task experiments; results must be revalidated on the target model and workload.
- **Free vs paid:** “free implementation” means no extra service is inherently required; ordinary model calls and engineering time can still cost money. “Paid API feature” means the optimization is part of paid inference or may add a write/storage/summarization charge.
- A cache hit usually lowers the price and latency of repeated input but **does not shrink the model's logical context**. Pruning, compaction, compression, and retrieval reduce active-context tokens.

## Provider differences that affect implementation

| Provider/interface | Important differences as verified on 2026-08-15 |
| --- | --- |
| OpenAI API | Recent models cache eligible exact prefixes automatically. GPT-5.6+ also supports explicit breakpoints, a strict 1,024-token minimum, a 30-minute TTL, and separately billed cache writes; earlier models use automatic best-effort prefix reuse with model-dependent minimums and retention. `prompt_cache_key`, `cached_tokens`, and (GPT-5.6+) `cache_write_tokens` are the main controls/metrics. |
| Anthropic Claude API | Supports top-level automatic caching and block-level explicit breakpoints. Default TTL is 5 minutes; 1 hour costs more. Up to four breakpoint slots are available, and each breakpoint searches backward at most 20 blocks. Minimum cacheable length varies substantially by model. |
| Google Gemini API | Interactions supports implicit caching only. The legacy `generateContent` interface supports implicit plus explicit named cache objects; explicit caches have TTL/storage billing and a default 1-hour TTL. Minimums vary by model. |
| Amazon Bedrock | Behavior and fields depend on the underlying model and API. Converse uses `cachePoint`; native InvokeModel bodies use provider-specific fields. Minimums, checkpoint counts, TTLs, and cacheable fields vary. Prompt caching is on-demand only, not Batch inference; cross-region routing can increase writes. |

## Prompt-caching methods

### PC-01 — Put the reusable prefix first

- **Category:** Prompt caching / prompt layout
- **Free vs paid recommendation:** **Free implementation — strong recommendation.** Do this before buying or extending any cache feature.
- **Evidence grade:** official
- **Summary:** Exact-prefix caches only reuse the unchanged beginning of a prompt. Static instructions, schemas, examples, and shared context should precede user-specific content.
- **Exact action:** Render requests as `stable system + stable tools + stable examples/reference + dynamic user/history suffix`; never insert timestamps, request IDs, or per-user facts ahead of the reusable boundary.
- **Measurement plan:** Compare cache-hit tokens divided by eligible prefix tokens, p50/p95 input cost, and time-to-first-token for 100+ matched requests before and after reordering.
- **Caveat:** Prompt order can affect answer quality; run the same correctness eval, and do not move security-relevant instructions to a less authoritative role.
- **Providers:** OpenAI, Anthropic, Gemini, Amazon Bedrock.
- **Source:** [OA-CACHE — OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### PC-02 — Canonicalize the cached prefix byte-for-byte

- **Category:** Prompt caching / cache-key stability
- **Free vs paid recommendation:** **Free implementation — strong recommendation.** High leverage for any exact-match cache.
- **Evidence grade:** derived
- **Summary:** Semantically identical prompts can miss when whitespace, JSON key order, tool order, image identity, or formatting differs because providers match an exact prefix.
- **Exact action:** Build one deterministic prefix renderer: fixed Unicode normalization, newline style, JSON key ordering, tool ordering, whitespace, and asset IDs; hash the rendered prefix in logs and alert when a template version unexpectedly produces multiple hashes.
- **Measurement plan:** Track distinct prefix hashes per template version and hit rate per hash. A/B canonical versus existing serialization with the same traffic shape.
- **Caveat:** Provider tokenization and internal rendering are not fully exposed; a stable application hash is a diagnostic proxy, not proof of a provider-side match.
- **Providers:** Provider-agnostic; directly applicable to OpenAI, Anthropic, Gemini implicit caching, and Bedrock.
- **Source:** [AWS-CACHE — Amazon Bedrock prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)

### PC-03 — Mark the last stable block, not the changing suffix

- **Category:** Prompt caching / explicit breakpoints
- **Free vs paid recommendation:** Paid API feature — recommended when explicit breakpoints are available and reuse is predictable.
- **Evidence grade:** official
- **Summary:** An explicit breakpoint should end at the last block whose whole prefix stays identical. Marking a timestamped or request-specific block creates write churn and no useful read.
- **Exact action:** Add the provider's breakpoint (`prompt_cache_breakpoint`, block `cache_control`, or `cachePoint`) to the final stable content block; put all varying blocks after it.
- **Measurement plan:** Require `cache_read_tokens > cache_write_tokens` over the intended reuse interval and compare net dollar cost against an uncached control.
- **Caveat:** Syntax differs: OpenAI GPT-5.6 uses prompt-cache options/breakpoints, Anthropic uses `cache_control`, and Bedrock Converse uses `cachePoint`.
- **Providers:** OpenAI GPT-5.6+, Anthropic Claude, Amazon Bedrock supported models.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PC-04 — Use Anthropic automatic moving caching for growing chats

- **Category:** Prompt caching / conversation history
- **Free vs paid recommendation:** Paid API feature — recommended for high-reuse Claude chats with steadily appended turns.
- **Evidence grade:** official
- **Summary:** Anthropic's top-level `cache_control` moves the cache point forward as a conversation grows, reading the old prefix and writing only the new tail.
- **Exact action:** On supported Claude interfaces, set top-level `cache_control: {"type":"ephemeral"}` on every turn and append history without rewriting earlier blocks.
- **Measurement plan:** Per turn, graph `cache_read_input_tokens`, `cache_creation_input_tokens`, and uncached `input_tokens`; successful growth should show a large read and a small new write.
- **Caveat:** Automatic caching consumes one of four breakpoint slots, can miss when more than 20 blocks separate writes, and is unavailable on legacy Bedrock integration for Opus 4.6 and earlier.
- **Providers:** Anthropic Claude API and supported Claude partner interfaces.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PC-05 — Cache stable tool schemas, system policy, and few-shot examples

- **Category:** Prompt caching / repeated scaffolding
- **Free vs paid recommendation:** Paid API feature — recommended when these blocks recur across many requests.
- **Evidence grade:** official
- **Summary:** Tool definitions and policy scaffolding are often the largest repeated prefix and are explicitly cacheable on supported providers.
- **Exact action:** Put stable tools first, then system content and examples, and place a breakpoint after the last shared block. Version the whole bundle intentionally.
- **Measurement plan:** Report cached tokens by prefix component from application token counts; compare cost/request at 1, 2, 5, and 20 reuses after each write.
- **Caveat:** Caching lowers repeat cost but does not reduce the logical context occupied by these schemas; combine with tool search when the tool inventory is large.
- **Providers:** OpenAI, Anthropic, Amazon Bedrock; Gemini explicit caches can hold system instructions and corpus content.
- **Source:** [AN-TOOLCTX — Anthropic manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)

### PC-06 — Use multiple breakpoints for different change frequencies

- **Category:** Prompt caching / hierarchical reuse
- **Free vs paid recommendation:** Paid API feature — recommended only when prefix layers truly change at different cadences.
- **Evidence grade:** official
- **Summary:** Separate checkpoints let a rarely changing tools/system layer survive while a daily context layer or growing conversation tail is rewritten.
- **Exact action:** Place breakpoints after, for example, (1) tools/policy, (2) shared reference corpus, and (3) conversation anchor; keep within the provider's checkpoint limit.
- **Measurement plan:** Attribute reads and writes to each layer using prefix token counts and version IDs; remove a breakpoint if it produces writes without later reads.
- **Caveat:** Anthropic permits up to four slots; supported Bedrock models have model-specific maxima. More markers do not guarantee more savings.
- **Providers:** Anthropic Claude, OpenAI GPT-5.6+, Amazon Bedrock supported models.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PC-07 — Anchor growing Claude histories inside the 20-block lookback

- **Category:** Prompt caching / conversation history
- **Free vs paid recommendation:** Free prompt-structure change on top of paid caching — recommended for chats adding many content blocks per turn.
- **Evidence grade:** official
- **Summary:** Each Anthropic breakpoint checks backward at most 20 content blocks for a prior written prefix. Long tool-heavy turns can push a reusable entry out of reach.
- **Exact action:** Add an earlier explicit anchor breakpoint before the rolling tail, or consolidate tiny blocks so the previous write remains within 20 positions.
- **Measurement plan:** Log block distance from each current breakpoint to the last cache write and correlate distances of 20+ with cache misses.
- **Caveat:** This is Anthropic-specific behavior and also appears in Bedrock's simplified Claude cache management; do not assume the same search window elsewhere.
- **Providers:** Anthropic Claude; Amazon Bedrock Claude.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PC-08 — Reuse a stable OpenAI `prompt_cache_key`

- **Category:** Prompt caching / routing affinity
- **Free vs paid recommendation:** Free request parameter on paid inference — recommended for traffic sharing a long common prefix.
- **Evidence grade:** official
- **Summary:** OpenAI routes requests partly by `prompt_cache_key`; reusing a key for the same long prefix can improve hit rate.
- **Exact action:** Derive a low-cardinality key from template/version and shared corpus version, not from request ID or user turn; send it on all matching requests.
- **Measurement plan:** Compare hit rate and p95 latency by key cardinality. Alert when keys/request approaches 1 or one key mixes multiple prefix hashes.
- **Caveat:** The key is a routing aid, not a content override; different prefixes do not become cache-compatible merely because they share a key.
- **Providers:** OpenAI API.
- **Source:** [OA-CACHE — OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### PC-09 — Gate caching on the model-specific minimum prefix

- **Category:** Prompt caching / eligibility
- **Free vs paid recommendation:** **Free validation — strong recommendation.** Prevents silent no-op configuration.
- **Evidence grade:** official
- **Summary:** Providers enforce different cacheable-token minimums by model and platform; below-minimum markers may simply yield no cache.
- **Exact action:** Maintain a live model/platform capability table and pre-count the prefix. Only enable or advertise caching when it meets that exact minimum.
- **Measurement plan:** Assert that eligible test requests produce a nonzero write or read field; record no-op rate by model and catch regressions after model changes.
- **Caveat:** Do not pad one-off prompts merely to cross the threshold; padding can cost more than the future reads save.
- **Providers:** OpenAI, Anthropic, Gemini, Amazon Bedrock.
- **Source:** [OA-CACHE — OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### PC-10 — Warm the cache before parallel fan-out

- **Category:** Prompt caching / request scheduling
- **Free vs paid recommendation:** Derived scheduling tactic — recommended for predictable parallel jobs with a shared prefix.
- **Evidence grade:** official
- **Summary:** Anthropic documents that a cache entry becomes available only after the first response begins; simultaneous cold requests can all miss and write.
- **Exact action:** Send one warm-up request, wait until response streaming begins, then release dependent fan-out requests using the identical prefix.
- **Measurement plan:** Compare aggregate writes, reads, and wall time for cold simultaneous fan-out versus warm-then-fan-out at realistic concurrency.
- **Caveat:** The warm-up adds serialization latency and may not pay off for small fan-outs or providers with different availability semantics.
- **Providers:** Anthropic Claude directly; benchmark before applying to OpenAI, Gemini, or Bedrock.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PC-11 — Choose TTL from measured request inter-arrival time

- **Category:** Prompt caching / cache economics
- **Free vs paid recommendation:** Paid API setting — use the shortest TTL that captures the measured reuse window.
- **Evidence grade:** derived
- **Summary:** A longer TTL can rescue later reads but costs more on Anthropic and incurs duration-based storage charges for Gemini explicit caches; OpenAI GPT-5.6 currently exposes a 30-minute TTL.
- **Exact action:** Build an inter-arrival histogram per reusable prefix. Use Claude 5m unless meaningful reuse lands after 5m; upgrade selected prefixes to 1h. Set Gemini TTL just beyond the selected percentile rather than accepting 1h blindly.
- **Measurement plan:** Calculate realized cost per prefix as writes + storage + reads and simulate each supported TTL over the same timestamp trace.
- **Caveat:** TTL menus and prices differ by provider/model/partner surface and can change; never reuse a Claude TTL rule for Gemini or OpenAI.
- **Providers:** Anthropic, Gemini explicit cache, OpenAI GPT-5.6+, supported Bedrock models.
- **Source:** [GG-CACHE-EXPLICIT — Gemini generateContent context caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)

### PC-12 — Disable implicit writes when an explicit GPT-5.6 boundary is enough

- **Category:** Prompt caching / write control
- **Free vs paid recommendation:** Paid API setting — recommended for GPT-5.6 agent loops with high suffix churn.
- **Evidence grade:** official
- **Summary:** GPT-5.6 cache writes cost more than uncached input. Explicit mode avoids the automatic latest-message breakpoint and writes only marked prefixes.
- **Exact action:** Set `prompt_cache_options.mode: "explicit"`, mark only proven reusable prefixes, and leave highly variable conversation tails unmarked.
- **Measurement plan:** Compare `cache_write_tokens`, `cached_tokens`, and net input cost against implicit mode on the same session traces.
- **Caveat:** GPT-5.5 and earlier do not support explicit breakpoints, and removing the automatic breakpoint can reduce reuse for genuinely stable growing histories.
- **Providers:** OpenAI GPT-5.6+; OpenAI models on Bedrock's Responses endpoint where supported.
- **Source:** [OA-MODEL — OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)

### PC-13 — Cache repeated images, PDFs, video, and reference files

- **Category:** Prompt caching / multimodal context
- **Free vs paid recommendation:** Paid API feature — recommended when the same large asset supports several questions.
- **Evidence grade:** official
- **Summary:** Supported providers can include non-text assets in cached prefixes, avoiding repeated full-price processing of the same document or media input.
- **Exact action:** Upload or reference one immutable asset, put it in the reusable prefix/cache object, and send only the new text question on later requests.
- **Measurement plan:** Compare cached-input tokens, asset-processing latency, and total cost across N repeated questions versus resending the asset.
- **Caveat:** Asset identity and ordering must remain stable; supported types and fields differ. Anthropic user-turn images/documents, Gemini cache objects, and Bedrock content blocks are not interchangeable.
- **Providers:** OpenAI, Anthropic, Gemini explicit cache, Amazon Bedrock supported models.
- **Source:** [GG-CACHE-EXPLICIT — Gemini generateContent context caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)

### PC-14 — Use a named Gemini explicit cache for guaranteed corpus reuse

- **Category:** Prompt caching / explicit cache object
- **Free vs paid recommendation:** Paid API feature — recommended only after break-even analysis for a substantial reused corpus.
- **Evidence grade:** official
- **Summary:** Gemini `generateContent` can create a named cache once and reference it in later requests, guaranteeing the explicit-cache price treatment rather than relying on implicit-cache hits.
- **Exact action:** Create `CachedContent` containing the stable corpus/system instruction, store its name and expiry, and pass `cached_content` on every compatible generation.
- **Measurement plan:** Track cache creation tokens, storage duration, cached tokens per generation, reuse count, and cost versus ordinary repeated input.
- **Caveat:** The Interactions API supports implicit caching only; explicit cache objects belong to the legacy `generateContent` interface and cached content itself cannot be retrieved for inspection.
- **Providers:** Google Gemini `generateContent` API.
- **Source:** [GG-CACHE-EXPLICIT — Gemini generateContent context caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)

### PC-15 — Instrument cache reads, writes, misses, and uncached tails separately

- **Category:** Prompt caching / observability
- **Free vs paid recommendation:** **Free instrumentation — strong recommendation.** Never infer savings from request count alone.
- **Evidence grade:** official
- **Summary:** Cache economics require distinct token categories. Provider totals are not normalized and some input fields exclude cache reads/writes.
- **Exact action:** Persist provider-native usage fields plus normalized `uncached_input`, `cache_write`, `cache_read`, model, TTL, prefix version, and price snapshot for every request.
- **Measurement plan:** Dashboard hit ratio, read/write ratio, avoided standard-input dollars, actual billed dollars, p95 latency, and quality by prefix version.
- **Caveat:** On Bedrock, total input is `inputTokens + cacheReadInputTokens + cacheWriteInputTokens`; do not apply OpenAI usage semantics to that response.
- **Providers:** OpenAI, Anthropic, Gemini, Amazon Bedrock.
- **Source:** [AWS-CACHE — Amazon Bedrock prompt caching](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)

### PC-16 — Version cache hierarchy from tools to system to messages

- **Category:** Prompt caching / invalidation control
- **Free vs paid recommendation:** Free implementation — recommended for shared production templates.
- **Evidence grade:** official
- **Summary:** Anthropic and Bedrock document a hierarchy where changing an earlier layer invalidates that layer and later cached layers. Uncoordinated tool reordering can therefore erase downstream reuse.
- **Exact action:** Assign explicit versions to tool bundle, system policy, corpus, and message template; deploy changes deliberately and avoid per-request mutation of earlier layers.
- **Measurement plan:** Overlay cache-miss spikes with component-version changes and compute rewritten tokens caused by each deployment.
- **Caveat:** Version labels do not create cache hits by themselves; the rendered prefix must still match exactly.
- **Providers:** Anthropic Claude, Amazon Bedrock; conceptually relevant to other exact-prefix caches.
- **Source:** [AN-CACHE — Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

## Active-context and history methods

### CTX-01 — Count the fully rendered request before generation

- **Category:** Context management / budgeting
- **Free vs paid recommendation:** Free or low-cost endpoint — strong recommendation for every long-context workflow.
- **Evidence grade:** official
- **Summary:** Provider token-count endpoints accept structured messages, tools, images, and documents, so they are safer than counting only raw user text.
- **Exact action:** Call the provider counter (or matching tokenizer) on the exact rendered request before expensive generation; record input tokens by component.
- **Measurement plan:** Compare predicted versus billed input tokens and maintain p95 absolute error; reject or compact only after a defined budget is exceeded.
- **Caveat:** Anthropic says its count is an estimate and may differ slightly from actual input; local tokenizers can also miss provider-added formatting.
- **Providers:** OpenAI, Anthropic; use model-compatible counters elsewhere.
- **Source:** [OA-TOKENS — OpenAI token counting](https://developers.openai.com/api/docs/guides/token-counting)

### CTX-02 — Reserve output and reasoning headroom in the context budget

- **Category:** Context management / admission control
- **Free vs paid recommendation:** Free implementation — strong recommendation.
- **Evidence grade:** derived
- **Summary:** A context window includes input, output, and on some models reasoning tokens. Filling it with input risks truncation and wasted retries.
- **Exact action:** Define `max_input = context_window - max_output - reasoning_reserve - safety_margin`; prune, retrieve, or compact before admitting a request above it.
- **Measurement plan:** Track truncation/context-limit errors, retry tokens, and task completion before and after enforcing the budget.
- **Caveat:** Hidden reasoning consumption can vary and provider limits differ; tune the reserve from observed usage rather than a universal percentage.
- **Providers:** Provider-agnostic; OpenAI documentation explicitly describes combined window accounting.
- **Source:** [OA-STATE — OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state)

### CTX-03 — Remove duplicate instructions and redundant few-shot examples

- **Category:** Context management / prompt simplification
- **Free vs paid recommendation:** **Free implementation — strong recommendation.** Often the safest first token reduction.
- **Evidence grade:** official
- **Summary:** State each rule once, keep only examples that encode a measured requirement, and shorten verbose tool descriptions.
- **Exact action:** Delete one instruction/example group at a time, run the same eval set, and retain only blocks whose removal causes a quality regression.
- **Measurement plan:** Measure total input/output tokens, cost, and task score for every ablation; require non-inferior quality before accepting the trim.
- **Caveat:** Concision can remove rare but important behavior. Provider-reported internal percentages are directional, not a guarantee for this workload.
- **Providers:** Provider-agnostic; directly recommended for OpenAI GPT-5.6.
- **Source:** [OA-MODEL — OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)

### CTX-04 — Defer large tool definitions with tool search

- **Category:** Context management / tool schemas
- **Free vs paid recommendation:** Paid model feature — recommended when many tools exist but few are relevant per turn.
- **Evidence grade:** official
- **Summary:** Tool search keeps parameter schemas out of the initial context and injects only the tools selected at runtime.
- **Exact action:** Mark non-core tools `defer_loading: true`, group them in small clear namespaces or MCP servers, and expose one tool-search facility.
- **Measurement plan:** Compare initial input tokens, total tokens including search turns, tool-selection accuracy, latency, and task success against loading every schema.
- **Caveat:** Adds a discovery step and model/version restrictions. OpenAI notes individual deferred functions still expose names/descriptions, so namespace grouping saves more.
- **Providers:** OpenAI GPT-5.4+, Anthropic Claude tool search.
- **Source:** [OA-TOOLSEARCH — OpenAI tool search](https://developers.openai.com/api/docs/guides/tools-tool-search)

### CTX-05 — Reduce intermediate tool output in a programmatic stage

- **Category:** Context management / tool results
- **Free vs paid recommendation:** Paid hosted feature or self-built orchestration — recommended for predictable filter/join/rank/aggregate workflows.
- **Evidence grade:** official
- **Summary:** Programmatic tool calling can keep large intermediate results in a code runtime and return a much smaller structured result to model context.
- **Exact action:** Route only a bounded deterministic stage to programmatic calling, define compact output schemas, and keep final semantic judgment direct.
- **Measurement plan:** Compare total input tokens, intermediate-output bytes/tokens, turns, latency, correctness, and evidence coverage against direct calls.
- **Caveat:** It is a poor fit when each result changes the next semantic decision, approvals are required, or native citations/artifacts must be preserved.
- **Providers:** OpenAI GPT-5.6 supported models; Anthropic offers an analogous feature.
- **Source:** [OA-PTC — OpenAI Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling)

### CTX-06 — Clear stale tool results after they have served their purpose

- **Category:** Context management / selective pruning
- **Free vs paid recommendation:** Paid beta API feature or free client-side equivalent — recommended for tool-heavy long sessions.
- **Evidence grade:** official
- **Summary:** Old file contents, searches, and tool outputs often become dead weight after the model extracts the relevant result.
- **Exact action:** Enable Claude `clear_tool_uses_20250919` with a threshold and exemptions for critical tools, or client-side replace old results with compact typed placeholders.
- **Measurement plan:** Record `cleared_input_tokens`, quality, tool-repeat rate, and cost/turn; test whether clearing causes the agent to refetch information.
- **Caveat:** Anthropic clearing invalidates affected cache prefixes. Clear enough tokens to justify the rewrite and never remove results still needed for audit/evidence.
- **Providers:** Anthropic Claude directly; provider-agnostic as client-side pruning.
- **Source:** [AN-EDIT — Anthropic context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing)

### CTX-07 — Drop irrelevant historical reasoning while preserving the current tool loop

- **Category:** Context management / reasoning history
- **Free vs paid recommendation:** Free request setting or paid context-edit feature — recommended when old reasoning no longer affects the current turn.
- **Evidence grade:** official
- **Summary:** OpenAI can restrict persisted reasoning to `current_turn`; Anthropic can clear older thinking blocks. Both save context when prior reasoning is stale.
- **Exact action:** Set OpenAI `reasoning.context: "current_turn"` at task shifts, or configure Anthropic `clear_thinking_20251015` with an explicit keep policy.
- **Measurement plan:** Compare reasoning-input tokens, answer quality, and repeated mistakes on continuation tests against all-turn retention.
- **Caveat:** Within an active tool-use turn, preserve every required thinking/reasoning item exactly; aggressive clearing can break reasoning continuity and defaults vary by Claude model class.
- **Providers:** OpenAI GPT-5.6+, Anthropic Claude.
- **Source:** [AN-EDIT — Anthropic context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing)

### CTX-08 — Keep a sliding recent window plus pinned invariants

- **Category:** Conversation history / client-side pruning
- **Free vs paid recommendation:** **Free implementation — strong recommendation** for simple chats that do not need full server compaction.
- **Evidence grade:** derived
- **Summary:** Retain a small recency window verbatim while pinning durable goals, constraints, decisions, unresolved questions, and identifiers outside it.
- **Exact action:** On each turn, construct context as `system + pinned state + last N turns`; archive older raw turns outside model context and adjust N by token budget, not message count.
- **Measurement plan:** Sweep token budgets and score fact retention, instruction adherence, cost, and latency on long-session replay tests.
- **Caveat:** Recency alone can drop an old fact that suddenly matters; combine with retrieval over the archive for nonlocal references.
- **Providers:** Provider-agnostic.
- **Source:** [MEMGPT — MemGPT original paper](https://arxiv.org/abs/2310.08560)

### CTX-09 — Reset context at real task boundaries

- **Category:** Conversation history / lifecycle
- **Free vs paid recommendation:** **Free implementation — strong recommendation.** Use when goals, entities, or authorization scope change.
- **Evidence grade:** derived
- **Summary:** Continuing an unrelated task drags old tokens into every later request. A new conversation with only transferred durable state is cheaper and reduces interference.
- **Exact action:** Detect explicit “new task/project/user” boundaries, start a new thread, and carry only a typed handoff of relevant facts and permissions.
- **Measurement plan:** Compare average input tokens and cross-task contamination errors for reset versus continuous sessions on multi-task transcripts.
- **Caveat:** OpenAI `previous_response_id` is state convenience, not a billing shortcut: all previous input tokens in the chain are billed unless context is compacted/pruned.
- **Providers:** Provider-agnostic; billing caveat directly documented by OpenAI.
- **Source:** [OA-STATE — OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state)

### CTX-10 — Filter low-information tokens with Selective Context

- **Category:** Context compression / token filtering
- **Free vs paid recommendation:** Free/self-hostable algorithm — experimental recommendation after task-specific evaluation.
- **Evidence grade:** experiment
- **Summary:** Selective Context uses self-information to remove less informative content from documents or conversation transcripts.
- **Exact action:** Score tokens or lexical units with a small language model, remove the lowest-information units to a fixed budget, and protect entities, numbers, negation, code, and quoted requirements.
- **Measurement plan:** Sweep compression ratios and evaluate exact fact retention, downstream answer score, hallucinations, latency, and total cost including compressor compute.
- **Caveat:** Token deletion can damage grammar or silently remove a decisive qualifier; do not deploy from compression ratio alone.
- **Providers:** Provider-agnostic; can be self-hosted before any LLM API.
- **Source:** [SELECTIVE-CONTEXT — original paper](https://arxiv.org/abs/2304.12102)

### CTX-11 — Apply budget-controlled LLMLingua prompt compression

- **Category:** Context compression / learned compressor
- **Free vs paid recommendation:** Free/self-hostable reference method — experimental recommendation for very long prompts.
- **Evidence grade:** experiment
- **Summary:** LLMLingua combines coarse-to-fine selection, a budget controller, and token-level iterative compression to shrink prompts while retaining task semantics.
- **Exact action:** Compress only the long context/examples, preserve the instruction and query verbatim, and select a conservative target token budget from an eval sweep.
- **Measurement plan:** Include compressor compute in end-to-end cost; report compression ratio, task score, latency, and failure slices for code, tables, numbers, and multilingual content.
- **Caveat:** The paper's reported up-to-20× result is dataset/model-specific and not a production guarantee.
- **Providers:** Provider-agnostic; compressor can front any compatible text-model API.
- **Source:** [LLMLINGUA — original paper](https://arxiv.org/abs/2310.05736)

### CTX-12 — Use query-aware LongLLMLingua for long evidence sets

- **Category:** Context compression / relevance and position
- **Free vs paid recommendation:** Free/self-hostable reference method — experimental recommendation for long-document QA.
- **Evidence grade:** experiment
- **Summary:** LongLLMLingua makes compression query-aware and addresses both irrelevant tokens and position bias in long contexts.
- **Exact action:** Score context conditioned on the current query, compress lower-relevance passages more aggressively, and preserve/reposition high-relevance evidence.
- **Measurement plan:** Compare against uncompressed, simple top-k, and LLMLingua baselines on answer accuracy, citation faithfulness, input tokens, total latency, and cost.
- **Caveat:** Query-aware preprocessing must be rerun when the question changes and can erase evidence needed for multi-hop questions.
- **Providers:** Provider-agnostic.
- **Source:** [LONGLLMLINGUA — original paper](https://arxiv.org/abs/2310.06839)

### CTX-13 — Put the strongest evidence near context edges

- **Category:** Context management / evidence ordering
- **Free vs paid recommendation:** Free implementation — experimental recommendation when several retrieved chunks must remain.
- **Evidence grade:** experiment
- **Summary:** “Lost in the Middle” found many models use relevant information better at the beginning or end than in the middle of long context.
- **Exact action:** After reranking, place the highest-confidence evidence first (and, if appropriate, a second key item last), with lower-ranked context in the middle.
- **Measurement plan:** Randomize evidence order on a fixed QA set and measure answer/citation accuracy by relevant-chunk position as well as token count.
- **Caveat:** This does not reduce tokens by itself; it can permit a smaller evidence budget only if evaluation confirms quality holds. Newer models may show different position behavior.
- **Providers:** Provider-agnostic.
- **Source:** [LOST-MIDDLE — original paper](https://arxiv.org/abs/2307.03172)

## Compaction, summarization, and memory methods

### CMP-01 — Trigger OpenAI server-side compaction before the hard limit

- **Category:** Compaction / server-side
- **Free vs paid recommendation:** Paid API feature — recommended for long OpenAI Responses sessions.
- **Evidence grade:** official
- **Summary:** `context_management` with `compact_threshold` emits an encrypted compaction item that carries forward needed state in fewer tokens.
- **Exact action:** Set a threshold below the model limit with room for output/reasoning, preserve the returned compaction item, and continue with either stateless arrays or `previous_response_id`.
- **Measurement plan:** Compare post-compaction rendered tokens, cost/turn, completion rate, latency, and continuity evals against an uncompacted replay.
- **Caveat:** The compaction item is opaque; applications needing auditable human-readable state should maintain a parallel structured state record.
- **Providers:** OpenAI Responses API.
- **Source:** [OA-COMPACT — OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction)

### CMP-02 — Use OpenAI's standalone compact endpoint at semantic checkpoints

- **Category:** Compaction / explicit control
- **Free vs paid recommendation:** Paid API feature — recommended when the application, not a token threshold, should decide the checkpoint.
- **Evidence grade:** official
- **Summary:** `/responses/compact` accepts a full window and returns the canonical smaller window for the next response.
- **Exact action:** Compact after milestones such as plan approval or phase completion, then pass the returned output as-is plus the next user message.
- **Measurement plan:** Compare milestone-triggered and threshold-triggered policies on number of compactions, compact-call cost, next-turn tokens, and state-retention tests.
- **Caveat:** The input sent to the compact endpoint must still fit the context window, and its output may contain retained items beyond the opaque compaction item.
- **Providers:** OpenAI Responses API.
- **Source:** [OA-COMPACT — OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction)

### CMP-03 — Drop items before the latest OpenAI compaction item

- **Category:** Conversation history / post-compaction pruning
- **Free vs paid recommendation:** Free client-side optimization after paid compaction — recommended for stateless array chaining.
- **Evidence grade:** official
- **Summary:** The latest server-side compaction item carries the prior state, so earlier raw items can be removed from subsequent stateless requests.
- **Exact action:** After appending response outputs, find the newest compaction item and discard all preceding items before the next request.
- **Measurement plan:** Confirm identical continuity-eval results while measuring request payload bytes, input tokens, and long-tail latency before and after pruning.
- **Caveat:** Do not manually prune when using `previous_response_id`, and do not prune the canonical output returned by standalone `/responses/compact`.
- **Providers:** OpenAI Responses API.
- **Source:** [OA-COMPACT — OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction)

### CMP-04 — Enable Anthropic server-side compaction for long Claude sessions

- **Category:** Compaction / server-side
- **Free vs paid recommendation:** Paid beta API feature — recommended over bespoke summarization when supported.
- **Evidence grade:** official
- **Summary:** Claude can automatically summarize at an input-token threshold, emit a `compaction` block, and drop earlier blocks on later requests.
- **Exact action:** Enable `compact_20260112`, choose a trigger of at least 50,000 tokens with output headroom, and append the full assistant response including compaction blocks.
- **Measurement plan:** Sum all `usage.iterations` for true billed cost; measure effective input after compaction, continuity, latency, and compaction frequency.
- **Caveat:** This is beta, supported models/interfaces can change, and top-level usage alone is insufficient when a request has multiple sampling/compaction iterations.
- **Providers:** Anthropic Claude API.
- **Source:** [AN-COMPACT — Anthropic compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)

### CMP-05 — Make compaction summaries preserve typed task state

- **Category:** Compaction / custom summarization
- **Free vs paid recommendation:** Paid summarization tokens plus free schema design — recommended for stateful agent workflows.
- **Evidence grade:** derived
- **Summary:** A generic prose summary can omit the exact data an agent needs. A typed summary prioritizes goal, constraints, decisions, evidence, artifacts, tool state, failures, and next actions.
- **Exact action:** Supply custom compaction instructions that emit fixed sections and stable identifiers; validate required fields before replacing raw history.
- **Measurement plan:** Create “needle” continuity tests for every required state field and track omission rate, summary tokens, next-step success, and compaction cost.
- **Caveat:** Anthropic custom instructions completely replace its default compaction prompt; a weak custom prompt can perform worse than the default.
- **Providers:** Anthropic supports custom compaction instructions; pattern is portable to client-side and other provider compaction.
- **Source:** [AN-COMPACT — Anthropic compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)

### CMP-06 — Maintain a rolling structured summary plus a recent raw tail

- **Category:** Summarization / client-side history
- **Free vs paid recommendation:** Paid summarizer call or local model — recommended when server compaction is unavailable or human-readable state is required.
- **Evidence grade:** derived
- **Summary:** Replace old turns with one continually updated structured summary while retaining recent turns verbatim for local coherence.
- **Exact action:** When history crosses a budget, summarize only the oldest segment into the prior summary, validate entities/numbers/decisions, and retain the last K tokens unchanged.
- **Measurement plan:** Compare cumulative tokens and summary-update cost with full replay; evaluate long-range fact recall, chronology, and contradiction rate over 50+ turns.
- **Caveat:** Repeated abstractive updates can accumulate distortion. Archive raw turns and periodically rebuild/verify the summary from source.
- **Providers:** Provider-agnostic.
- **Source:** [RECURSIVE-SUMMARY — original recursive summarization paper](https://arxiv.org/abs/2109.10862)

### CMP-07 — Build hierarchical summaries instead of repeatedly flattening everything

- **Category:** Summarization / hierarchy
- **Free vs paid recommendation:** Paid summarization compute or self-hosted model — experimental recommendation for very long material.
- **Evidence grade:** experiment
- **Summary:** Summarize small segments, then recursively summarize groups of summaries, retaining the tree so later queries can select the right level.
- **Exact action:** Store leaf spans, intermediate summaries, and provenance links; rebuild only branches affected by new content.
- **Measurement plan:** Compare tokens recomputed per update, long-range QA, summary faithfulness, and retrieval cost against a single rolling flat summary.
- **Caveat:** Higher levels lose detail; keep source links and descend to leaves for exact quotes, numbers, or decisions.
- **Providers:** Provider-agnostic.
- **Source:** [RECURSIVE-SUMMARY — original recursive summarization paper](https://arxiv.org/abs/2109.10862)

### CMP-08 — Separate fast active memory from large archival memory

- **Category:** Memory / tiered context
- **Free vs paid recommendation:** Free architecture with storage/search costs — experimental recommendation for persistent agents.
- **Evidence grade:** experiment
- **Summary:** MemGPT's virtual-context design moves information between a small in-context tier and larger external storage instead of replaying all history.
- **Exact action:** Define an always-in-context working state, an append-only archival store, and explicit promote/evict/search operations with token quotas.
- **Measurement plan:** Test multi-session recall, active-context tokens, retrieval calls, latency, and false-memory rate against full-history and summary-only baselines.
- **Caveat:** Memory orchestration adds failure modes and tool calls; incorrect eviction or retrieval can be worse than a larger plain context.
- **Providers:** Provider-agnostic; self-hostable architecture.
- **Source:** [MEMGPT — original paper](https://arxiv.org/abs/2310.08560)

### CMP-09 — Retrieve persistent memory just in time

- **Category:** Memory / on-demand retrieval
- **Free vs paid recommendation:** Free client-side storage plus ordinary tool/model usage — recommended for cross-session facts that are not needed every turn.
- **Evidence grade:** official
- **Summary:** Anthropic's memory tool stores facts in application-controlled files and reads only relevant files on demand, keeping the active context focused.
- **Exact action:** Store concise per-user/project memory under a protected namespace, expose directory/list/search first, and read individual files only when the current task needs them.
- **Measurement plan:** Track memory tokens read per task, useful-read rate, cross-session recall accuracy, and stale/incorrect memory incidents.
- **Caveat:** The application, not Anthropic, owns persistence, access control, deletion, tenant isolation, and path traversal defense.
- **Providers:** Anthropic Claude directly; pattern is provider-agnostic.
- **Source:** [AN-MEMORY — Anthropic memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)

### CMP-10 — Rank memories by relevance, recency, and importance

- **Category:** Memory / selection
- **Free vs paid recommendation:** Free algorithm plus embedding/model cost — experimental recommendation when memory volume is large.
- **Evidence grade:** experiment
- **Summary:** Generative Agents retrieves a small set of memories using relevance, recency, and importance rather than dumping the complete event log into context.
- **Exact action:** Score candidate memories on all three dimensions, normalize the scores, retrieve to a strict token budget, and log why each memory was selected.
- **Measurement plan:** Ablate each score and measure downstream task success, recall of durable facts, irrelevant tokens injected, and retrieval latency.
- **Caveat:** Importance scoring can encode model bias; recent trivial events can crowd out old critical constraints without calibrated weights and pinned facts.
- **Providers:** Provider-agnostic.
- **Source:** [GENERATIVE-AGENTS — original paper](https://arxiv.org/abs/2304.03442)

### CMP-11 — Consolidate many observations into higher-level reflections

- **Category:** Memory / consolidation
- **Free vs paid recommendation:** Paid summarization/reflection call or local model — experimental recommendation for repetitive event streams.
- **Evidence grade:** experiment
- **Summary:** Periodic reflection converts clusters of low-level memories into fewer durable abstractions that can be retrieved instead of many raw events.
- **Exact action:** When accumulated importance crosses a threshold, synthesize a reflection with provenance links, store it separately, and prefer it for broad questions while retaining raw evidence.
- **Measurement plan:** Measure tokens retrieved, planning/task score, contradiction rate, and whether answers can trace a reflection back to supporting observations.
- **Caveat:** Reflections can overgeneralize or fossilize an early mistake; expire or revise them when contrary evidence arrives.
- **Providers:** Provider-agnostic.
- **Source:** [GENERATIVE-AGENTS — original paper](https://arxiv.org/abs/2304.03442)

## Retrieval and retrieved-context methods

### RET-01 — Retrieve evidence instead of injecting the whole corpus

- **Category:** Retrieval / RAG
- **Free vs paid recommendation:** Free/self-hostable index or paid retrieval service — strong recommendation for large, sparsely relevant corpora.
- **Evidence grade:** experiment
- **Summary:** Retrieval-augmented generation keeps external knowledge in a non-parametric index and places only selected passages into the generation context.
- **Exact action:** Index the corpus, retrieve a bounded candidate set for each query, and send only cited passages plus the query to the generator.
- **Measurement plan:** Compare input tokens, answer accuracy, citation coverage, latency, retrieval cost, and freshness against full-corpus injection.
- **Caveat:** Retrieval adds an independent recall failure: absent evidence cannot be recovered by the generator. Maintain no-answer and escalation behavior.
- **Providers:** Provider-agnostic; managed options include OpenAI Retrieval and Gemini File Search.
- **Source:** [RAG — original Retrieval-Augmented Generation paper](https://arxiv.org/abs/2005.11401)

### RET-02 — Cap the number of retrieved results

- **Category:** Retrieval / result budget
- **Free vs paid recommendation:** Free query parameter — strong recommendation after recall tuning.
- **Evidence grade:** official
- **Summary:** A smaller `max_num_results` directly limits chunks passed downstream and prevents a default top-k from silently bloating every prompt.
- **Exact action:** Set an explicit top-k/max-results value per task type, starting small, and raise it only when retrieval-recall tests show missed evidence.
- **Measurement plan:** Plot answer score and recall@k against retrieved tokens and total cost for k = 1, 2, 4, 8, and provider defaults.
- **Caveat:** Multi-hop tasks may need more evidence; one global k is rarely optimal.
- **Providers:** OpenAI Retrieval directly; analogous top-k controls exist in many retrieval stacks.
- **Source:** [OA-RETRIEVAL — OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)

### RET-03 — Reject low-score chunks with a relevance threshold

- **Category:** Retrieval / filtering
- **Free vs paid recommendation:** Free query parameter — recommended when irrelevant tail results are common.
- **Evidence grade:** official
- **Summary:** A score threshold can return fewer or zero chunks rather than padding the prompt with weak matches.
- **Exact action:** Calibrate `score_threshold` on labeled queries, use a no-context/no-answer path below it, and tune separately by corpus and ranker.
- **Measurement plan:** Measure precision, recall, empty-result rate, injected tokens, hallucination rate, and answer accuracy across thresholds.
- **Caveat:** Similarity scores are not universally calibrated; a higher threshold can exclude useful evidence and must not be copied across embedding models.
- **Providers:** OpenAI Retrieval directly; portable to scored retrievers.
- **Source:** [OA-RETRIEVAL — OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)

### RET-04 — Apply metadata filters before semantic search

- **Category:** Retrieval / prefiltering
- **Free vs paid recommendation:** Free query feature on top of retrieval — strong recommendation for tenant, date, region, language, or product scopes.
- **Evidence grade:** official
- **Summary:** Prefiltering reduces the candidate space and prevents semantically similar but inapplicable documents from consuming context.
- **Exact action:** Attach normalized metadata at ingestion and construct server-side filters from trusted application scope before vector search.
- **Measurement plan:** Compare candidate/result counts, retrieved tokens, tenant-scope violations, recall, and latency with and without filters.
- **Caveat:** Missing or incorrect metadata can hide the only relevant document; security filters must fail closed and not rely solely on prompt instructions.
- **Providers:** OpenAI Retrieval, Gemini File Search.
- **Source:** [GG-FILE — Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)

### RET-05 — Tune chunk size to the evidence unit

- **Category:** Retrieval / indexing
- **Free vs paid recommendation:** Free configuration with re-indexing cost — recommended using corpus-specific experiments.
- **Evidence grade:** official
- **Summary:** Smaller chunks reduce irrelevant tokens per hit; larger chunks preserve surrounding context. Provider defaults are not universally optimal.
- **Exact action:** Index test variants at several chunk sizes aligned to headings/paragraphs when possible, then select the smallest size that preserves required evidence.
- **Measurement plan:** Evaluate retrieval recall, answer score, chunks/query, retrieved tokens, and indexing/storage cost for each size.
- **Caveat:** Very small chunks lose cross-sentence context and can increase top-k; very large chunks recreate whole-document bloat.
- **Providers:** OpenAI vector stores, Gemini File Search, provider-agnostic retrieval systems.
- **Source:** [GG-FILE — Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)

### RET-06 — Minimize chunk overlap consistent with boundary recall

- **Category:** Retrieval / indexing duplication
- **Free vs paid recommendation:** Free configuration with re-indexing cost — recommended after measuring boundary misses.
- **Evidence grade:** derived
- **Summary:** Overlap repeats tokens across neighboring hits. Reducing it lowers index size and duplicated context when adjacent chunks are retrieved together.
- **Exact action:** Sweep overlap from zero upward; deduplicate identical spans after retrieval and preserve source offsets for citations.
- **Measurement plan:** Track boundary-question recall, duplicate-token ratio in final context, index size, and answer accuracy.
- **Caveat:** Zero overlap can split a decisive statement; chunk size and overlap must be tuned jointly.
- **Providers:** OpenAI vector stores, Gemini File Search, provider-agnostic retrieval systems.
- **Source:** [OA-RETRIEVAL — OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)

### RET-07 — Rewrite conversational queries before retrieval

- **Category:** Retrieval / query formulation
- **Free vs paid recommendation:** Provider feature or small-model call — recommended when queries contain pronouns, politeness, or conversational filler.
- **Evidence grade:** official
- **Summary:** A concise search-oriented rewrite can improve retrieval so fewer results are needed for the same recall.
- **Exact action:** Enable OpenAI `rewrite_query=true` or generate a standalone search query that resolves entities from pinned conversation state; log the rewrite.
- **Measurement plan:** Compare recall@small-k, retrieved tokens, answer score, and rewrite errors against raw-query retrieval.
- **Caveat:** Rewriting can change intent; retain the original query for generation and audit, and bypass rewrite for exact identifiers/quoted text when appropriate.
- **Providers:** OpenAI Retrieval directly; portable to other retrievers.
- **Source:** [OA-RETRIEVAL — OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)

### RET-08 — Tune hybrid lexical/semantic ranking before increasing top-k

- **Category:** Retrieval / ranking
- **Free vs paid recommendation:** Free ranking control on paid retrieval — recommended for corpora mixing exact IDs with conceptual queries.
- **Evidence grade:** official
- **Summary:** Adjusting semantic-versus-keyword weights and reranking can move useful evidence into a smaller result budget.
- **Exact action:** Evaluate semantic-only, lexical-heavy, and balanced reciprocal-rank-fusion settings; select by query class before changing k.
- **Measurement plan:** Measure recall@k, MRR/nDCG, downstream answer score, and retrieved tokens at the same small k.
- **Caveat:** The best weights depend on corpus and query mix; exact API controls shown here are OpenAI-specific.
- **Providers:** OpenAI Retrieval directly; analogous hybrid search elsewhere.
- **Source:** [OA-RETRIEVAL — OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)

### RET-09 — Extract only useful sentences from retrieved documents

- **Category:** Retrieval / extractive compression
- **Free vs paid recommendation:** Free/self-hostable compressor or small-model cost — experimental recommendation when retrieved chunks remain verbose.
- **Evidence grade:** experiment
- **Summary:** RECOMP's extractive compressor selects task-useful sentences before adding retrieved material to the generator prompt.
- **Exact action:** Run sentence-level relevance selection over retrieved candidates, retain source spans verbatim, and enforce a post-retrieval token budget.
- **Measurement plan:** Compare tokens, answer score, evidence recall, and citation faithfulness against raw chunks and naive first-sentence truncation.
- **Caveat:** Sentence extraction can miss evidence that only makes sense across sentences or documents.
- **Providers:** Provider-agnostic.
- **Source:** [RECOMP — original paper](https://arxiv.org/abs/2310.04408)

### RET-10 — Synthesize a short multi-document retrieval summary

- **Category:** Retrieval / abstractive compression
- **Free vs paid recommendation:** Paid small-model call or self-hosted compressor — experimental recommendation when many overlapping documents are retrieved.
- **Evidence grade:** experiment
- **Summary:** RECOMP's abstractive compressor merges relevant information across documents into a compact summary before final generation.
- **Exact action:** Summarize the candidate set conditioned on the user query, require source-span IDs for every claim, and send the summary plus minimal supporting excerpts.
- **Measurement plan:** Include compressor cost; evaluate token reduction, factual faithfulness, source coverage, final answer quality, and latency.
- **Caveat:** Abstractive compression can hallucinate or erase disagreements. Preserve provenance and use extractive compression for high-stakes exactness.
- **Providers:** Provider-agnostic.
- **Source:** [RECOMP — original paper](https://arxiv.org/abs/2310.04408)

### RET-11 — Skip retrieval or augmentation when it adds no value

- **Category:** Retrieval / adaptive gating
- **Free vs paid recommendation:** Free rule/classifier or small-model call — experimental recommendation for mixed factual and non-factual workloads.
- **Evidence grade:** experiment
- **Summary:** Self-RAG retrieves on demand, and RECOMP can emit an empty augmentation when results are irrelevant. Avoiding unconditional fixed-k retrieval saves both retrieval and context tokens.
- **Exact action:** Add a calibrated gate using query type, confidence, and relevance scores; permit zero retrieved chunks and fall back to retrieval when factuality or uncertainty requires it.
- **Measurement plan:** Track retrieval-call rate, zero-context rate, cost, factual accuracy, unsupported claims, and false-skip errors versus always-retrieve.
- **Caveat:** The dangerous failure is skipping retrieval when current or proprietary facts are required; bias the gate toward retrieval for high-stakes or freshness-sensitive questions.
- **Providers:** Provider-agnostic.
- **Source:** [SELF-RAG — original paper](https://arxiv.org/abs/2310.11511)

### RET-12 — Retrieve from a tree of recursive summaries

- **Category:** Retrieval / hierarchical index
- **Free vs paid recommendation:** Paid preprocessing or self-hosted summarization — experimental recommendation for long, multi-level documents.
- **Evidence grade:** experiment
- **Summary:** RAPTOR recursively clusters and summarizes chunks, then retrieves at the level of abstraction appropriate to the query.
- **Exact action:** Build a tree whose leaves are source chunks and internal nodes are summaries; retrieve across levels and descend to leaves when exact evidence is needed.
- **Measurement plan:** Compare input tokens, multi-hop QA, retrieval recall, preprocessing/update cost, and citation faithfulness against flat chunk retrieval.
- **Caveat:** Tree maintenance is expensive for frequently changing corpora, and summary nodes need provenance to prevent ungrounded abstraction.
- **Providers:** Provider-agnostic.
- **Source:** [RAPTOR — original paper](https://arxiv.org/abs/2401.18059)

## Recommended implementation order

1. Start with the no-extra-service controls: **PC-01, PC-02, PC-09, PC-15, CTX-01, CTX-02, CTX-03, CTX-08, CTX-09, RET-02, RET-03, and RET-04**.
2. Add native cache controls only after measuring repeat-prefix frequency and break-even reuse: **PC-03 through PC-14** as applicable to the provider.
3. Add retrieval and tool-context controls when documents/tools dominate: **CTX-04 through CTX-06 and RET-01 through RET-08**.
4. Add server compaction for genuinely long sessions: **CMP-01 through CMP-05**.
5. Treat learned compression, long-term memory, adaptive retrieval, and hierarchical retrieval as eval-gated experiments: **CTX-10 through CTX-13, CMP-06 through CMP-11, RET-09 through RET-12**.

## Common scorecard

For every method, compare a fixed representative task set and retain the change only when its quality tradeoff is explicit. At minimum capture:

- task success / exact answer / rubric score;
- required-fact and citation coverage;
- ordinary input, cache-write, cache-read, output, and reasoning tokens as distinct categories;
- compressor, summarizer, embedding, retrieval, storage, and tool-call charges;
- end-to-end latency and time-to-first-token;
- cache hit/write/miss rates and reuse count per prefix;
- truncations, retries, refetches, empty retrievals, and state-loss incidents;
- provider, model snapshot, interface, context limit, TTL, and price snapshot.

The denominator should be successful tasks, not calls. A tactic that lowers tokens but increases retries or silently loses required state is not a saving.
