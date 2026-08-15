# Provider-specific LLM cost and token optimization methods

Research date: **2026-08-15**
Scope: OpenAI, Anthropic, Google Gemini, xAI Grok, DeepSeek, Kimi, Qwen / Alibaba Cloud Model Studio, Mistral, and Cohere.
Evidence policy: official provider documentation and pricing pages only. Prices are USD unless a provider page states otherwise.

## How to read this catalogue

- **Evidence** separates an official observation from the recommendation inferred from it. “Derived recommendation” is analysis, not a provider promise.
- **Access recommendation** describes how a cost-control product should expose the method: default-on guidance, opt-in, conditional, or warning-only.
- “No published mechanism” means that the reviewed official documentation did not publish one as of the research date. It is not proof that the provider has no internal capability.
- Cache-hit prices are stated as multiples of the model's ordinary input price when that is how the provider defines them. A cache write multiplier can mean the entire written prefix, not merely a surcharge.

## OpenAI

### PS-OA-01 — Shape prompts for automatic prefix caching

- **ID:** `PS-OA-01`
- **Title:** Shape prompts for automatic prefix caching
- **Category:** Prompt caching
- **Access recommendation:** Default-on lint and prompt-layout guidance.
- **Evidence:** **Official observation:** Prompt caching applies automatically to supported recent models. It requires exact prefix matches; static instructions, examples, tools, and images should precede changing user data. The default minimum eligible prefix is 1,024 tokens for GPT-5.6 and generally 1,024–2,048 tokens on earlier supported models. `prompt_cache_key` helps route related requests but does not relax exact-match requirements. **Derived recommendation:** canonicalize the stable prefix and append request-specific content last.
- **Summary:** A stable, sufficiently long leading prefix can lower input cost and latency without a separate cache-create API.
- **Action:** Keep model, developer/system text, tool definitions and order, image inputs, and examples byte-stable; move volatile IDs, timestamps, retrieval results, and the current question to the suffix; set a stable, non-secret `prompt_cache_key` for the workload.
- **Measure:** Track `usage.prompt_tokens_details.cached_tokens`, cache-hit ratio by key/workload, uncached input tokens, and p50/p95 latency before and after canonicalization.
- **Caveat:** Cached tokens still count toward rate limits. A shared key is not a semantic cache, and excessive traffic on one key can cause overflow; OpenAI suggests roughly 15 requests/minute per key before partitioning. Earlier-model in-memory entries may be evicted after roughly 5–10 minutes of inactivity and sometimes survive up to one hour off peak.
- **Providers:** OpenAI only; do not transpose its key or threshold semantics to Anthropic, Gemini, or Qwen.
- **Source:** [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### PS-OA-02 — Use GPT-5.6 explicit cache breakpoints and 30-minute writes deliberately

- **ID:** `PS-OA-02`
- **Title:** Use GPT-5.6 explicit cache breakpoints and 30-minute writes deliberately
- **Category:** Prompt caching / TTL economics
- **Access recommendation:** Opt-in advanced control with a write-amortization estimator.
- **Evidence:** **Official observation:** GPT-5.6 supports explicit cache breakpoints. In explicit mode, matching is attempted only at marked breakpoints; an unmarked shorter prefix is not used as a fallback. The top-level `instructions` field cannot itself carry a breakpoint. The only documented extended TTL is `30m`; a write is 1.25× ordinary input, a read 0.1×, and the TTL starts at the write and refreshes on a read. Reusing the same cached prefix refreshes it without another write charge. **Derived recommendation:** mark stable boundaries and use 30-minute caching only when expected reuse amortizes the write.
- **Summary:** Explicit breakpoints make cache boundaries predictable, but a misplaced or missing marker can eliminate an otherwise possible hit.
- **Action:** Place a breakpoint after each intentionally reusable content block, retain the same `prompt_cache_key`, enable `prompt_cache_retention: "30m"` for reuse windows longer than transient memory, and avoid explicit mode when the caller cannot preserve markers.
- **Measure:** Compare `cache_write_tokens`, `cached_tokens`, cache writes per successful read, and total input dollars per task; alert on explicit-cache requests with zero marked breakpoints or repeated writes without reads.
- **Caveat:** The 1.25× write rate is the price of written tokens, not an extra 1.25× surcharge. Matching includes the marked content and everything before it. This is GPT-5.6 behavior and must not be assumed for older OpenAI models.
- **Providers:** OpenAI GPT-5.6 family.
- **Source:** [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

### PS-OA-03 — Move latency-tolerant work to Batch or Flex

- **ID:** `PS-OA-03`
- **Title:** Move latency-tolerant work to Batch or Flex
- **Category:** Processing tier / asynchronous workloads
- **Access recommendation:** Recommend for evaluation, enrichment, classification, summarization, and other retry-safe work that can tolerate delayed completion.
- **Evidence:** **Official observation:** Batch provides a 50% input/output discount, a separate pool of higher rate limits, and completion within 24 hours. Current pricing tables also list Flex at one-half Standard token rates for supported models. **Derived recommendation:** send deadline-flexible bulk work to Batch; consider Flex for synchronous or streaming-tolerant workloads that accept its service characteristics.
- **Summary:** Processing tier selection can halve token prices without changing prompt content.
- **Action:** Queue idempotent requests into Batch files, record custom IDs for reconciliation, and reserve Standard/Fast for interactive paths with demonstrated latency value.
- **Measure:** Report eligible-token share shifted from Standard, realized dollars/request, completion-window misses, failed/expired batch rows, and latency/SLO impact.
- **Caveat:** Batch is asynchronous with a 24-hour target, not an interactive tier. Flex availability and service behavior are model-specific. Do not treat “50%” as proof that every non-token add-on, tool, or regional surcharge is halved.
- **Providers:** OpenAI.
- **Source:** [OpenAI Batch API](https://developers.openai.com/api/docs/guides/batch), [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

### PS-OA-04 — Guard the GPT-5.6 long-context price cliff

- **ID:** `PS-OA-04`
- **Title:** Guard the GPT-5.6 long-context price cliff
- **Category:** Long-context pricing / model routing
- **Access recommendation:** Default-on preflight warning and hard budget option.
- **Evidence:** **Official observation:** GPT-5.6 requests with more than 272,000 input tokens use long-context rates for the entire request. Standard rates rise from 1× to 2× for uncached input, cached input, and cache writes, and to 1.5× for output. OpenAI's current guidance positions GPT-5.6 as the hardest-task model, GPT-5.6 Terra as lower cost, and GPT-5.6 Luna for high-volume simple work. **Derived recommendation:** summarize, retrieve, or route before crossing 272K unless the larger prompt improves measured task value.
- **Summary:** One token over the boundary changes the rate of all request tokens; it is not a marginal surcharge on excess tokens.
- **Action:** Estimate input tokens before dispatch, expose remaining headroom to 272K, compact history and retrieved documents, and evaluate Terra/Luna routing at the same and one lower reasoning level.
- **Measure:** Count requests on each side of 272K, dollars saved by compaction/routing, quality delta, and the number of avoidable boundary crossings.
- **Caveat:** The rule is **more than** 272K input tokens. OpenAI's threshold differs from xAI's **at least** 200K and Gemini's **more than** 200K boundaries. Regional processing for eligible models may add 10% independently.
- **Providers:** OpenAI GPT-5.6 family.
- **Source:** [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model)

### PS-OA-05 — Lower reasoning and verbosity before changing models

- **ID:** `PS-OA-05`
- **Title:** Lower reasoning and verbosity before changing models
- **Category:** Reasoning/output control
- **Access recommendation:** Recommend an evaluation ladder; never change silently in production.
- **Evidence:** **Official observation:** OpenAI recommends testing a workload at its current reasoning setting and one level lower. GPT-5.6 exposes `text.verbosity` (`low`, `medium`, `high`), and Pro mode increases model work and token use while charging at standard token rates. **Derived recommendation:** use the lowest reasoning level and verbosity that preserves evaluation quality, and gate Pro behind hard-task detection.
- **Summary:** Output and hidden reasoning can often be reduced independently of model routing.
- **Action:** Run paired evaluations across reasoning levels and verbosity, cap output tokens, choose low verbosity for machine-consumed results, and permit Pro only for a narrow evaluated class.
- **Measure:** Completion plus reasoning tokens, answer length, tool-call count, task score, retries, and cost per successful task.
- **Caveat:** Lower settings can reduce correctness or tool-use persistence. “Pro” is not a discounted service tier and its extra internal work is billable. Preserve comparable prompts and sampling settings during evaluation.
- **Providers:** OpenAI GPT-5.6 family.
- **Source:** [OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model), [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

### PS-OA-06 — Budget built-in tools separately from model tokens

- **ID:** `PS-OA-06`
- **Title:** Budget built-in tools separately from model tokens
- **Category:** Tool and storage fees
- **Access recommendation:** Default-on cost decomposition and explicit tool-call caps.
- **Evidence:** **Official observation:** Current list prices include web search at $10/1,000 calls plus search-content tokens at model rates; file search at $2.50/1,000 calls plus $0.10/GB-day storage after the first free GB; and containers at $0.03/$0.12/$0.48/$1.92 per 20-minute session for 1/4/16/64 GB, with eligible per-minute billing subject to a five-minute minimum. Built-in tool input/output tokens are also billed at model rates. The preview non-reasoning web-search route uses a different $25/1,000-call rule with search content free, and `gpt-4o-mini`/`gpt-4.1-mini` non-preview search uses a fixed 8,000 input-token block per call. **Derived recommendation:** optimize tool frequency, result size, storage lifetime, and container reuse separately.
- **Summary:** A low model-token bill can conceal dominant per-call, storage, or compute charges.
- **Action:** Log tool name, calls, returned tokens, stored GB-days, container size/lifetime, and model tokens; cap searches; delete stale vector stores; reuse right-sized containers within a session.
- **Measure:** Total cost by model versus tool component, dollars per successful tool-assisted task, search calls/prompt, GB-days, and container utilization.
- **Caveat:** Tool pricing rules are tool-, model-, and version-specific. A “web search call” is not economically equivalent across OpenAI, Gemini, xAI, Anthropic, or Mistral.
- **Providers:** OpenAI.
- **Source:** [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

## Anthropic Claude

### PS-AN-01 — Select 5-minute or 1-hour prompt-cache writes from the reuse window

- **ID:** `PS-AN-01`
- **Title:** Select 5-minute or 1-hour prompt-cache writes from the reuse window
- **Category:** Prompt caching / TTL economics
- **Access recommendation:** Default to 5 minutes; offer one hour only with projected reuse.
- **Evidence:** **Official observation:** Claude prompt-cache reads cost 0.1× base input, 5-minute writes 1.25×, and 1-hour writes 2×. The default five-minute TTL is measured from request start, refreshes on a hit at no additional write cost, and generation time consumes part of the TTL. **Derived recommendation:** choose the shortest TTL that spans the expected interval to the next reuse, and precompute a break-even estimate.
- **Summary:** Claude exposes two cache-write products with materially different upfront prices.
- **Action:** Keep reusable content before the cache boundary, select one hour only for sparse reuse or long-running asynchronous work, and stop writing prefixes that usually expire before a read.
- **Measure:** Writes, reads, read/write token ratio, time-to-first-reuse, expiration misses, and total cache-adjusted input cost.
- **Caveat:** Cache multipliers stack with Batch and data-residency multipliers. A one-hour write is 2× the base input price for written tokens, not an added 200% fee.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### PS-AN-02 — Place no more than four cache breakpoints with the 20-block lookback in mind

- **ID:** `PS-AN-02`
- **Title:** Place no more than four cache breakpoints with the 20-block lookback in mind
- **Category:** Prompt-cache structure
- **Access recommendation:** Advanced prompt linter with a visible breakpoint budget.
- **Evidence:** **Official observation:** Claude permits up to four cache breakpoints. A top-level automatic `cache_control` consumes one of those slots. Explicit matching checks up to 20 content blocks backward from each breakpoint, and the cache hierarchy is `tools`, then `system`, then `messages`; changing earlier content invalidates later cached content. **Derived recommendation:** put boundaries after large, stable logical regions rather than marking every message.
- **Summary:** Claude's cache is a bounded backward scan over an ordered prompt structure, not a general message memoizer.
- **Action:** Preserve tool order and schemas, keep system material stable, group small blocks where sensible, and reserve the final breakpoint for a reusable conversation tail.
- **Measure:** Breakpoints/request, eligible prefix size, hits by breakpoint, invalidations caused by tool/system changes, and requests whose intended target lies beyond 20 blocks.
- **Caveat:** Adding more than four markers or assuming an unlimited backward search creates false expectations. OpenAI GPT-5.6's explicit breakpoint matching and Qwen's four-marker/20-block scheme have similar-looking numbers but different APIs and billing.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PS-AN-03 — Warm large cacheable prefixes before parallel fan-out

- **ID:** `PS-AN-03`
- **Title:** Warm large cacheable prefixes before parallel fan-out
- **Category:** Prompt caching / concurrency
- **Access recommendation:** Conditional orchestration for fan-out jobs.
- **Evidence:** **Official observation:** A cache entry becomes available only after the first response begins. Anthropic publishes model-dependent minimum cacheable prefixes: 512 tokens for some newest models, 1,024 for several Sonnet/Haiku models, 2,048 for Mythos Preview/Opus 4.7, and 4,096 for Opus 4.6/4.5 and Haiku 4.5. Requests below the applicable minimum silently do not cache. **Derived recommendation:** issue and observe one warm-up response before concurrent requests that share a large prefix.
- **Summary:** Immediate parallel fan-out can pay multiple writes or miss the cache entirely.
- **Action:** Look up the exact model minimum, wait until the warm response starts, then release the fan-out; avoid cache markers on prefixes smaller than the model minimum.
- **Measure:** Duplicate writes during fan-out, time from warm request to response start, cached-read share, and below-minimum attempted cache writes.
- **Caveat:** Minimums change by model and can differ across model revisions. A silent miss is not an API error. Do not copy OpenAI's 1,024-token minimum onto Claude.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PS-AN-04 — Batch delayed Messages requests, with a TTL sized for shared context

- **ID:** `PS-AN-04`
- **Title:** Batch delayed Messages requests, with a TTL sized for shared context
- **Category:** Batch processing
- **Access recommendation:** Recommend for non-interactive Messages workloads.
- **Evidence:** **Official observation:** Message Batches charge 50% of standard input and output prices and support nearly all Messages API features, including tools and extended thinking; Fast mode is not supported. Batches can take longer than the five-minute cache TTL. **Derived recommendation:** batch eligible work and, when many batch rows reuse one cacheable context, assess a one-hour write rather than assuming the five-minute entry will survive scheduling.
- **Summary:** Batch and prompt caching can combine, but the asynchronous schedule changes cache-TTL economics.
- **Action:** Submit retry-safe rows with stable custom IDs, use batch token rates in forecasts, and select cache TTL from actual batch queue-to-execution intervals.
- **Measure:** Batch success/expiry rates, processing latency, 5-minute versus 1-hour cache-hit rates, and realized discount after cache multipliers.
- **Caveat:** “Batch is 50%” does not mean a cache read or write is simply half of an uncached Standard request; Anthropic specifies that multipliers stack. Fast requests cannot be batched.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic Message Batches](https://platform.claude.com/docs/en/build-with-claude/batch-processing), [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### PS-AN-05 — Lower effort without churning a cached conversation

- **ID:** `PS-AN-05`
- **Title:** Lower effort without churning a cached conversation
- **Category:** Reasoning/output control
- **Access recommendation:** Evaluate at workflow boundaries; keep fixed within a cached thread.
- **Evidence:** **Official observation:** Supported Claude models expose an effort setting whose default is `high`; lower effort can reduce tokens and tool calls. Changing effort in an existing conversation invalidates prompt caching. **Derived recommendation:** select the lowest validated effort before starting a long cached thread and avoid per-turn oscillation.
- **Summary:** An effort reduction can save reasoning and tool cost, while a mid-thread change can forfeit cache savings.
- **Action:** Evaluate low/medium/high on representative tasks, pin the result per conversation, and start a new cache segment if a change is necessary.
- **Measure:** Output tokens, tool calls, task quality, latency, cache invalidations, and net cost including the lost cache read.
- **Caveat:** Lower effort is not guaranteed to preserve correctness. The exact available values and behavior are model-dependent, and Anthropic effort is not numerically equivalent to OpenAI or Gemini reasoning controls.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic effort](https://platform.claude.com/docs/en/build-with-claude/effort), [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### PS-AN-06 — Meter tool schemas, results, and execution resources independently

- **ID:** `PS-AN-06`
- **Title:** Meter tool schemas, results, and execution resources independently
- **Category:** Tool and compute fees
- **Access recommendation:** Default-on component-level tool telemetry.
- **Evidence:** **Official observation:** Tool schemas and Anthropic-supplied tool system prompts consume input tokens. Web search costs $10/1,000 searches plus result tokens; failed searches are not billed. Web fetch has no separate call fee but fetched content is token-billed and supports `max_content_tokens`. Standalone code execution includes 1,550 organization hours/month and then costs $0.05/container-hour with a five-minute minimum; preloading files starts container billing even if execution is never invoked. Managed Agents runtime is $0.08/session-hour, idle time excluded, and is unavailable in Batch. **Derived recommendation:** constrain result sizes, avoid speculative file preload, and distinguish token, call, and runtime charges.
- **Summary:** “Using a tool” can create up to three cost surfaces: prompt schema/results, per-call fees, and execution/session time.
- **Action:** Set fetch limits, cache or reuse stable tool definitions, cap searches, preload only required files, and close/reuse containers or agent sessions appropriately.
- **Measure:** Tool-definition tokens, result tokens, successful searches, fetch size, container/session active minutes, and total cost per tool-assisted answer.
- **Caveat:** Newer code execution bundled with web search/fetch can follow different fee treatment. Provider tool names do not identify a common unit of billing.
- **Providers:** Anthropic Claude.
- **Source:** [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)

## Google Gemini

### PS-GG-01 — Engineer for implicit caching, but never budget it as guaranteed

- **ID:** `PS-GG-01`
- **Title:** Engineer for implicit caching, but never budget it as guaranteed
- **Category:** Prompt caching
- **Access recommendation:** Default-on layout guidance; forecast misses as the baseline.
- **Evidence:** **Official observation:** Implicit caching is enabled by default on Gemini 2.5 and newer supported models, but a cost saving is not guaranteed. Google recommends placing common, large content at the beginning and sending similar-prefix requests close together. Published minimums include 2,048 tokens for Gemini 2.5 Pro/Flash and 4,096 for listed 3.x Flash/Pro models. **Derived recommendation:** optimize prefix stability while treating observed hits as upside rather than contracted savings.
- **Summary:** Gemini can discount a repeated prefix automatically, but the platform retains discretion over a hit.
- **Action:** Canonicalize system text, tool definitions, and large shared content; append dynamic data; group temporally related jobs; preflight against the exact model minimum.
- **Measure:** `cachedContentTokenCount`, input cost versus an all-miss baseline, hit rate by model/prefix length, and time between similar requests.
- **Caveat:** Reaching the minimum does not guarantee a hit. The minimum table changes by model. A Gemini implicit cache is not the same product as an OpenAI routing key or DeepSeek's disk cache.
- **Providers:** Google Gemini Developer API.
- **Source:** [Gemini context caching](https://ai.google.dev/gemini-api/docs/caching)

### PS-GG-02 — Use explicit cached-content objects only when reuse beats storage rent

- **ID:** `PS-GG-02`
- **Title:** Use explicit cached-content objects only when reuse beats storage rent
- **Category:** Prompt caching / storage
- **Access recommendation:** Opt-in with a storage-and-read break-even calculator.
- **Evidence:** **Official observation:** Explicit caching is available for `GenerateContent`; the Interactions API supports implicit caching only. Explicit caches default to a one-hour TTL, allow TTL or absolute-expiration updates and deletion, and charge both reduced cached-input tokens and token-hours of storage. Google documents no minimum or maximum TTL bound. Cached content itself cannot be retrieved later; only metadata is available. **Derived recommendation:** create a named cache for large prefixes with known repeated use, then delete or shorten it when the workload ends.
- **Summary:** Unlike most provider caches, Gemini explicit caching is a stored resource with ongoing rent.
- **Action:** Estimate reads within the TTL, create the cache once, persist its resource name, renew only while reuse continues, and delete abandoned caches promptly.
- **Measure:** Cache token-hours, reads/cache, saved input dollars minus storage cost, stale-cache age, and failed attempts to use an expired resource.
- **Caveat:** Cached tokens still count toward context and token limits. “One hour” is a default, not a hard maximum. The resource is not a content-recovery store.
- **Providers:** Google Gemini `GenerateContent`.
- **Source:** [Gemini context caching](https://ai.google.dev/gemini-api/docs/caching), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### PS-GG-03 — Apply Batch prices cell by cell, not as a universal 50% multiplier

- **ID:** `PS-GG-03`
- **Title:** Apply Batch prices cell by cell, not as a universal 50% multiplier
- **Category:** Batch processing / pricing
- **Access recommendation:** Recommend for asynchronous `GenerateContent`, but use the provider table in cost calculations.
- **Evidence:** **Official observation:** Gemini Batch is available for `GenerateContent`, targets completion within 24 hours, and is described as 50% of standard cost. The price table nevertheless gives separate values by component; for Gemini 2.5 Pro at up to 200K input, Standard input/cached-input/output are $1.25/$0.125/$10 per million tokens and Batch is $0.625/$0.125/$5, so cached input and cache-storage rates are not halved. **Derived recommendation:** store explicit Standard and Batch cells rather than multiplying a final request bill by 0.5.
- **Summary:** Batch halves ordinary input/output for the example, but not every cache or storage component.
- **Action:** Route delayed work to Batch and calculate uncached input, cached input, output, and storage separately from the current model table.
- **Measure:** Component-level forecast versus invoice, batch completion time/failures, uncached token share, and realized total-request discount.
- **Caveat:** The asynchronous product is limited to supported endpoints/models. “50%” is a headline for eligible token components, not a universal fee rule.
- **Providers:** Google Gemini Developer API.
- **Source:** [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### PS-GG-04 — Set thinking level by model and count thought tokens

- **ID:** `PS-GG-04`
- **Title:** Set thinking level by model and count thought tokens
- **Category:** Reasoning/output control
- **Access recommendation:** Default to model defaults initially, then recommend the lowest evaluated level.
- **Evidence:** **Official observation:** Gemini uses dynamic thinking by default and supports model-specific `thinking_level` values. Examples in the current support table include `low/medium/high` for Gemini 3.7 Flash and 3.1 Pro Preview, `minimal/low/medium/high` for Gemini 3.6 Flash and 3.5 Flash-Lite, and different controls for 2.5 models. All generated thought tokens are billed as output even though the API exposes only a summary; usage reports `total_thought_tokens`. **Derived recommendation:** lower or disable thinking for simple tasks only when the exact model permits it and evaluation quality remains acceptable.
- **Summary:** Hidden reasoning is a billable output category and the control vocabulary is not uniform across Gemini models.
- **Action:** Detect the exact model, expose only supported levels, run quality/cost evaluations, and cap the overall output budget while logging thought tokens separately.
- **Measure:** `total_thought_tokens`, visible output tokens, quality, latency, tool calls, and cost/task by level.
- **Caveat:** A value such as `minimal` is not available everywhere, and Gemini thinking levels are not equivalent to OpenAI, Anthropic, Kimi, or DeepSeek effort labels.
- **Providers:** Google Gemini.
- **Source:** [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### PS-GG-05 — Guard the 200K Pro price boundary

- **ID:** `PS-GG-05`
- **Title:** Guard the 200K Pro price boundary
- **Category:** Long-context pricing
- **Access recommendation:** Default-on token preflight and compaction suggestion.
- **Evidence:** **Official observation:** Gemini 2.5 Pro and 3.1 Pro Preview use one price tier for prompts up to and including 200,000 tokens and a higher tier above 200,000; the higher rates apply to the request's token categories rather than only the excess. For Gemini 2.5 Pro Standard, input/cached-input/output rise from $1.25/$0.125/$10 to $2.50/$0.25/$15 per million tokens. **Derived recommendation:** compact, retrieve, or split requests near 200K unless measured quality justifies the step-up.
- **Summary:** A small amount of extra context can reprice the full request.
- **Action:** Count input tokens before submission, show headroom, summarize old conversation turns, reduce retrieved passages, or route to a model without the same boundary when appropriate.
- **Measure:** Requests above/below 200K, tokens removed, quality delta, and dollars avoided per boundary crossing.
- **Caveat:** The Gemini condition is **above** 200K, while xAI's published long-context condition is **at least** 200K. The model list and rates can change.
- **Providers:** Google Gemini Pro models with tiered long-context pricing.
- **Source:** [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

### PS-GG-06 — Count grounding queries, not just grounded prompts

- **ID:** `PS-GG-06`
- **Title:** Count grounding queries, not just grounded prompts
- **Category:** Tool fees
- **Access recommendation:** Default-on per-tool call and token telemetry.
- **Evidence:** **Official observation:** Current Gemini 3.x Search pricing includes a shared 5,000 free search requests/month and then $14/1,000 search queries; one API prompt can generate multiple search queries. Gemini 2.5 Search instead uses 1,500 free grounded prompts/day and then $35/1,000 grounded prompts. URL Context retrieved content is charged as input tokens, code execution has no additional runtime charge but its input/output tokens are billed, and File Search adds embedding charges of $0.15/million tokens plus retrieved-context tokens. **Derived recommendation:** meter the provider's actual billing unit for each model/tool generation.
- **Summary:** The word “search” hides query-based, prompt-based, token-based, and embedding charges.
- **Action:** Log generated search-query count, grounded-prompt count, returned context tokens, embedding tokens, and model generation; constrain retrieval and search depth.
- **Measure:** Tool fees plus model tokens per answered task, searches per prompt, free-tier utilization, and marginal accuracy from each additional query.
- **Caveat:** Gemini 3.x and 2.5 use different search billing units. Developer API and Google Cloud/Agent products can have different price sheets and must not be merged.
- **Providers:** Google Gemini Developer API.
- **Source:** [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)

## xAI Grok

### PS-XA-01 — Preserve an exact prefix and supply a stable cache-routing key

- **ID:** `PS-XA-01`
- **Title:** Preserve an exact prefix and supply a stable cache-routing key
- **Category:** Prompt caching
- **Access recommendation:** Default-on prompt layout and telemetry; no TTL-based promise.
- **Evidence:** **Official observation:** xAI prompt caching is automatic on supported Grok models and requires exact-prefix reuse. xAI documents `x-grok-conv-id` and `prompt_cache_key` as ways to improve routing of related requests, with cache usage exposed in different fields for Chat Completions and Responses. The public guide does not publish a deterministic TTL and warns that entries may be evicted. **Derived recommendation:** hold the early conversation/tools constant, append changes, and treat a key as a routing hint rather than a durable cache handle.
- **Summary:** Repeated prefixes can receive cached-input pricing, but the application cannot assume persistence for a particular duration.
- **Action:** Canonicalize shared content and tool order, use a stable non-secret key per workload/conversation, and branch the usage parser by endpoint.
- **Measure:** Cached versus uncached input tokens, hit rate by key and inter-request delay, cost saved, and field-parsing coverage for each endpoint.
- **Caveat:** No published TTL means a TTL countdown or guaranteed-hit forecast would be fabricated. A routing key does not permit different content to match.
- **Providers:** xAI Grok.
- **Source:** [xAI prompt caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing), [xAI pricing](https://docs.x.ai/developers/pricing)

### PS-XA-02 — Preflight the inclusive 200K long-context boundary

- **ID:** `PS-XA-02`
- **Title:** Preflight the inclusive 200K long-context boundary
- **Category:** Long-context pricing
- **Access recommendation:** Default-on warning at and near 200K.
- **Evidence:** **Official observation:** xAI's current text-model pricing table applies long-context rates when prompt input is **at least 200K tokens**. The table doubles input, cached-input, and output prices for the listed Grok models, and cached input tokens count when determining the threshold. **Derived recommendation:** keep routine requests strictly below 200K and include cached tokens in the preflight estimate.
- **Summary:** At exactly 200,000 prompt tokens the full request enters the higher tier.
- **Action:** Count all prompt input, compact history/retrieval, surface distance to 200K, and split or route oversized work if quality permits.
- **Measure:** Requests at/above the boundary, cached tokens included in classification, compaction savings, and quality change.
- **Caveat:** This condition is inclusive, unlike Gemini's “above 200K” rule. The rate change applies to the full request, not only tokens beyond the boundary.
- **Providers:** xAI Grok models listed with long-context pricing.
- **Source:** [xAI pricing](https://docs.x.ai/developers/pricing)

### PS-XA-03 — Use Batch only where the model table actually grants 20%

- **ID:** `PS-XA-03`
- **Title:** Use Batch only where the model table actually grants 20%
- **Category:** Batch processing
- **Access recommendation:** Conditional recommendation driven by exact model eligibility.
- **Evidence:** **Official observation:** xAI Batch provides a 20% discount for listed eligible text models—currently Grok 4.3 and specified Grok 4.20 variants—and the discount applies to input, output, cached input, and reasoning tokens. Unlisted models receive no batch discount, and image/video batch work is billed at standard rates. Most batches complete within 24 hours. **Derived recommendation:** batch latency-tolerant work only after verifying the selected model is in the current discount table.
- **Summary:** xAI's Batch discount is smaller and narrower than the 50% programs at several peers.
- **Action:** Resolve model eligibility from the live table, forecast every token category at 0.8× only for eligible rows, and use row IDs for asynchronous reconciliation.
- **Measure:** Eligible versus ineligible batch tokens, realized discount, completion latency, expired/failed rows, and reasoning-token share.
- **Caveat:** Batch is not universally discounted and “batch” does not mean 50%. Image/video batches do not inherit the text discount.
- **Providers:** xAI Grok eligible text models.
- **Source:** [xAI Batch API](https://docs.x.ai/developers/advanced-api-usage/batch-api), [xAI pricing](https://docs.x.ai/developers/pricing)

### PS-XA-04 — Pay 2× for Priority only on latency-valued paths

- **ID:** `PS-XA-04`
- **Title:** Pay 2× for Priority only on latency-valued paths
- **Category:** Processing tier / latency
- **Access recommendation:** Opt-in per route with an SLO and fallback audit.
- **Evidence:** **Official observation:** Priority processing charges 2× the standard price for input, cached input, output, and reasoning tokens after caching. Billing at the priority rate occurs only when the response reports the Priority service tier; a fallback response is billed at Standard. Priority is not available for Batch, image, or video generation. **Derived recommendation:** reserve Priority for interactive calls whose measured latency value exceeds the premium.
- **Summary:** Priority doubles all text-token categories but fallback must be priced from the returned tier.
- **Action:** Enable it only for critical user-facing requests, record the returned service tier, and compare latency/value against the same request class on Standard.
- **Measure:** Priority fulfillment/fallback rate, p50/p95 latency improvement, 2× token premium, conversion or SLO value, and cached-token share.
- **Caveat:** Do not price from the requested tier alone. Priority is applied after the cache rate, and it cannot be combined with Batch.
- **Providers:** xAI Grok supported text models.
- **Source:** [xAI Priority processing](https://docs.x.ai/developers/advanced-api-usage/priority-processing), [xAI pricing](https://docs.x.ai/developers/pricing)

### PS-XA-05 — Separate tool calls, tool-result tokens, and reasoning tokens

- **ID:** `PS-XA-05`
- **Title:** Separate tool calls, tool-result tokens, and reasoning tokens
- **Category:** Tool and reasoning fees
- **Access recommendation:** Default-on component ledger and call caps.
- **Evidence:** **Official observation:** xAI lists Web Search, X Search, and Code Execution at $5/1,000 calls; attachments at $10/1,000; collections search/file search at $2.50/1,000; and remote MCP invocation at no separate call charge. Tool input/output tokens remain additive. Reasoning tokens are billed at the model's completion-token rate. A Responses request caught by the pre-generation safety system can carry a $0.05 fee. **Derived recommendation:** optimize tool frequency/result size and reasoning volume separately from ordinary output.
- **Summary:** “One response” can contain model input, cached input, reasoning, visible output, tool-call fees, and tool-result tokens.
- **Action:** Capture all usage categories, cap iterative search/tool loops, trim result payloads, and route simple tasks to lower-cost models or reasoning settings when evaluated.
- **Measure:** Calls/tool, tool-result tokens, reasoning tokens, visible output tokens, safety fees, and all-in cost per successful task.
- **Caveat:** A free remote-MCP invocation is not a free MCP-assisted response because model tokens still apply. Tool-call units are not comparable with Gemini's search queries or Anthropic's search calls.
- **Providers:** xAI Grok.
- **Source:** [xAI pricing](https://docs.x.ai/developers/pricing)

## DeepSeek

### PS-DS-01 — Design for the automatic 64-token disk cache

- **ID:** `PS-DS-01`
- **Title:** Design for the automatic 64-token disk cache
- **Category:** Prompt caching
- **Access recommendation:** Default-on exact-prefix guidance; no manual cache UI.
- **Evidence:** **Official observation:** DeepSeek's disk cache is automatic and requires an exact match from the first prompt token; matching text in the middle does not qualify. Storage uses 64-token units, prompts shorter than 64 tokens are not cached, storage is free, and unused entries are typically cleared after hours to days without a guarantee. Usage exposes `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens`. **Derived recommendation:** stabilize the prompt beginning and forecast using observed hits, not assumed persistence.
- **Summary:** DeepSeek offers unusually low cache-hit prices without cache IDs or explicit write/TTL management.
- **Action:** Put fixed system text and shared documents first, append changes, preserve serialization, and log hit/miss tokens for every request.
- **Measure:** Hit-token ratio, time between matching requests, prefix length in 64-token blocks, miss cost, and cache savings.
- **Caveat:** The cache only reuses a prefix from token zero. There is no guaranteed TTL or manual invalidation contract, so hours-to-days is an operational observation, not an SLA.
- **Providers:** DeepSeek API.
- **Source:** [DeepSeek context caching](https://api-docs.deepseek.com/guides/kv_cache/), [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)

### PS-DS-02 — Schedule bulk work around the new UTC off-peak window only after activation

- **ID:** `PS-DS-02`
- **Title:** Schedule bulk work around the new UTC off-peak window only after activation
- **Category:** Time-of-day pricing
- **Access recommendation:** Time-gated scheduler with the published effective date stored explicitly.
- **Evidence:** **Official observation:** The current price page says the new peak/off-peak schedule begins **2026-08-16 at 16:00 UTC**, one day after this research date. Peak periods are 01:00–04:00 UTC and 06:00–10:00 UTC; all other hours are off peak, priced at half the peak rate. Until activation, the page lists temporary prices—for example `deepseek-v4-flash` cache-hit/cache-miss/output at $0.0028/$0.14/$0.28 per million tokens. **Derived recommendation:** delay flexible jobs into off-peak windows after the effective instant, but do not retroactively apply future rates.
- **Summary:** DeepSeek is the reviewed provider with an explicit scheduled time-of-day discount, and it is date-sensitive.
- **Action:** Store the effective timestamp and UTC windows, convert them for users without changing the billing basis, and schedule only latency-tolerant queues off peak.
- **Measure:** Tokens by peak/off-peak window, job-delay minutes, realized rate, SLO misses, and forecast-versus-invoice after activation.
- **Caveat:** This item is forward-effective as of the research date. Pricing can change again; refresh the page rather than hard-coding a perpetual schedule. Cache-hit and output categories retain their own rates.
- **Providers:** DeepSeek API.
- **Source:** [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)

### PS-DS-03 — Explicitly lower or disable V4 thinking for routine tasks

- **ID:** `PS-DS-03`
- **Title:** Explicitly lower or disable V4 thinking for routine tasks
- **Category:** Reasoning/output control
- **Access recommendation:** Recommend evaluation at `low` and disabled; retain `high`/`max` only where justified.
- **Evidence:** **Official observation:** DeepSeek V4 Flash and Pro enable thinking by default at `high`. The API supports disabling thinking or selecting `low`, `high`, or `max`; `medium` and `xhigh` map to `high`. Thought tokens are part of generated output usage. **Derived recommendation:** override the default for simple extraction, rewriting, classification, and other validated low-reasoning tasks.
- **Summary:** Omitting a thinking control can incur high reasoning by default.
- **Action:** Run task-level evaluations with thinking disabled and at low/high, set the chosen value explicitly, and cap completion tokens.
- **Measure:** Reasoning tokens, visible output, quality, latency, and total output cost per successful task.
- **Caveat:** Labels are not comparable to other providers. Lowering reasoning can reduce accuracy, and aliases such as `medium` do not create an intermediate level on V4.
- **Providers:** DeepSeek V4 Flash and Pro.
- **Source:** [DeepSeek pricing and model controls](https://api-docs.deepseek.com/quick_start/pricing/), [DeepSeek thinking mode](https://api-docs.deepseek.com/guides/thinking_mode/)

### PS-DS-04 — Preserve reasoning content only across tool-call continuations

- **ID:** `PS-DS-04`
- **Title:** Preserve reasoning content only across tool-call continuations
- **Category:** Conversation state / tool use
- **Access recommendation:** Endpoint-aware history serializer with a strict tool-call branch.
- **Evidence:** **Official observation:** In ordinary reasoning conversations without tool calls, previously returned `reasoning_content` may be omitted and is ignored if resent. During a tool-call sequence, however, all reasoning content from the preceding assistant response must be sent back unmodified with the tool result; omitting or altering it causes a 400 error. Temperature, `top_p`, presence-penalty, and frequency-penalty fields are ignored in thinking mode rather than rejected. **Derived recommendation:** strip historical reasoning from normal turns, but preserve it exactly for the active tool continuation.
- **Summary:** DeepSeek has opposite history rules for ordinary turns and in-progress tool chains.
- **Action:** Detect `tool_calls`; if absent, do not retain old reasoning content; if present, persist and replay it verbatim until that tool sequence completes.
- **Measure:** Resent reasoning tokens, request errors, tool-chain completion rate, and input-token savings outside tool calls.
- **Caveat:** A generic “always strip hidden reasoning” optimizer will break tool calls, while “always resend it” wastes input. Ignored sampling parameters should not be presented as effective cost levers.
- **Providers:** DeepSeek reasoning mode.
- **Source:** [DeepSeek thinking mode](https://api-docs.deepseek.com/guides/thinking_mode/)

### PS-DS-05 — Route volume to V4 Flash before paying for Pro

- **ID:** `PS-DS-05`
- **Title:** Route volume to V4 Flash before paying for Pro
- **Category:** Model routing / throughput
- **Access recommendation:** Default candidate for simple/high-volume work, gated by quality evaluations.
- **Evidence:** **Official observation:** Both current V4 Flash and Pro expose a one-million-token context and up to 384K output. At the temporary 2026-08-15 rates, Flash cache-miss/output are $0.14/$0.28 per million versus Pro $0.435/$0.87, and published concurrency is 2,500 for Flash versus 500 for Pro. **Derived recommendation:** use Flash for tasks it passes, reserving Pro for demonstrated quality gains.
- **Summary:** The cheaper model also has the higher documented concurrency limit, so routing can improve both cost and capacity.
- **Action:** Build per-task eval gates, start eligible traffic on Flash, escalate failures/low-confidence cases to Pro, and refresh the rate table after the announced price transition.
- **Measure:** Flash pass rate, escalation rate, quality delta, concurrency saturation, latency, and blended cost.
- **Caveat:** Identical context/output limits do not imply identical quality. The quoted temporary prices expire when the scheduled new price regime begins.
- **Providers:** DeepSeek V4 Flash and Pro.
- **Source:** [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing/)

## Kimi / Moonshot AI

### PS-KI-01 — Meet Kimi's 256-token automatic-cache floor and preserve the opening context

- **ID:** `PS-KI-01`
- **Title:** Meet Kimi's 256-token automatic-cache floor and preserve the opening context
- **Category:** Prompt caching
- **Access recommendation:** Default-on prefix layout and cache diagnostics.
- **Evidence:** **Official observation:** Kimi context caching is automatic; callers do not create cache IDs or manage TTLs. A prior request's prompt must exceed 256 tokens or it is not retained for reuse. The current Chat API also accepts `prompt_cache_key`, recommended as a stable session/task identifier and required by Code Plan. **Derived recommendation:** preserve a sufficiently long initial context and use a stable key where supported, but do not invent a TTL guarantee.
- **Summary:** Kimi's automatic cache has a much lower published eligibility floor than several peers.
- **Action:** Keep fixed instructions/shared context at the beginning, append changing turns, supply a non-secret task/session key, and avoid cache forecasts for prompts below 256 tokens.
- **Measure:** Cached versus uncached input usage, prompt length, hit rate by key and inter-request interval, and savings.
- **Caveat:** The public guide does not expose manual lifetime control. A `prompt_cache_key` improves affinity; it does not make non-identical prefixes interchangeable.
- **Providers:** Kimi API.
- **Source:** [Kimi context caching](https://platform.kimi.ai/docs/guide/use-context-caching-feature-of-kimi-api.md), [Kimi Chat API](https://platform.kimi.ai/docs/api/chat)

### PS-KI-02 — Use the 40%-of-standard Batch rate only on its supported model list

- **ID:** `PS-KI-02`
- **Title:** Use the 40%-of-standard Batch rate only on its supported model list
- **Category:** Batch processing
- **Access recommendation:** Recommend for delayed work after exact model validation.
- **Evidence:** **Official observation:** Kimi Batch charges 40% of standard prices—a 60% discount—but currently supports only listed models including `kimi-k2.7-code`, `kimi-k2.6`, and `kimi-k2.5`; Kimi K3 and K2.7 Highspeed are not supported. Completion is asynchronous and subject to a requested completion window. **Derived recommendation:** batch eligible non-interactive work and reject or reroute unsupported model selections before upload.
- **Summary:** Kimi's batch discount is larger than several peers, but the newest/general and high-speed options may be excluded.
- **Action:** Resolve aliases to exact model IDs, calculate the published Batch cells, validate completion-window tolerance, and reconcile rows by custom ID.
- **Measure:** Eligible-token share, realized 60% savings, expired/failed requests, completion latency, and unsupported-model attempts.
- **Caveat:** “60% discount” means paying 40% of Standard, not paying 60%. Batch is not a concurrency accelerator or an interactive endpoint.
- **Providers:** Kimi Batch-supported models.
- **Source:** [Kimi Batch pricing](https://platform.kimi.ai/docs/pricing/batch.md)

### PS-KI-03 — Override K3's default maximum reasoning for routine work

- **ID:** `PS-KI-03`
- **Title:** Override K3's default maximum reasoning for routine work
- **Category:** Reasoning/output control
- **Access recommendation:** Recommend a `low` evaluation for routine tasks; keep `max` for proven hard cases.
- **Evidence:** **Official observation:** Kimi K3 always uses reasoning and exposes `low`, `high`, and `max`, with `max` as the default. Its current token rates are $0.30 cached input, $3 uncached input, and $15 output per million, with a 1,048,576-token context window. **Derived recommendation:** set `low` explicitly on routine tasks that meet quality targets because omitted configuration selects the most compute-intensive mode.
- **Summary:** K3 cannot turn reasoning off, so effort selection and output caps are its primary generation-cost levers.
- **Action:** Evaluate low/high/max by task, pin the lowest passing setting, set `max_completion_tokens`, and reserve escalation for failures or hard prompts.
- **Measure:** Reasoning/output usage, accuracy, latency, escalation rate, and cost per accepted answer.
- **Caveat:** Kimi effort values do not map to other providers' labels. K3's always-reasoning behavior differs from K2.6, whose thinking can be disabled.
- **Providers:** Kimi K3.
- **Source:** [Kimi K3 pricing and controls](https://platform.kimi.ai/docs/pricing/chat-k3.md), [Kimi Chat API](https://platform.kimi.ai/docs/api/chat)

### PS-KI-04 — Buy K2.7 Highspeed only when latency earns its 2× rate

- **ID:** `PS-KI-04`
- **Title:** Buy K2.7 Highspeed only when latency earns its 2× rate
- **Category:** Model variant / latency
- **Access recommendation:** Opt-in for user-facing latency-critical routes.
- **Evidence:** **Official observation:** K2.7 Code Standard is priced at $0.19 cached input, $0.95 uncached input, and $4 output per million tokens; the Highspeed variant is exactly double at $0.38/$1.90/$8. Kimi describes Highspeed as the same model with output around 180 tokens/second and up to 260 tokens/second on short outputs. **Derived recommendation:** use Standard for offline/background coding and Highspeed only where the latency improvement has measurable value.
- **Summary:** The high-speed premium changes serving speed, not the advertised model intelligence.
- **Action:** A/B both variants on the same coding workload, route interactive requests selectively, and fall back to Standard for long outputs or background jobs.
- **Measure:** Time to first token, output tokens/second, user abandonment/SLO value, token cost, and quality parity.
- **Caveat:** Peak speed is workload/output-length dependent. K2.7 Highspeed is not currently Batch-eligible, so the effective gap can be larger for delayed work.
- **Providers:** Kimi K2.7 Code and K2.7 Code Highspeed.
- **Source:** [Kimi K2.7 Code pricing](https://platform.kimi.ai/docs/pricing/chat-k27-code.md), [Kimi Batch pricing](https://platform.kimi.ai/docs/pricing/batch.md)

### PS-KI-05 — Bound stateless history and tool-result growth

- **ID:** `PS-KI-05`
- **Title:** Bound stateless history and tool-result growth
- **Category:** Context management / tools
- **Access recommendation:** Default-on history budget and tool-result limits.
- **Evidence:** **Official observation:** The Kimi API is stateless, so the caller resends conversation history; the official multi-turn guide recommends filtering or summarizing older messages and gives retaining the latest 20 messages as an example. The Chat API rejects a request when input plus `max_completion_tokens` exceeds context. Web-search results become prompt input and can be large; official tools are described as temporarily free but may be rate limited and may later charge. **Derived recommendation:** budget history, retrieval/tool results, and maximum completion together before dispatch.
- **Summary:** Free or automatically available tool calls can still expand paid prompt tokens and force context errors.
- **Action:** Summarize old turns, preserve only task-relevant tool results, cap web-search depth/results, preflight input plus output allowance, and use structured output to reduce retries where applicable.
- **Measure:** History/tool tokens per turn, context-rejection rate, summaries created, tool calls and result size, output truncation, and total cost/task.
- **Caveat:** “Latest 20” is an example, not a universal quality-safe limit. Temporarily free tool invocation is not a durable price guarantee, and returned content still consumes model tokens.
- **Providers:** Kimi API.
- **Source:** [Kimi multi-turn conversations](https://platform.kimi.ai/docs/guide/engage-in-multi-turn-conversations-using-kimi-api), [Kimi web search](https://platform.kimi.ai/docs/guide/use-web-search), [Kimi official tools](https://platform.kimi.ai/docs/guide/use-official-tools), [Kimi Chat API](https://platform.kimi.ai/docs/api/chat)

## Qwen / Alibaba Cloud Model Studio

### PS-QW-01 — Choose explicit or implicit context caching; do not blend their economics

- **ID:** `PS-QW-01`
- **Title:** Choose explicit or implicit context caching; do not blend their economics
- **Category:** Prompt caching
- **Access recommendation:** Default to implicit; offer explicit for predictable repeated prefixes.
- **Evidence:** **Official observation:** Model Studio's implicit cache is automatic and cannot be disabled; it generally requires at least 256 repeated tokens, charges 1× input to create and 0.2× to read, and has an indeterminate TTL. Explicit caching requires at least 1,024 tokens, charges 1.25× to create and 0.1× to read, and has a five-minute TTL that resets on a hit. The two modes are mutually exclusive for a request. **Derived recommendation:** use implicit for opportunistic reuse and explicit for large prefixes with sufficient near-term reads to repay its higher write price.
- **Summary:** Qwen exposes two distinct caching products with different floors, hit prices, and lifetime guarantees.
- **Action:** Estimate repeated-prefix size and reuse interval, select one mode, wait for an explicit-cache write to complete, and track create/read tokens separately.
- **Measure:** Writes, reads, tokens/write, time to reuse, implicit versus explicit hit rate, and total input cost.
- **Caveat:** An explicit entry is available only after the response completes, so immediate concurrent fan-out can miss it. The five-minute TTL belongs to explicit caching only; implicit lifetime is not guaranteed.
- **Providers:** Alibaba Cloud Model Studio models that support context caching.
- **Source:** [Model Studio context cache](https://www.alibabacloud.com/help/en/model-studio/context-cache)

### PS-QW-02 — Respect explicit cache marker and serialization limits

- **ID:** `PS-QW-02`
- **Title:** Respect explicit cache marker and serialization limits
- **Category:** Prompt-cache structure
- **Access recommendation:** Advanced linter and serializer lock.
- **Evidence:** **Official observation:** Model Studio permits four effective explicit cache markers and searches backward through up to 20 content blocks; if more markers are supplied, only the last four are effective. Tool definitions are serialized into the system context and cannot be marked independently, so tool order, JSON field order, and structure must remain stable for a match. **Derived recommendation:** centralize deterministic serialization and place markers only after large reusable blocks.
- **Summary:** Semantically identical but differently serialized tool schemas can destroy a cache hit.
- **Action:** Sort or otherwise deterministically preserve the same tool schema representation, freeze tool order, count markers and blocks, and move volatile message content after the final reusable boundary.
- **Measure:** Cache-hit rate by serialized prefix hash, marker count, lookback depth, schema/order changes, and wasted create tokens.
- **Caveat:** Similar numeric limits exist in Anthropic documentation, but the provider APIs, cache modes, and prices are not interchangeable. Canonicalization must not change tool semantics.
- **Providers:** Alibaba Cloud Model Studio explicit context caching.
- **Source:** [Model Studio context cache](https://www.alibabacloud.com/help/en/model-studio/context-cache)

### PS-QW-03 — Never stack cache and Batch discounts in the forecast

- **ID:** `PS-QW-03`
- **Title:** Never stack cache and Batch discounts in the forecast
- **Category:** Batch processing / discount interaction
- **Access recommendation:** Hard pricing-rule validation.
- **Evidence:** **Official observation:** Model Studio documents that context-cache and Batch discounts cannot apply simultaneously. Supported Batch File processing is generally 50% of real-time, but support and rates vary by model and region; for Qwen3.7-Flash in China, Batch File is half-rate while Batch Chat is listed at the same price as real-time. **Derived recommendation:** select one eligible discount path per request and price the exact batch product rather than applying `cache × batch` multipliers.
- **Summary:** Qwen explicitly rejects a discount combination that some other providers permit.
- **Action:** Resolve endpoint, region, and model; choose real-time cached, Batch File, or Batch Chat; then load the exact table row without multiplying discounts.
- **Measure:** Forecast errors from attempted stacking, tokens by processing product, realized discount, and unsupported batch selections.
- **Caveat:** “Batch” is not one price: Batch File and Batch Chat can differ. A 50% rule from OpenAI, Anthropic, Gemini, or Mistral is not portable.
- **Providers:** Alibaba Cloud Model Studio / Qwen.
- **Source:** [Model Studio context cache](https://www.alibabacloud.com/help/en/model-studio/context-cache), [Qwen3.7-Flash](https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash), [Model Studio pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)

### PS-QW-04 — Stay below Qwen's total-input price tiers when context has low marginal value

- **ID:** `PS-QW-04`
- **Title:** Stay below Qwen's total-input price tiers when context has low marginal value
- **Category:** Long-context pricing
- **Access recommendation:** Default-on model-specific threshold guard.
- **Evidence:** **Official observation:** Qwen3.7-Flash has price tiers at up to 32K, above 32K through 256K, and above 256K through 1M total input; Qwen3.7-Plus has a boundary at 256K. The selected tier prices the request's total input/output categories, not only the excess. **Derived recommendation:** remove low-value history/retrieval before crossing 32K or 256K and compare a different model when long input is intrinsic.
- **Summary:** Qwen can have two cost cliffs far below or above the 200K boundaries used by other providers.
- **Action:** Count total input preflight, resolve the exact model/deployment tier table, summarize or retrieve selectively, and show threshold headroom.
- **Measure:** Requests by tier, boundary crossings, tokens removed, output cost change, and evaluation quality.
- **Caveat:** Thresholds and prices vary by model and deployment location. “One-million-token context” describes capacity, not a flat price.
- **Providers:** Qwen3.7 Flash/Plus and other tier-priced Model Studio models.
- **Source:** [Qwen3.7-Flash](https://www.alibabacloud.com/help/en/model-studio/qwen3-7-flash), [Qwen3.7-Plus](https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus)

### PS-QW-05 — Disable or cap Qwen thinking and avoid rebilling historical thoughts

- **ID:** `PS-QW-05`
- **Title:** Disable or cap Qwen thinking and avoid rebilling historical thoughts
- **Category:** Reasoning/output control
- **Access recommendation:** Default-on output-budget control; thinking changes require evaluation.
- **Evidence:** **Official observation:** Qwen3.7/3.6/3.5 models enable thinking by default. Qwen3.7-Plus allows `enable_thinking` and `thinking_budget`; its default thinking budget is the maximum chain-of-thought allowance, with model limits including 262,144 chain-of-thought tokens and 65,536 maximum output tokens. `preserve_thinking` defaults to false; if true, historical reasoning is added to later input and billed. **Derived recommendation:** disable thinking on simple tasks or set a validated budget, and retain the default of not replaying historical thoughts unless continuity requires it.
- **Summary:** An omitted thinking budget can authorize the model's maximum internal output, and preserved thought history becomes future paid input.
- **Action:** Set `enable_thinking` explicitly, cap `thinking_budget`, cap overall output, keep `preserve_thinking: false` by default, and evaluate quality before rollout.
- **Measure:** Reasoning tokens, visible output, historical thought input, latency, quality, and truncation.
- **Caveat:** Maximum allowances are not expected usage, but they determine worst-case exposure. Exact control support varies by model and API mode.
- **Providers:** Supported Qwen thinking models, especially Qwen3.7-Plus.
- **Source:** [Qwen3.7-Plus](https://www.alibabacloud.com/help/en/model-studio/qwen3-7-plus), [Model Studio deep thinking](https://www.alibabacloud.com/help/en/model-studio/deep-thinking)

### PS-QW-06 — Bind every optimization to region and deployment scope

- **ID:** `PS-QW-06`
- **Title:** Bind every optimization to region and deployment scope
- **Category:** Regional pricing / catalogue integrity
- **Access recommendation:** Mandatory region field and warning on cross-region price reuse.
- **Evidence:** **Official observation:** Model Studio documents model availability, prices, context limits, and Batch capabilities by deployment location, with materially different China and international-region tables and promotional/limited-time prices. **Derived recommendation:** key cost rules by region, endpoint, exact model ID, and effective date rather than by the human-readable Qwen family alone.
- **Summary:** A valid Beijing price or feature can be wrong for Singapore, Virginia, or another deployment.
- **Action:** Require region at quote time, store effective dates and currency/unit, retain the source table, and disable estimates when deployment scope is unknown.
- **Measure:** Unknown-region requests, region/model lookup misses, stale price entries, and forecast-to-invoice variance.
- **Caveat:** Family names and aliases do not establish feature parity. Promotional prices should not overwrite base list prices without validity metadata.
- **Providers:** Alibaba Cloud Model Studio / Qwen.
- **Source:** [Model Studio model pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing), [Qwen API via DashScope](https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-dashscope)

## Mistral

### PS-MI-01 — Align stable prefixes to Mistral's 64-token cache blocks

- **ID:** `PS-MI-01`
- **Title:** Align stable prefixes to Mistral's 64-token cache blocks
- **Category:** Prompt caching
- **Access recommendation:** Default-on exact-prefix guidance and cache telemetry.
- **Evidence:** **Official observation:** Mistral prompt caching requires an exact shared prefix and supports `prompt_cache_key` for routing. Cache reads cost 0.1× input, cache usage is reported as `usage.prompt_tokens_details.cached_tokens`, and cached tokens occur in 64-token blocks; prompts below 64 tokens cannot hit. Mistral does not publish a deterministic TTL in the guide. **Derived recommendation:** stabilize a prefix longer than one block and calculate the bill as cached and uncached input components.
- **Summary:** Mistral's reported cached-token count is block-quantized and its key is not a durable cache object.
- **Action:** Put stable content first, preserve tool/message serialization, use a non-secret stable key, and compute uncached prompt tokens as total prompt minus cached tokens.
- **Measure:** Cached blocks/tokens, hit rate, uncached tokens, inter-request delay, and realized input savings.
- **Caveat:** No published TTL means a guaranteed cache lifetime must not be shown. The key must not contain secrets and does not override exact-prefix matching.
- **Providers:** Mistral API models supporting prompt caching.
- **Source:** [Mistral prompt caching](https://docs.mistral.ai/studio/conversations/advanced/prompt-caching)

### PS-MI-02 — Batch up to the product limits for a 50% token discount

- **ID:** `PS-MI-02`
- **Title:** Batch up to the product limits for a 50% token discount
- **Category:** Batch processing
- **Access recommendation:** Recommend for asynchronous, retry-safe work.
- **Evidence:** **Official observation:** Mistral Batch offers a 50% discount, accepts up to 1,000,000 requests in an uploaded batch file, and limits inline batches to fewer than 10,000 requests. A batch uses one model. **Derived recommendation:** group delayed homogeneous work by model into Batch while keeping smaller experimental submissions inline.
- **Summary:** Batch can halve model token cost and support very large jobs, but forces asynchronous, single-model grouping.
- **Action:** Partition requests by exact model and deadline, choose inline versus file upload from row count, attach stable row IDs, and reconcile failures separately.
- **Measure:** Batched-token share, realized discount, batch size, completion time, failures, and retry cost.
- **Caveat:** The official pages do not state that prompt-cache and Batch discounts stack; do not multiply them without invoice evidence. Per-tool charges may remain separate.
- **Providers:** Mistral Batch-supported models.
- **Source:** [Mistral Batch processing](https://docs.mistral.ai/studio/batch-processing)

### PS-MI-03 — Apply the 10% regional-inference multiplier to every token component

- **ID:** `PS-MI-03`
- **Title:** Apply the 10% regional-inference multiplier to every token component
- **Category:** Data residency / regional processing
- **Access recommendation:** Conditional warning and compliance-aware quote.
- **Evidence:** **Official observation:** Mistral regional inference in EU or US costs 1.1× Global pricing, and the multiplier applies to input, output, cache reads, and cache writes. Global processing does not commit to a specific inference location. **Derived recommendation:** use Global for price-sensitive workloads without residency requirements and include the premium across all token categories when regional processing is required.
- **Summary:** Regional selection is a compliance-cost tradeoff, not merely an input-token surcharge.
- **Action:** Ask for residency requirements, set the regional flag deliberately, and multiply each applicable token component rather than only the final uncached input line.
- **Measure:** Regional-token share, 10% premium, cache read/write contribution, compliance requirement, and routing mistakes.
- **Caveat:** Do not recommend Global when policy requires a region. The Mistral multiplier is not the same scope or eligibility rule as OpenAI regional processing.
- **Providers:** Mistral regional inference.
- **Source:** [Mistral regional inference](https://docs.mistral.ai/inference/regional-inference)

### PS-MI-04 — Route routine work to Small 4 before Medium 3.5

- **ID:** `PS-MI-04`
- **Title:** Route routine work to Small 4 before Medium 3.5
- **Category:** Model routing
- **Access recommendation:** Default candidate with task-level evaluation gates.
- **Evidence:** **Official observation:** Current list pricing shows Mistral Small 4 at $0.15 input/$0.60 output per million tokens, Medium 3.5 at $1.50/$7.50, and Large 3 at $0.50/$1.50. **Derived recommendation:** benchmark Small 4 first for routine tasks and choose the higher-priced model only when its evaluated quality or capability is worth the delta.
- **Summary:** Family-size labels do not sort monotonically by current price; Medium 3.5 costs more per token than Large 3.
- **Action:** Maintain capability/quality gates, route eligible volume to Small 4, escalate selectively, and fetch exact model IDs and live prices rather than inferring from names.
- **Measure:** Pass/escalation rate, task quality, input/output mix, latency, and blended cost.
- **Caveat:** Lower cost does not imply feature or quality parity. The surprising Medium-versus-Large price order is precisely why name-based estimates are unsafe.
- **Providers:** Mistral Small 4, Medium 3.5, and Large 3.
- **Source:** [Mistral API pricing](https://mistral.ai/pricing/api/)

### PS-MI-05 — Treat Mistral tool and library fees as first-class cost lines

- **ID:** `PS-MI-05`
- **Title:** Treat Mistral tool and library fees as first-class cost lines
- **Category:** Tool, OCR, and retrieval fees
- **Access recommendation:** Default-on fee ledger and tool budget.
- **Evidence:** **Official observation:** Mistral's current price page lists Code Interpreter and Web Search at $30/1,000 calls, image generation at $100/1,000, premium news at $50/1,000, OCR at $3/1,000 pages, library indexing at $1/million tokens, library calls at $0.01/call, and Data Capture at $0.04/million tokens. Agent API pricing combines model-token cost with tool-call fees. **Derived recommendation:** forecast call/page/indexing charges separately and avoid iterative tool loops with low marginal value.
- **Summary:** Tool-assisted workflows can be dominated by per-call or per-page charges rather than generation tokens.
- **Action:** Log the exact tool/library operation, cap calls, deduplicate OCR/indexing, reuse indexed libraries, and measure result size plus downstream model tokens.
- **Measure:** Calls/pages/index tokens, repeat work avoided, model tokens, and all-in cost per successful task.
- **Caveat:** The billing unit differs by product: calls, pages, indexed tokens, captured tokens, and model tokens cannot share one generic “tool use” counter.
- **Providers:** Mistral Agents, tools, and libraries.
- **Source:** [Mistral API pricing](https://mistral.ai/pricing/api/)

### PS-MI-06 — Keep enterprise API uplift out of public-list-price estimates

- **ID:** `PS-MI-06`
- **Title:** Keep enterprise API uplift out of public-list-price estimates
- **Category:** Contract/deployment pricing
- **Access recommendation:** Conditional contract-price override with warning.
- **Evidence:** **Official observation:** Mistral's public pricing page states a 75% premium over list pricing for selected Enterprise APIs. **Derived recommendation:** require an account/contract price source before presenting public list prices as an enterprise customer's expected bill.
- **Summary:** Contract tier can outweigh gains from cache or model routing.
- **Action:** Store price-book scope, account tier, and effective dates; apply any enterprise uplift before calculating savings; label public-list estimates when contract data is absent.
- **Measure:** List-to-invoice variance, requests priced with unknown contract scope, and savings after contract multipliers.
- **Caveat:** “Selected” means the uplift may not apply to every API. Do not assume either 1× or 1.75× without the applicable product/contract evidence.
- **Providers:** Mistral selected Enterprise APIs.
- **Source:** [Mistral API pricing](https://mistral.ai/pricing/api/)

## Cohere

### PS-CO-01 — Use billed units, not raw tokenizer counts, for cost attribution

- **ID:** `PS-CO-01`
- **Title:** Use billed units, not raw tokenizer counts, for cost attribution
- **Category:** Usage accounting
- **Access recommendation:** Mandatory Cohere-specific usage parser.
- **Evidence:** **Official observation:** Cohere responses distinguish generic token counts from `billed_units.input_tokens` and `billed_units.output_tokens`; provider-added tokens such as special tokens are not necessarily billed. The official pricing guide directs customers to billed units for cost calculation. **Derived recommendation:** calculate spend from billed units and retain raw counts only for context/efficiency diagnostics.
- **Summary:** A provider-agnostic `input_tokens × rate` calculation can overstate Cohere cost.
- **Action:** Parse the billed-unit fields, join them to exact model rates, and store raw tokens alongside billed units without substituting one for the other.
- **Measure:** Raw-minus-billed token delta, forecast-to-invoice variance, missing billed-unit events, and cost per task.
- **Caveat:** This does not imply a prompt-cache discount. Cohere does not label the difference as cache hits, and it should not be mapped to another provider's `cached_tokens`.
- **Providers:** Cohere.
- **Source:** [Cohere pricing guide](https://docs.cohere.com/docs/how-does-cohere-pricing-work)

### PS-CO-02 — Route routine work to Command R7B when its limits fit

- **ID:** `PS-CO-02`
- **Title:** Route routine work to Command R7B when its limits fit
- **Category:** Model routing
- **Access recommendation:** Default low-cost candidate with capability and quality gates.
- **Evidence:** **Official observation:** Command R7B is priced at $0.0375 input and $0.15 output per million tokens with a 128K context and 4K maximum output. Command A is listed at $2.50/$10 with 256K context and 8K maximum output. The per-token ratio is about 66.7× in both directions. **Derived recommendation:** evaluate R7B for routine retrieval, classification, extraction, and short-answer workloads, escalating when its quality or limits are insufficient.
- **Summary:** Model routing is Cohere's most explicit documented generation-price lever.
- **Action:** Check context/output requirements, run task evaluations, route eligible calls to R7B, and escalate low-confidence or capability-dependent cases.
- **Measure:** R7B pass rate, escalations, quality delta, latency, output truncation, and blended cost.
- **Caveat:** The models have different capability and length envelopes. The price ratio alone is not a quality claim.
- **Providers:** Cohere Command R7B and Command A.
- **Source:** [Cohere Command R7B](https://docs.cohere.com/v2/docs/command-r7b), [Cohere Command A](https://docs.cohere.com/docs/command-a)

### PS-CO-03 — Treat trial access and monthly call caps as quotas, not production pricing

- **ID:** `PS-CO-03`
- **Title:** Treat trial access and monthly call caps as quotas, not production pricing
- **Category:** Access tier / rate limits
- **Access recommendation:** Warning-only for production forecasts.
- **Evidence:** **Official observation:** Cohere trial API keys are free but rate-limited. The current limits page also lists monthly API-call caps for trial and production keys on newer model variants and per-minute limits—for example, newer Command A variants show 20 requests/minute and production access may require contacting Sales. **Derived recommendation:** use trial access for evaluation, but model production cost and capacity from the applicable key/account terms rather than assuming zero cost or unlimited throughput.
- **Summary:** “Free” describes a constrained evaluation key, not a durable unit price for production volume.
- **Action:** Detect key tier, track per-minute and monthly calls, block production forecasts that rely on trial quotas, and obtain contract pricing/capacity where required.
- **Measure:** Calls versus monthly cap, throttles, trial-to-production migration, unknown-price volume, and capacity shortfalls.
- **Caveat:** Rate limits and monetary prices are different controls. A model can have a public token price and separate access caps, or contract-only production terms.
- **Providers:** Cohere.
- **Source:** [Cohere rate limits](https://docs.cohere.com/docs/rate-limits), [Cohere pricing guide](https://docs.cohere.com/docs/how-does-cohere-pricing-work)

### PS-CO-04 — Quarantine conflicting model IDs and prices instead of auto-correcting them

- **ID:** `PS-CO-04`
- **Title:** Quarantine conflicting model IDs and prices instead of auto-correcting them
- **Category:** Catalogue integrity
- **Access recommendation:** Hard data-quality warning and manual review.
- **Evidence:** **Official observation:** On the research date, Cohere's Command A page prints $2.50 input/$10 output but its model-ID snippet names `command-a-plus-05-2026`, while Cohere's model catalogue identifies Command A as `command-a-03-2025`; the separate Command A+ material does not provide the same simple public-token-price statement. **Derived recommendation:** retain the conflict as source metadata and do not silently attach the printed Command A rate to an A+ model ID.
- **Summary:** Even official documentation can contain internally conflicting identifiers, so scraping by page text alone is unsafe.
- **Action:** Cross-check title, exact model ID, release page, and model catalogue; quarantine conflicts; require a reviewed override before quoting cost.
- **Measure:** Conflicting records, manual-review latency, estimates blocked, and post-review corrections.
- **Caveat:** This is an observed documentation inconsistency, not evidence that one of the models shares the other's price. The pages may be corrected after the research date.
- **Providers:** Cohere Command A / Command A+.
- **Source:** [Cohere Command A](https://docs.cohere.com/docs/command-a), [Cohere model catalogue](https://docs.cohere.com/v1/docs/models)

### PS-CO-05 — Preflight context and output ceilings to prevent paid retries

- **ID:** `PS-CO-05`
- **Title:** Preflight context and output ceilings to prevent paid retries
- **Category:** Context/output control
- **Access recommendation:** Default-on hard limit validation.
- **Evidence:** **Official observation:** Cohere's current model pages specify materially different limits: Command A provides a 256K context and 8K maximum output, while Command R7B provides a 128K context and 4K maximum output. **Derived recommendation:** validate input and requested output against the routed model before submission and compact or choose a different model rather than incur a failed/truncated attempt and retry.
- **Summary:** Cost optimization includes avoiding requests that cannot fit the selected low-cost model.
- **Action:** Count input, reserve the requested output budget, warn near limits, summarize/retrieve where appropriate, and escalate models only when the task genuinely needs the larger envelope.
- **Measure:** Preflight blocks, context errors, output truncations, retries avoided, and escalation cost.
- **Caveat:** Context capacity is not a pricing tier on these pages, and no long-context premium is documented for these models. Do not import another provider's boundary pricing.
- **Providers:** Cohere Command A and Command R7B.
- **Source:** [Cohere Command A](https://docs.cohere.com/docs/command-a), [Cohere Command R7B](https://docs.cohere.com/v2/docs/command-r7b)

### PS-CO-06 — Do not invent cache, batch, off-peak, or generative tool-call discounts

- **ID:** `PS-CO-06`
- **Title:** Do not invent cache, batch, off-peak, or generative tool-call discounts
- **Category:** Unsupported-equivalence guard
- **Access recommendation:** Warning-only; show “not publicly documented” rather than zero or unsupported.
- **Evidence:** **Official observation:** The reviewed Cohere generation pricing and model documentation publishes model token rates and billed units but does not publish a prompt-cache hit/write tariff, discounted batch-generation tariff, off-peak schedule, or generic per-tool-call price analogous to the other providers in this report. Cohere does separately price products such as Rerank by searches and Embed by token usage. **Derived recommendation:** expose only documented levers and keep retrieval/product charges separate from Command generation.
- **Summary:** Absence of a published discount is not a license to copy a competitor's multiplier or to assume the feature is free.
- **Action:** Set those catalogue fields to unknown/not documented, request contract data when relevant, and price Rerank/Embed from their own units if a workflow uses them.
- **Measure:** Estimates containing assumed discounts, unknown-price volume, separately metered Rerank/Embed usage, and invoice variance.
- **Caveat:** This is a documentation-state observation as of 2026-08-15, not proof that private contracts or future releases cannot provide such mechanisms.
- **Providers:** Cohere.
- **Source:** [Cohere pricing guide](https://docs.cohere.com/docs/how-does-cohere-pricing-work), [Cohere model catalogue](https://docs.cohere.com/v1/docs/models)

## Cross-provider false equivalences

| Concept | Tempting but false equivalence | Provider-specific reality |
|---|---|---|
| Cache key | “A cache key names a stored response/prefix.” | OpenAI, xAI, Mistral, and Kimi use keys primarily for routing/affinity; exact content still matters. Gemini explicit caching creates a named billable resource. Anthropic and Qwen expose block breakpoints. DeepSeek is automatic with no cache ID. |
| Cache minimum | “Caching starts at 1,024 tokens.” | OpenAI GPT-5.6: 1,024; Anthropic: 512–4,096 by model; Gemini: 2,048 or 4,096 in the current table; DeepSeek and Mistral: 64-token units/floors; Kimi: prior prompt over 256; Qwen: generally 256 implicit/1,024 explicit; xAI publishes no minimum in the cited guide. |
| TTL | “Provider caches last about five minutes.” | Anthropic and Qwen explicit default/operate at 5m; OpenAI GPT-5.6 offers 30m explicit retention; Gemini explicit defaults to 1h but allows custom TTL and charges storage; DeepSeek says typically hours-to-days without guarantee; xAI/Mistral/Kimi do not publish an equivalent deterministic TTL here. |
| Cache write price | “Write price is an added surcharge.” | Anthropic 1.25×/2× and OpenAI GPT-5.6 1.25× describe the written-token price. Qwen explicit uses 1.25× while implicit uses ordinary input. DeepSeek storage is free. Gemini adds storage token-hours. |
| Batch | “Batch is always half price and composes with cache.” | OpenAI/Anthropic/Mistral advertise 50%; Gemini needs per-component cells; Kimi charges 40% of Standard; xAI discounts only listed models by 20%; Qwen varies by Batch product and prohibits cache-discount stacking; DeepSeek/Cohere do not publish a corresponding current discount in the cited pages. |
| Long context | “200K is the universal premium boundary.” | OpenAI GPT-5.6: above 272K; Gemini Pro: above 200K; xAI: at least 200K and cached tokens count; Qwen3.7 Flash: 32K and 256K tiers; other reviewed model pages do not necessarily publish a long-context surcharge. |
| Reasoning level | “Low/high/max mean the same amount of work.” | Each provider defines different values, defaults, aliases, and model coverage. DeepSeek V4 defaults high and aliases medium/xhigh; Kimi K3 defaults max and cannot disable reasoning; Gemini support varies by model; Anthropic effort changes can invalidate cache; Qwen can preserve and rebill historical thinking. |
| Tool call | “One prompt with search equals one billable search.” | Gemini 3.x can emit multiple billable search queries per prompt; Gemini 2.5 bills grounded prompts; OpenAI, Anthropic, xAI, and Mistral publish different per-call rates and token treatment. Runtime, storage, embedding, page, and returned-token fees can be additional. |
| Region | “The same public rate applies everywhere.” | Mistral regional inference is 1.1× Global; OpenAI eligible regional processing can add 10%; Qwen prices/features are deployment-region specific; other providers may expose different platform or contract scopes. |
| Usage tokens | “Every provider's `input_tokens` is the invoice quantity.” | Cohere exposes `billed_units`; OpenAI/xAI/Mistral expose cached-token subfields; Gemini separates thoughts and cached content; DeepSeek exposes cache hit/miss tokens. Cost accounting needs provider-specific parsers. |

## Implementation implications for a cost-control catalogue

1. Key every rule by **provider + exact model ID + endpoint/API mode + region + service tier + effective date**.
2. Represent price components independently: uncached input, cache write, cache read, visible output, reasoning/thought output, storage, tool call, tool-result tokens, runtime, pages, embeddings, and regional/contract multipliers.
3. Encode comparison operators literally for context boundaries (`> 272000`, `> 200000`, `>= 200000`) and apply the resulting tier to the provider-defined full request.
4. Store published absence as `not_documented`, not `0`, `false`, or a competitor-derived default.
5. Tie every recommendation to measurement of quality, latency, errors/retries, and **all-in cost per successful task**, not token savings alone.
