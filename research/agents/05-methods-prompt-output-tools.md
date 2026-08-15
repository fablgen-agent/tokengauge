# Token/cost-saving methods: prompts, outputs, tools, multimodal inputs, and retries

Research snapshot: **2026-08-15 UTC**. This pass covers request-shaping techniques rather than model pricing or model routing. Sources are limited to official provider documentation and original research papers. Every URL in this document returned HTTP 200 on the snapshot date.

## Reading the recommendations

- **Free first**: an application, prompt, or payload change that does not add another inference call or paid service beyond the request already being made. It can still consume engineering time and the underlying API request is still billable.
- **Paid/compute after eval**: requires an additional model, preprocessing service, provider feature with separate charges, or meaningful local compute. Adopt only when measured net savings exceed that overhead.
- **Paid/API feature after reuse analysis**: a cache, hosted-tool, or context-management feature whose write/storage/tool charges must be amortized over actual reuse. “After eval” is used when quality or per-call overhead, rather than reuse, is the main uncertainty.
- **Evidence — Official**: the provider explicitly documents the behavior or recommendation.
- **Evidence — Derived**: the action is an engineering deduction from documented token accounting or schema behavior; validate it on the workload.
- **Evidence — Experiment**: an original paper reports empirical results, but transfer to a different model/task is not guaranteed.

Use a fixed representative eval set for every test. Unless a method says otherwise, record task success, input/cached-input/output/reasoning tokens, tool calls, retries, latency, and total cost per successful task. A lower token count is not a win if success or required-field recall falls.

## A. Prompt and context design

### PD-01 — State each instruction once

- **Category:** Prompt design
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Repeated policies and style rules enlarge every request and can also cause repeated or over-cautious behavior.
- **Exact action:** Normalize the system/developer prompt into one canonical rule per behavior; delete paraphrased duplicates across system, developer, and user templates.
- **Measurement plan:** Diff the tokenized prompt, then A/B at least 100 representative tasks; compare input tokens, output tokens, approvals/clarifications, and pass rate.
- **Caveat:** OpenAI explicitly recommends leaner prompts for GPT-5.6; other providers may respond differently, so do not remove repetition that is empirically necessary for an older model.
- **Providers:** OpenAI; portable hypothesis for others.
- **Source:** [OpenAI — Model guidance, “Favor leaner prompts”](https://developers.openai.com/api/docs/guides/latest-model)

### PD-02 — Ablate examples that do not fix a measured failure

- **Category:** Prompt design
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Few-shot examples are recurring input cost; examples without a demonstrated quality contribution should not be permanent.
- **Exact action:** Remove one example group at a time, rerun the same eval, and retain only examples that encode a product requirement or repair a measured gap.
- **Measurement plan:** Plot pass rate and input tokens against example count; select the smallest count inside the predeclared quality tolerance.
- **Caveat:** Gemini documentation broadly recommends few-shot examples, while OpenAI recommends removing unnecessary examples. Treat example count as provider- and task-specific, not a universal zero-shot rule.
- **Providers:** OpenAI, Gemini API.
- **Sources:** [OpenAI — Model guidance](https://developers.openai.com/api/docs/guides/latest-model); [Google — Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)

### PD-03 — Demonstrate concise answers, not just request them

- **Category:** Prompt design / output control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A short example can teach the desired answer length and format more reliably than vague “be concise” prose.
- **Exact action:** Add one minimal input/output example whose answer contains only required fields or sentences; remove longer style prose if the example replaces it successfully.
- **Measurement plan:** Compare median output tokens, truncation rate, and required-content recall for instruction-only versus one concise example.
- **Caveat:** The example itself costs input tokens on every uncached request; it is useful only when the output or retry reduction is larger.
- **Providers:** Gemini API; portable to other instruction-following models.
- **Source:** [Google — Prompt design strategies, concise-response examples](https://ai.google.dev/gemini-api/docs/prompting-strategies)

### PD-04 — Put the reusable prefix first and variables last

- **Category:** Prompt design / caching
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Prefix caches require matching beginnings; timestamps, user IDs, and request-specific text near the front destroy reuse.
- **Exact action:** Order the request as stable tool definitions → stable system instructions/examples → reusable documents → current user/request data. Remove timestamps and random IDs from the reusable prefix.
- **Measurement plan:** Track cache-read tokens and cache-hit request rate before and after reordering, plus total billed input cost.
- **Caveat:** OpenAI requires exact prefix matches; Gemini recommends large common content first for implicit caching; Anthropic uses explicit/automatic breakpoints and a `tools → system → messages` hierarchy.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching); [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching)

### PD-05 — Preflight the complete request with the provider counter

- **Category:** Prompt design / budget enforcement
- **Recommendation:** **Free first** when the counting endpoint is free; otherwise include its request cost in the decision.
- **Evidence:** **Official**
- **Summary:** Tools, images, documents, and hidden tool-enablement prompts can make naive text-only estimates materially wrong.
- **Exact action:** Count the exact request object after tools and media are attached; reject, trim, or compact requests above a workload-specific input budget before generation.
- **Measurement plan:** Record predicted versus actual input tokens, prevented over-budget calls, context-limit failures, and counter-call overhead.
- **Caveat:** Anthropic says counts are estimates and may differ slightly; field names and support for tools/media differ across providers.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Counting tokens](https://developers.openai.com/api/docs/guides/token-counting); [Anthropic — Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting); [Google — Understand and count tokens](https://ai.google.dev/gemini-api/docs/tokens)

### PD-06 — Compress long prompts with LLMLingua

- **Category:** Prompt compression
- **Recommendation:** **Paid/compute after eval**
- **Evidence:** **Experiment**
- **Summary:** LLMLingua uses a smaller language model, a budget controller, and coarse-to-fine token pruning to shorten prompts before the target LLM sees them.
- **Exact action:** Run the open-source compressor on long instructions/context with a declared compression ratio; preserve the task instruction and validate the compressed text before sending it to the paid model.
- **Measurement plan:** Sweep compression ratios; measure compressor cost/latency, target input tokens, end-to-end cost, exact-answer quality, and failure by document type.
- **Caveat:** The paper reports up to 20× compression with little loss on its tested tasks; code, identifiers, negation, and exact quotations can be damaged.
- **Providers:** Provider-agnostic preprocessing.
- **Source:** [Jiang et al. — LLMLingua](https://arxiv.org/abs/2310.05736)

### PD-07 — Use question-aware LongLLMLingua for retrieved context

- **Category:** Prompt compression / retrieval context
- **Recommendation:** **Paid/compute after eval**
- **Evidence:** **Experiment**
- **Summary:** LongLLMLingua ranks and compresses long context relative to the question, addressing both token cost and lost-in-the-middle effects.
- **Exact action:** Apply question-aware document/chunk ranking, reorder high-value context, then compress within a fixed target-token budget before the answer call.
- **Measurement plan:** Compare against uncompressed and simple top-k retrieval on answer quality, evidence recall, target input tokens, preprocessing latency, and total cost.
- **Caveat:** Query-focused compression is unsafe when the task requires exhaustive review or facts not predictable from the initial question.
- **Providers:** Provider-agnostic preprocessing.
- **Source:** [Jiang et al. — LongLLMLingua](https://arxiv.org/abs/2310.06839)

### PD-08 — Use LLMLingua-2 for task-agnostic extractive compression

- **Category:** Prompt compression
- **Recommendation:** **Paid/compute after eval**
- **Evidence:** **Experiment**
- **Summary:** LLMLingua-2 frames compression as bidirectional token classification trained from distilled data, aiming for faithful, fast extraction.
- **Exact action:** Compress large prose inputs with a compatible LLMLingua-2 encoder at 2×–5× targets; keep an uncompressed fallback for low-confidence or syntax-sensitive inputs.
- **Measurement plan:** Measure compressor throughput, end-to-end latency, target tokens, factual preservation, and downstream success at each compression ratio.
- **Caveat:** The paper reports 3×–6× faster compression than earlier methods and 1.6×–2.9× end-to-end speedups on tested settings; those numbers are not provider guarantees.
- **Providers:** Provider-agnostic preprocessing.
- **Source:** [Pan et al. — LLMLingua-2](https://arxiv.org/abs/2403.12968)

### PD-09 — Filter low-information text with Selective Context

- **Category:** Prompt compression
- **Recommendation:** **Paid/compute after eval**
- **Evidence:** **Experiment**
- **Summary:** Selective Context drops lexical units with low self-information to fit more useful content into a fixed context.
- **Exact action:** Score units with the paper’s self-information method, remove the lowest-information units to a target budget, and protect named entities, numbers, negation, and required evidence spans.
- **Measurement plan:** Sweep retained-token percentage and evaluate summarization/QA quality, evidence loss, total cost, and preprocessing time.
- **Caveat:** Low-surprisal text can still carry legal, safety, or logical meaning; use only where lossy compression is acceptable.
- **Providers:** Provider-agnostic preprocessing.
- **Source:** [Li — Selective Context](https://arxiv.org/abs/2304.12102)

### PD-10 — Compact old conversation state before it dominates the prompt

- **Category:** Conversation context
- **Recommendation:** **Paid/compute after eval** for provider compaction; **Free first** for deterministic deletion of known-dead state.
- **Evidence:** **Official**
- **Summary:** A concise summary of old turns can replace a growing transcript and reduce repeated input on every subsequent turn.
- **Exact action:** Trigger compaction at a measured token threshold; preserve goals, decisions, unresolved items, identifiers, and citations, then replace only the covered history.
- **Measurement plan:** Compare cumulative input tokens per conversation, summary-generation cost, long-horizon task success, and regressions caused by omitted facts.
- **Caveat:** Anthropic recommends server-side compaction; other providers expose different state/compaction mechanisms. Summarization is lossy and may break exact audit trails.
- **Providers:** Anthropic explicitly; client-side pattern elsewhere.
- **Source:** [Anthropic — Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)

## B. Output and reasoning control

### OC-01 — Set low response verbosity when the model exposes it

- **Category:** Output control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A request-level verbosity control is more consistent and shorter than repeating broad style prose.
- **Exact action:** Set OpenAI `text.verbosity: "low"`; keep only task-specific required-content instructions in the prompt.
- **Measurement plan:** Compare output tokens, required-field recall, user satisfaction, and follow-up rate across low versus current verbosity.
- **Caveat:** `text.verbosity` is OpenAI-specific and supported-model dependent; Anthropic and Gemini use different controls or prompting.
- **Providers:** OpenAI.
- **Source:** [OpenAI — Model guidance, response length and style](https://developers.openai.com/api/docs/guides/latest-model)

### OC-02 — Set a hard, task-sized output ceiling

- **Category:** Output control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A realistic maximum prevents runaway generations and bounds worst-case spend.
- **Exact action:** Set `max_output_tokens`/`max_tokens` from the 99th percentile of successful outputs plus a small safety margin, separately per task class.
- **Measurement plan:** Track output tokens, truncation/`max_tokens` stop reasons, retry rate, and cost; raise the cap only for task classes that truncate valid answers.
- **Caveat:** Parameter names and whether reasoning tokens share the cap vary by provider/model; a cap that is too low can cause a full paid retry.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Source:** [Google — Prompt design strategies, generation parameters](https://ai.google.dev/gemini-api/docs/prompting-strategies)

### OC-03 — Stop at a known delimiter

- **Category:** Output control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A stop sequence prevents trailing explanations or repeated sections after the useful payload is complete.
- **Exact action:** Choose a delimiter that cannot occur inside valid content, instruct the model to end with it, and configure the provider stop-sequence parameter.
- **Measurement plan:** Compare output tokens and incomplete-output rate; specifically test delimiter collisions and escaping.
- **Caveat:** Stop support differs by model, and Google warns to avoid sequences that may appear in generated content; structured outputs are safer for complex JSON.
- **Providers:** Gemini API and other models with stop-sequence support.
- **Source:** [Google — Prompt design strategies, `stop_sequences`](https://ai.google.dev/gemini-api/docs/prompting-strategies)

### OC-04 — Lower OpenAI reasoning effort for routine tasks

- **Category:** Reasoning control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Reasoning effort directly changes how much model work occurs; simple workloads often do not need high or max effort.
- **Exact action:** Preserve the current setting as baseline, then test one level lower (`medium→low`, `low→none`) per workload; reserve high/xhigh/max for measured quality gains.
- **Measurement plan:** Compare success, reasoning/output tokens, latency, and cost at adjacent effort levels on the same examples.
- **Caveat:** Available levels and defaults are model-specific. Lower effort can reduce tool-use reliability or hard-problem accuracy.
- **Providers:** OpenAI GPT-5.6 family and other supported reasoning models.
- **Source:** [OpenAI — Model guidance, reasoning effort](https://developers.openai.com/api/docs/guides/latest-model)

### OC-05 — Use low Claude effort for simple/high-volume work

- **Category:** Reasoning and tool-use control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Anthropic documents that lower effort produces fewer tokens and often fewer tool calls and shorter preambles.
- **Exact action:** Set `output_config.effort: "low"` for classification, lookup, and routine transformation workloads; use a higher tier only where evals justify it.
- **Measurement plan:** Measure output/thinking tokens, tool-call count, latency, pass rate, and cache-hit rate.
- **Caveat:** Claude defaults to high in the cited documentation, and changing effort within a cached conversation invalidates cache prefixes.
- **Providers:** Anthropic on supported Claude models.
- **Source:** [Anthropic — Effort](https://platform.claude.com/docs/en/build-with-claude/effort)

### OC-06 — Disable Gemini thinking when the model permits it

- **Category:** Reasoning control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** On supported Gemini models, `thinkingBudget: 0` removes thinking-token spend for tasks that do not benefit from reasoning.
- **Exact action:** Set `thinking_budget: 0` for a tested allowlist of simple task types and keep dynamic/default thinking for the remainder.
- **Measurement plan:** Compare `thoughts_token_count`, answer tokens, latency, cost, and quality by task type.
- **Caveat:** Gemini 2.5 Pro cannot disable thinking; ranges and controls differ across model generations and APIs.
- **Providers:** Gemini API on supported models.
- **Source:** [Google — Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking)

### OC-07 — Bound Gemini thinking instead of leaving it fully dynamic

- **Category:** Reasoning control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A finite thinking budget can retain some reasoning while bounding hidden output cost.
- **Exact action:** Set a small positive `thinking_budget` per task class, selected from quality/cost sweeps, rather than `-1` dynamic for every request.
- **Measurement plan:** Sweep supported budgets; chart quality against `thoughts_token_count`, total output-billed tokens, and latency.
- **Caveat:** A configured budget is a target/model control, not necessarily exact usage; model-specific minimums and disable behavior apply.
- **Providers:** Gemini API, especially Gemini 2.5 models with budget control.
- **Source:** [Google — Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking)

### OC-08 — Give long Claude agents an end-to-end task budget

- **Category:** Agent output/tool-loop control
- **Recommendation:** **Free first** as a request setting; underlying generated tokens remain billable.
- **Evidence:** **Official**
- **Summary:** Anthropic task budgets expose a running token countdown so an agent can prioritize and finish instead of expanding work indefinitely.
- **Exact action:** Set `output_config.task_budget.total` from measured per-task distributions and combine it with a hard per-request `max_tokens` ceiling.
- **Measurement plan:** Compare total tokens across the whole agent loop, completion rate, partial-result rate, tool calls, and cost per successful task.
- **Caveat:** The feature is beta, model-limited, and advisory rather than a hard cap; changing `remaining` between cached turns can invalidate cache prefixes.
- **Providers:** Anthropic on listed supported Claude models.
- **Source:** [Anthropic — Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets)

## C. Structured outputs

### SO-01 — Use native structured outputs instead of “return JSON” prompting

- **Category:** Structured outputs / retry avoidance
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Constrained decoding guarantees schema-conformant syntax on supported models, eliminating malformed-JSON retries and verbose formatting instructions.
- **Exact action:** Move the required response shape into the provider’s JSON-schema field and delete redundant format examples and “valid JSON only” prose.
- **Measurement plan:** Compare prompt tokens, output tokens, parse failures, schema retries, latency, and task-level semantic accuracy.
- **Caveat:** OpenAI, Anthropic, and Gemini support different JSON Schema subsets and model lists; syntactic validity does not guarantee semantically correct values.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs); [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs); [Google — Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

### SO-02 — Enable strict or validated function arguments

- **Category:** Tool schema / retry avoidance
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Schema-constrained function calls reduce malformed arguments that otherwise trigger another model turn.
- **Exact action:** Use OpenAI `strict: true`, Anthropic strict tool use, or Gemini `VALIDATED`/`ANY` as appropriate; validate the schema at startup.
- **Measurement plan:** Track invalid-call rate, tool-call retries, successful calls per task, tokens, and latency before/after strictness.
- **Caveat:** OpenAI strict schemas require every property to be required and `additionalProperties: false`; Gemini modes and schema subset differ; optional values may need nullable types.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Function calling, strict mode](https://developers.openai.com/api/docs/guides/function-calling); [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs); [Google — Function calling modes](https://ai.google.dev/gemini-api/docs/function-calling)

### SO-03 — Make the output schema no larger than the consumer contract

- **Category:** Structured outputs / schema design
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** Schema text consumes input tokens, and every generated field consumes output tokens; unused fields cost on both sides.
- **Exact action:** Delete properties not read downstream, shorten field descriptions without losing disambiguation, and split unrelated response shapes into task-specific schemas.
- **Measurement plan:** Count the request with each schema, compare output tokens and semantic error rate, and verify downstream code accesses no removed field.
- **Caveat:** Descriptions can be essential for correct semantics even when the JSON type is obvious; remove them only through ablation.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Counting tokens with tools](https://developers.openai.com/api/docs/guides/token-counting); [Google — Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

### SO-04 — Encode closed decisions as enums, booleans, or IDs

- **Category:** Structured outputs / output control
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** A scalar decision is cheaper and easier to validate than a prose explanation when the application needs only the decision.
- **Exact action:** Replace free-text classification fields with the smallest stable enum/boolean/ID set; request an explanation only on audited or low-confidence cases.
- **Measurement plan:** Compare output tokens, class accuracy, invalid values, and percentage of cases requiring an explanation follow-up.
- **Caveat:** Do not remove rationale when it is itself a product, audit, safety, or user requirement; enum labels must be unambiguous.
- **Providers:** Any provider with structured output or tool schemas.
- **Source:** [Google — Structured outputs, strong typing and enums](https://ai.google.dev/gemini-api/docs/structured-output)

### SO-05 — Bound array cardinality in both schema and prompt

- **Category:** Structured outputs / output control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** `maxItems` plus an explicit “top N” instruction caps list-shaped outputs more reliably than “keep it short.”
- **Exact action:** Set `maxItems: N` where the provider supports it and say exactly how to rank/select the N items; enforce the same limit client-side.
- **Measurement plan:** Track output tokens, item-count violations, top-N precision/recall, and truncation.
- **Caveat:** JSON Schema keyword support differs. Gemini explicitly documents `maxItems`; verify OpenAI/Anthropic support before sending the same schema cross-provider.
- **Providers:** Gemini API explicitly; provider-specific validation elsewhere.
- **Source:** [Google — Structured outputs, array properties](https://ai.google.dev/gemini-api/docs/structured-output)

### SO-06 — Return identifiers and hydrate records locally

- **Category:** Structured outputs / application design
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** If the application already owns the records, the model need not repeat names, descriptions, URLs, or metadata.
- **Exact action:** Give each candidate a compact stable ID, ask the model to return only selected IDs plus indispensable generated fields, then join full records in application code.
- **Measurement plan:** Compare input/output tokens, ID-selection accuracy, join failures, and end-to-end latency against full-record generation.
- **Caveat:** IDs must be stable and collision-free; opaque IDs can make reasoning harder, so retain short human-readable labels in input when needed.
- **Providers:** Provider-agnostic.
- **Source:** [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)

### SO-07 — Repair only semantically invalid fields

- **Category:** Structured outputs / retry handling
- **Recommendation:** **Free first** for local validation; **Paid/compute after eval** for the repair call.
- **Evidence:** **Derived**
- **Summary:** Native schemas remove syntax failures, but a bad value should not force regeneration of every valid field.
- **Exact action:** Validate business rules locally; on failure send the smallest failing field set, validation message, and required context to a repair schema, then merge only validated repairs.
- **Measurement plan:** Compare repair-call input/output tokens, final correctness, and cost against full-request retries on the same failures.
- **Caveat:** Field-local repair is unsafe when fields are tightly coupled; rerun the whole object when changing one value can invalidate others.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [Anthropic — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs); [Google — Structured outputs, semantic validation caveat](https://ai.google.dev/gemini-api/docs/structured-output)

## D. Tool and function schemas/results

### TL-01 — Expose only tools relevant to the current task

- **Category:** Tool schemas
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Every tool name, description, and schema enters context; irrelevant tools add recurring input cost and routing ambiguity.
- **Exact action:** Route the request to a minimal task-specific tool set before calling the model; keep a no-tools path for pure generation.
- **Measurement plan:** Count tool-schema tokens, wrong-tool calls, retries, and success as tools are removed one group at a time.
- **Caveat:** Changing the tools array can break prefix caches; for stable large sets, combine a fixed array with allowed-tool controls or deferred tool search.
- **Providers:** OpenAI; same accounting principle documented by Anthropic.
- **Sources:** [OpenAI — Model guidance](https://developers.openai.com/api/docs/guides/latest-model); [Anthropic — Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)

### TL-02 — Load large tool catalogs on demand

- **Category:** Tool schemas / context management
- **Recommendation:** **Paid/compute after eval** if tool search has a separate charge; otherwise **Free first** as a payload optimization.
- **Evidence:** **Official**
- **Summary:** Tool search replaces dozens of upfront schemas with one search tool and loads only selected definitions.
- **Exact action:** Mark non-core tools deferred and expose the provider’s tool-search mechanism; always load only the few universal tools.
- **Measurement plan:** Compare baseline input tokens, search calls, added latency, tool-selection accuracy, and total cost at catalog sizes of 10, 20, 50, and 100 tools.
- **Caveat:** Anthropic suggests the technique for large sets (roughly 20+); OpenAI’s API and supported models differ. One extra search turn can cost more for small catalogs.
- **Providers:** OpenAI, Anthropic.
- **Sources:** [OpenAI — Tool search](https://developers.openai.com/api/docs/guides/tools-tool-search); [Anthropic — Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)

### TL-03 — Cache stable tool definitions

- **Category:** Tool schemas / caching
- **Recommendation:** **Paid/API feature after reuse analysis**
- **Evidence:** **Official**
- **Summary:** Caching does not shrink tool schemas, but it can substantially discount their repeated input cost.
- **Exact action:** Keep tool order and definitions byte-stable, place a cache breakpoint on the last stable tool definition where required, and monitor cache reads.
- **Measurement plan:** Track cache-write/read tokens, cache-hit rate, amortized tool-schema cost, and invalidations per deployment.
- **Caveat:** Anthropic cache writes carry a markup and OpenAI cache rules/prices differ; one-off or frequently changing toolsets can cost more with explicit writes.
- **Providers:** OpenAI, Anthropic.
- **Sources:** [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching); [Anthropic — Tool use with prompt caching](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching)

### TL-04 — Keep the OpenAI tool array stable and vary `allowed_tools`

- **Category:** Tool routing / caching
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** An allowed subset changes what the model may call without rewriting the cached tool-definition prefix.
- **Exact action:** Send one stable ordered tool list, then set `tool_choice.type: "allowed_tools"` with only the names permitted for the current request.
- **Measurement plan:** Compare cache-hit tokens, wrong-tool calls, and input cost against dynamically rebuilding the tools array.
- **Caveat:** This is OpenAI-specific; do not assume the same cache semantics for Gemini or Anthropic modes.
- **Providers:** OpenAI.
- **Source:** [OpenAI — Function calling, allowed tools](https://developers.openai.com/api/docs/guides/function-calling)

### TL-05 — Make tool descriptions concise and operationally precise

- **Category:** Tool schemas
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Short descriptions save recurring context, but precision prevents expensive wrong calls and repair turns.
- **Exact action:** For each tool, retain purpose, when to use/not use, argument semantics, return shape, and error behavior; remove marketing prose, duplicated type text, and generic examples.
- **Measurement plan:** Count schema tokens and evaluate tool-choice accuracy, argument validity, call count, and retries after each description reduction.
- **Caveat:** Anthropic emphasizes detailed descriptions for reliable selection; “shortest” is not the objective. Keep detail that resolves overlap between tools.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Model guidance](https://developers.openai.com/api/docs/guides/latest-model); [Google — Function calling](https://ai.google.dev/gemini-api/docs/function-calling)

### TL-06 — Remove unused tool parameters and nesting

- **Category:** Tool schemas
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** Every optional property and nested object increases schema tokens and the space for invalid arguments.
- **Exact action:** Split broad tools into task-specific variants only when routing can hide unused variants; delete deprecated fields and replace repeated nested metadata with a compact ID.
- **Measurement plan:** Compare schema tokens, invalid-argument rate, tool success, and tool count before and after each schema simplification.
- **Caveat:** More separate tools can increase catalog size; optimize total visible schema, not individual schema length in isolation.
- **Providers:** Any function-calling provider.
- **Source:** [OpenAI — Counting tokens with tools](https://developers.openai.com/api/docs/guides/token-counting)

### TL-07 — Project and aggregate tool results before returning them to the model

- **Category:** Tool results
- **Recommendation:** **Free first** for deterministic local processing
- **Evidence:** **Derived**
- **Summary:** Raw API records, logs, and search responses often contain fields the model will never use, yet they are billed again as input.
- **Exact action:** Apply allowlisted field projection, deduplication, filtering, sorting, and aggregation in code; return a bounded JSON result plus counts/truncation metadata.
- **Measurement plan:** Compare tool-result input tokens, final-answer completeness, evidence recall, and latency against raw results.
- **Caveat:** Over-filtering can remove evidence needed for synthesis or citations; preserve native citations/artifacts when the final answer must reproduce them.
- **Providers:** Provider-agnostic.
- **Sources:** [OpenAI — Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling); [Anthropic — Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)

### TL-08 — Clear stale tool results from long conversations

- **Category:** Tool results / context editing
- **Recommendation:** **Paid/API feature after eval**
- **Evidence:** **Official**
- **Summary:** Old search results and file dumps become dead weight after the model has used them.
- **Exact action:** Enable Anthropic `clear_tool_uses_20250919` at a measured trigger, retain the most recent/critical results, and exclude tools whose outputs must remain verbatim.
- **Measurement plan:** Track `cleared_input_tokens`, cumulative input cost, cache invalidations, and long-horizon success.
- **Caveat:** Context editing is Anthropic beta and clearing can break later references; `clear_at_least` can prevent a small clear from needlessly breaking cache.
- **Providers:** Anthropic explicitly; manual pruning elsewhere.
- **Source:** [Anthropic — Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing)

### TL-09 — Collapse predictable tool chains into programmatic tool calling

- **Category:** Tool orchestration
- **Recommendation:** **Paid/compute after eval**
- **Evidence:** **Official**
- **Summary:** Code can call, join, filter, and reduce several tool results without placing every intermediate result and model roundtrip in conversation history.
- **Exact action:** Use PTC only for bounded deterministic stages; specify eligible tools, output schema, retry/stop limits, and the direct-call handoff.
- **Measurement plan:** Compare total tokens, calls, turns, retries, latency, provider tool/runtime charges, and final-answer quality against direct calls.
- **Caveat:** OpenAI and Anthropic implementations, availability, and runtime pricing differ. Avoid PTC when each result changes semantic judgment or citations/native artifacts must be preserved.
- **Providers:** OpenAI, Anthropic.
- **Sources:** [OpenAI — Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling); [Anthropic — Manage tool context](https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context)

### TL-10 — Request parallel calls for independent operations

- **Category:** Tool orchestration
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Independent calls in one model turn avoid repeating the growing conversation across several sequential turns.
- **Exact action:** State which operations are independent, enable provider parallel function calling, execute them concurrently, and return all results in one continuation.
- **Measurement plan:** Compare model turns, repeated input tokens, wall time, tool-call accuracy, and total cost against sequential orchestration.
- **Caveat:** Parallel calls do not reduce the size of the tool results themselves and are wrong when later arguments depend on earlier results.
- **Providers:** Gemini API; OpenAI and Anthropic on supported tool APIs.
- **Source:** [Google — Function calling, parallel function calling](https://ai.google.dev/gemini-api/docs/function-calling)

### TL-11 — Skip tools when the model can answer directly

- **Category:** Tool routing
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Tool use adds schema tokens, tool-call/result tokens, at least one extra roundtrip for client tools, and sometimes per-tool fees.
- **Exact action:** Add a deterministic no-tools route for summarization, translation, rewriting, and other tasks fully contained in the prompt.
- **Measurement plan:** Compare direct versus tool-enabled paths on success, latency, schema/result tokens, tool fees, and hallucination risk.
- **Caveat:** Do not disable tools for current/external facts, private data, calculations requiring guarantees, or side effects.
- **Providers:** Anthropic explicitly; provider-agnostic principle.
- **Source:** [Anthropic — How tool use works, when not to use tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)

### TL-12 — Cap server-tool uses and fetched content

- **Category:** Hosted tools / output control
- **Recommendation:** **Free first** as a configuration; hosted calls may be separately billed.
- **Evidence:** **Official**
- **Summary:** Explicit call and content caps prevent search/fetch loops and oversized retrieved context.
- **Exact action:** Set per-request `max_uses`, `max_content_tokens`, domain allowlists, and a stopping criterion sized to the task.
- **Measurement plan:** Track hosted-tool calls, retrieved tokens, max-limit errors, answer completeness, latency, and tool fees.
- **Caveat:** Names and support are tool/provider specific; an overly small cap can force a second full request.
- **Providers:** Anthropic web fetch explicitly; analogous controls should be verified elsewhere.
- **Source:** [Anthropic — Web fetch tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)

### TL-13 — Exclude nested hosted-tool traces when the client does not need them

- **Category:** Hosted tools / response payload
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Raw server-tool call/result blocks can be omitted from the returned response after code execution has consumed them, avoiding unnecessary output payload/tokens.
- **Exact action:** Set Anthropic web fetch `response_inclusion: "excluded"` for workflows that need only the final reduced result, not the nested trace.
- **Measurement plan:** Compare response tokens/bytes, client parse time, auditability, and final-answer correctness.
- **Caveat:** Requires a recent web-fetch tool version and is unsuitable when citations, provenance, debugging, or audit logs require the raw blocks.
- **Providers:** Anthropic.
- **Source:** [Anthropic — Web fetch tool, response inclusion](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool)

## E. Multimodal payloads

### MM-01 — Use OpenAI `detail: "low"` for coarse vision

- **Category:** Image input
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Low detail sends a 512×512 representation and is intended for fast, low-cost understanding where fine visual detail is unnecessary.
- **Exact action:** Default classification, scene presence, dominant-color, and rough-layout tasks to `low`; elevate to `high`/`original` only through a task allowlist or failed first pass.
- **Measurement plan:** Compare image input tokens, accuracy, escalation rate, latency, and total cost by task type.
- **Caveat:** Detail modes and tokenization are OpenAI model-specific; `original` is limited to newer models and can use substantially more tokens.
- **Providers:** OpenAI.
- **Source:** [OpenAI — Images and vision, choose image detail](https://developers.openai.com/api/docs/guides/images-vision)

### MM-02 — Downsample images to the smallest task-sufficient resolution

- **Category:** Image input
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Smaller images use fewer visual tokens until the provider’s patch/tile floor, and reduce upload latency.
- **Exact action:** Benchmark a resolution ladder; resize before upload to the lowest resolution that preserves required text, objects, or coordinates.
- **Measurement plan:** Record visual/input tokens, accuracy, OCR/entity recall, upload bytes, and latency at each resolution.
- **Caveat:** Anthropic uses 28×28 visual patches and model-specific caps; Gemini uses model/API-specific tiles or media-resolution budgets; OpenAI uses detail modes. One pixel rule does not transfer across providers.
- **Providers:** Anthropic, Gemini API, OpenAI with provider-specific mechanics.
- **Sources:** [Anthropic — Vision, resolution and token cost](https://platform.claude.com/docs/en/build-with-claude/vision); [Google — Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)

### MM-03 — Crop to regions of interest before inference

- **Category:** Image input
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** Removing irrelevant margins, pages, or panels reduces patch/tile count while preserving the evidence the task actually needs.
- **Exact action:** Use deterministic layout metadata or a cheap detector to crop the relevant region; retain a full-image fallback when crop confidence is low.
- **Measurement plan:** Compare visual tokens, crop-failure rate, accuracy, and fallback frequency against full images.
- **Caveat:** Cropping can remove contextual relationships and may increase cost if many overlapping crops are sent; coordinate systems must be mapped back to the original.
- **Providers:** Anthropic, Gemini API, OpenAI.
- **Sources:** [Anthropic — Vision](https://platform.claude.com/docs/en/build-with-claude/vision); [Google — Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)

### MM-04 — Set Gemini media resolution per media part

- **Category:** Multimodal input control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Gemini 3 can allocate different visual-token budgets to different images/frames, avoiding a high-resolution setting for every item.
- **Exact action:** Set low resolution for context/reference media and higher resolution only for dense text, small objects, or spatially precise items.
- **Measurement plan:** Compare media/input tokens, accuracy per item type, latency, and cost against one global high setting.
- **Caveat:** Per-part control is Gemini-version/API dependent; higher resolution may still be required for fine text and small targets.
- **Providers:** Gemini API.
- **Source:** [Google — Image understanding, media resolution](https://ai.google.dev/gemini-api/docs/image-understanding)

### MM-05 — Use low video media resolution when frame detail is unimportant

- **Category:** Video input
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Google documents roughly 100 tokens/second at low resolution versus roughly 300 tokens/second at default for the cited video path.
- **Exact action:** Set low media resolution for event presence, broad scene changes, or transcript-led summaries; use default/high only for small visual details.
- **Measurement plan:** Compare video tokens, event/scene accuracy, latency, and cost across low and default on stratified clips.
- **Caveat:** Rates and frame sampling are model/API specific and subject to change; fast actions can be missed at the documented 1 FPS sampling.
- **Providers:** Gemini API.
- **Source:** [Google — Video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)

### MM-06 — Trim video time ranges or send representative frames

- **Category:** Video input
- **Recommendation:** **Free first** for deterministic trimming; **Paid/compute after eval** for automated scene selection.
- **Evidence:** **Derived**
- **Summary:** Video token cost scales with processed duration, so irrelevant seconds are recurring waste.
- **Exact action:** Use known timestamps, chapters, or a cheap scene detector to send only relevant clips/keyframes; include timestamp metadata in the prompt.
- **Measurement plan:** Compare processed seconds, video tokens, event recall, preprocessing time, and total cost against the full video.
- **Caveat:** Keyframes lose motion and audio continuity; the Gemini documentation’s fixed sampling can already miss fast events, so trimming must preserve the target window.
- **Providers:** Gemini API and other duration-billed/tokenized video models.
- **Source:** [Google — Video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)

### MM-07 — Send transcript-only when the task is purely linguistic

- **Category:** Audio/video input
- **Recommendation:** **Free first** when a transcript already exists; **Paid/compute after eval** if transcription must be generated.
- **Evidence:** **Derived**
- **Summary:** A meeting-summary or topic-classification task may not need visual frames or audio tokens once a reliable transcript is available.
- **Exact action:** Route transcript-only tasks to text input; attach audio/video only for speaker, tone, timing, visual, or verification requirements.
- **Measurement plan:** Compare multimodal versus transcript-only total tokens, transcript cost, summary/QA quality, speaker attribution, and latency.
- **Caveat:** Transcripts discard prosody, non-speech audio, visual context, and may contain ASR errors; do not use for evidence that depends on those signals.
- **Providers:** Provider-agnostic; Gemini documents separate audio/video token accounting.
- **Source:** [Google — Understand and count tokens](https://ai.google.dev/gemini-api/docs/tokens)

## F. Prompt-cache engineering

### CA-01 — Place explicit cache breakpoints at genuinely reused boundaries

- **Category:** Prompt caching
- **Recommendation:** **Paid/API feature after reuse analysis**
- **Evidence:** **Official**
- **Summary:** A deliberate breakpoint prevents paying cache-write markup on a changing suffix and makes the reusable span observable.
- **Exact action:** Mark the end of the stable tools/system/doc prefix; keep per-user/request data after it and use explicit mode only where reuse is expected.
- **Measurement plan:** Track cache-write tokens, cache-read tokens, hit rate, amortized input cost, and time-to-break-even per prefix.
- **Caveat:** OpenAI GPT-5.6 explicit cache writes and Anthropic cache writes have provider-specific pricing, TTLs, minimums, and request syntax.
- **Providers:** OpenAI, Anthropic.
- **Sources:** [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching); [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### CA-02 — Choose cache TTL from the observed reuse interval

- **Category:** Prompt caching
- **Recommendation:** **Paid/API feature after reuse analysis**
- **Evidence:** **Official**
- **Summary:** A longer cache lifetime is valuable only when calls recur after the short TTL often enough to repay its write/storage premium.
- **Exact action:** Measure inter-arrival time per prefix; use the shortest TTL covering the profitable reuse percentile and leave one-off prompts uncached.
- **Measurement plan:** Model and then observe write/read cost by TTL, hit rate, expiration misses, and net savings per cache key.
- **Caveat:** Anthropic defaults to a 5-minute ephemeral cache and offers provider-specific TTL behavior; OpenAI syntax and pricing differ. Never assume TTL parity.
- **Providers:** Anthropic, OpenAI.
- **Sources:** [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### CA-03 — Fill the cache before parallel fan-out

- **Category:** Prompt caching / concurrency
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Concurrent requests started before the first cache entry becomes available can all pay full input/write cost.
- **Exact action:** Send one warm-up/first real request, wait until its response begins, then release parallel requests sharing the prefix.
- **Measurement plan:** Compare cache reads and total billed input for cold simultaneous fan-out versus staged fan-out; include added wall-clock delay.
- **Caveat:** Anthropic explicitly documents this availability timing; OpenAI and Gemini cache-fill timing may differ and should be tested, not assumed.
- **Providers:** Anthropic explicitly.
- **Source:** [Anthropic — Prompt caching, concurrent requests](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

### CA-04 — Keep effort and thinking configuration stable inside cached sessions

- **Category:** Prompt caching / reasoning control
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Changing reasoning configuration changes the rendered prompt and invalidates message-level caches, erasing expected discounts.
- **Exact action:** Select effort/thinking mode at session start and hold it constant; route a changed-effort phase to a new cache/session boundary.
- **Measurement plan:** Track cache-hit tokens and total cost for stable versus varying settings while holding conversation content constant.
- **Caveat:** Anthropic explicitly documents invalidation; OpenAI and Gemini have different cache rendering and should be measured separately.
- **Providers:** Anthropic explicitly.
- **Sources:** [Anthropic — Effort](https://platform.claude.com/docs/en/build-with-claude/effort); [Anthropic — Tool use with prompt caching](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching)

### CA-05 — Cache repeated images, documents, and tool results

- **Category:** Multimodal/tool caching
- **Recommendation:** **Paid/API feature after reuse analysis**
- **Evidence:** **Official**
- **Summary:** Reused non-text blocks can be cacheable just like system text, reducing repeated billed input without re-uploading semantics to the model at full price.
- **Exact action:** Put stable media/document/tool-result blocks before the breakpoint and keep their bytes, order, and metadata identical across requests.
- **Measurement plan:** Compare cache-read input tokens, billed media/document cost, hit rate, and invalidations from metadata or ordering changes.
- **Caveat:** Anthropic explicitly lists these block types as cacheable; OpenAI says images/tools must be identical for prefix hits; support and minimums vary.
- **Providers:** Anthropic, OpenAI.
- **Sources:** [Anthropic — Prompt caching, cacheable blocks](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

### CA-06 — Instrument cache misses instead of assuming caching worked

- **Category:** Prompt caching / observability
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A cache marker does not guarantee a hit; short prefixes, changed order, timestamps, or configuration can silently produce zero cached tokens.
- **Exact action:** Log provider cache-write/read fields by normalized prefix key, alert on hit-rate regressions, and diff serialized requests at the first divergent block.
- **Measurement plan:** Report hit rate, cached-token ratio, write/read/uncached cost, and miss causes by deployment version.
- **Caveat:** Usage field names and minimum cacheable lengths differ by model/platform; Anthropic may silently skip too-short marked content rather than error.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching); [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching); [OpenAI — Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

## G. Retry and error handling

### ER-01 — Retry only transient classes

- **Category:** Retry handling
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Replaying deterministic client errors spends latency and can repeat billable work without changing the outcome.
- **Exact action:** Retry only documented transient conditions such as 408, 429, connection failures, and 5xx/overload; route 400/403/schema errors to validation or code fixes.
- **Measurement plan:** Track retries by status, eventual success rate, tokens/cost spent on failed attempts, and non-transient retries eliminated.
- **Caveat:** Retryable status sets differ by provider and a streamed request can fail after HTTP 200; use the provider’s current error taxonomy.
- **Providers:** Anthropic, Gemini API.
- **Sources:** [Anthropic — API errors](https://platform.claude.com/docs/en/api/errors); [Google — Troubleshooting, retry strategy](https://ai.google.dev/gemini-api/docs/troubleshooting)

### ER-02 — Use exponential backoff with jitter

- **Category:** Retry handling
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Backoff and jitter reduce synchronized retry storms that cause repeated rate-limit failures.
- **Exact action:** Start with a short delay, multiply it after each transient failure, add random jitter, and reset after success.
- **Measurement plan:** Compare attempts per successful call, 429/5xx recurrence, completion latency, and duplicate token spend versus fixed immediate retries.
- **Caveat:** Backoff saves failed retries, not tokens on a successful request; interactive latency may worsen and provider SDKs may already implement it.
- **Providers:** Anthropic, Gemini API.
- **Sources:** [Anthropic — API errors](https://platform.claude.com/docs/en/api/errors); [Google — Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)

### ER-03 — Cap attempts and the retry token budget

- **Category:** Retry handling / cost guardrail
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** A maximum attempt count prevents an outage or impossible request from multiplying token spend indefinitely.
- **Exact action:** Set a small max retry count per operation, a wall-clock deadline, and a cumulative token/cost ceiling; return a typed failure after any limit is reached.
- **Measurement plan:** Track attempts, abandoned tasks, eventual success by attempt number, cumulative failed tokens, and user-visible failures.
- **Caveat:** Google explicitly recommends maximum retries; a global count is too crude when long-running agent steps have different idempotency and value.
- **Providers:** Gemini API; provider-agnostic implementation.
- **Source:** [Google — Troubleshooting, set maximum retries](https://ai.google.dev/gemini-api/docs/troubleshooting)

### ER-04 — Honor `Retry-After` and do not stack retry layers

- **Category:** Retry handling
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** The official SDK may already retry; wrapping it in another loop can multiply attempts geometrically.
- **Exact action:** Inspect SDK defaults, configure one owner for retries, honor `retry-after`, and expose the final attempt count in telemetry.
- **Measurement plan:** Record actual HTTP attempts per logical request, retry delay, eventual success, and duplicate tokens before/after consolidating layers.
- **Caveat:** Anthropic documents two automatic retries by default; Google documents SDK automatic retry behavior that can vary by language/version. Pin and inspect the current SDK.
- **Providers:** Anthropic, Gemini API.
- **Sources:** [Anthropic — API errors](https://platform.claude.com/docs/en/api/errors); [Google — Troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)

### ER-05 — Stream long generations to reduce timeout-driven replays

- **Category:** Error handling / long responses
- **Recommendation:** **Free first**
- **Evidence:** **Official**
- **Summary:** Streaming keeps a long request active and exposes partial progress, reducing the chance that a client timeout triggers a full replay.
- **Exact action:** Use the streaming Messages/Responses path for long jobs, set idle and total deadlines separately, and handle mid-stream error events without blindly restarting.
- **Measurement plan:** Compare timeout rate, completed-output rate, replayed tokens, and latency for streaming versus non-streaming at the same output size.
- **Caveat:** Streaming does not reduce tokens by itself; Anthropic notes errors can arrive after HTTP 200, so partial data and billing must be reconciled.
- **Providers:** Anthropic explicitly; analogous streaming APIs elsewhere.
- **Source:** [Anthropic — API errors, long requests and streaming](https://platform.claude.com/docs/en/api/errors)

### ER-06 — Validate request schemas locally before paying for a call

- **Category:** Error prevention
- **Recommendation:** **Free first**
- **Evidence:** **Derived**
- **Summary:** Unsupported JSON Schema keywords, missing required constraints, and out-of-range generation parameters are deterministic failures that can be caught locally.
- **Exact action:** Compile/provider-validate schemas at deploy time; validate request objects and parameter ranges client-side before enqueueing them.
- **Measurement plan:** Track prevented 4xx calls, schema deployment failures, request-validation latency, and incident rate after model/provider upgrades.
- **Caveat:** Provider schema subsets evolve; maintain provider-specific validators rather than one “universal” JSON Schema assumption.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [OpenAI — Function calling, strict requirements](https://developers.openai.com/api/docs/guides/function-calling); [Google — Structured output limitations](https://ai.google.dev/gemini-api/docs/structured-output); [Google — Troubleshooting parameter checks](https://ai.google.dev/gemini-api/docs/troubleshooting)

### ER-07 — Preserve successful work and retry only the failed operation

- **Category:** Retry handling / tool loops
- **Recommendation:** **Free first** for checkpointing; the retry itself remains billable.
- **Evidence:** **Derived**
- **Summary:** Re-running the entire agent after one tool or output failure repeats prior model turns, tool calls, and context.
- **Exact action:** Persist response IDs, tool-call IDs, validated tool results, and completed-stage outputs; resume from the failed stage with the smallest required context.
- **Measurement plan:** Inject failures at each stage and compare repeated model/tool calls, tokens, side effects, completion rate, and recovery latency against full restart.
- **Caveat:** Continuation state differs: Gemini thought/tool signatures and OpenAI/Anthropic call linkage must be preserved exactly; side-effecting tools also require idempotency controls.
- **Providers:** OpenAI, Anthropic, Gemini API.
- **Sources:** [Google — Function calling](https://ai.google.dev/gemini-api/docs/function-calling); [OpenAI — Programmatic Tool Calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling)

## Provider differences that should be first-class in an implementation

| Concern | OpenAI | Anthropic | Gemini API |
|---|---|---|---|
| Concision control | `text.verbosity`; prompt requirements | `output_config.effort`; `max_tokens`; task budgets on selected models | concise examples/instructions; `max_output_tokens`; stop sequences |
| Reasoning spend | model-specific `reasoning.effort` | `output_config.effort`; thinking configuration | `thinking_budget`/dynamic thinking on model-specific ranges |
| Structured output | JSON Schema subset; strict function schemas have required-field constraints | JSON outputs and strict tools on supported models/platforms | JSON Schema subset; `VALIDATED`/`ANY` function modes |
| Tool-catalog reduction | Tool Search and `allowed_tools` | `defer_loading` + tool search | use allowed function names/modes; no equivalent should be assumed without docs |
| Prompt caching | exact-prefix behavior; implicit/explicit modes vary by model | breakpoints, model/platform minimums, 5-minute default ephemeral TTL, write markup | implicit caching by default on listed newer models; explicit caching depends on API surface |
| Vision cost lever | per-image `detail` | 28×28 visual patches plus model resolution caps | tiling/media-resolution controls; model/API-specific token budgets |
| Retry defaults | inspect the pinned SDK/docs before wrapping | SDK retries transient failures twice by default in cited docs | official SDKs include automatic exponential backoff; defaults vary by SDK/version |

## Recommended implementation order

Start with the methods that require no additional inference and are easiest to falsify: **PD-01, PD-02, PD-05, OC-01/02, SO-01/02/03, TL-01/05/07/11, MM-01/02, CA-06, and ER-01/03/04/06**. Then test caching and context editing on repeated workloads. Treat compressor models, programmatic tool calling, server compaction, and other paid/compute techniques as business cases: their added cost and failure modes must be included in the denominator, not hidden behind lower target-model token counts.
