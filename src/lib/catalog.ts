import researchMethods from "@/data/research-methods.json";

export type EvidenceGrade = "official" | "derived" | "experiment";
export type TipAccess = "free" | "pro";
export type ExperimentType =
  | "request_config"
  | "prompt_diff"
  | "model_route"
  | "cache_sequence"
  | "schema_diff"
  | "context_diff"
  | "processing_diff"
  | "guided_only";
export type ExperimentSupport = "supported" | "guided-only" | "not-supported";

type TipSource = { label: string; url: string };

export type TokenTip = {
  id: string;
  canonicalId: string;
  title: string;
  category: string;
  access: TipAccess;
  grade: EvidenceGrade;
  summary: string;
  action: string;
  measure: string;
  caveat: string;
  intervention: string;
  aliases: readonly string[];
  providers: string;
  sources: readonly TipSource[];
  lastVerified: string;
  experimentType: ExperimentType;
  experimentSupport: ExperimentSupport;
  researchId?: string;
  source: TipSource;
};

type TipInput = Omit<TokenTip, "canonicalId" | "intervention" | "aliases" | "providers" | "sources" | "lastVerified" | "experimentType" | "experimentSupport"> &
  Partial<Pick<TokenTip, "canonicalId" | "intervention" | "aliases" | "providers" | "sources" | "lastVerified" | "experimentType" | "experimentSupport">>;

const official = "official" as const;
const derived = "derived" as const;
const experiment = "experiment" as const;

const coreTips: readonly TipInput[] = [
  {
    id: "stable-prefix-first",
    title: "Put stable prompt content first",
    category: "Caching",
    access: "pro",
    grade: official,
    summary: "Prompt cache hits require an exact matching prefix, so ordering determines whether repeated context is reusable.",
    action: "Place durable instructions, examples, tool schemas, and shared context before user-specific or time-varying data.",
    measure: "Compare cached input tokens and cache-read ratio before and after reordering.",
    caveat: "A shorter prompt can still cost more if it destroys a frequently reused prefix.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "cache-minimum-prefix",
    title: "Cross the cacheable-prefix threshold deliberately",
    category: "Caching",
    access: "pro",
    grade: official,
    summary: "GPT-5.6 prompt caching starts at a 1,024-token prefix; a smaller shared prefix cannot produce the same cache benefit.",
    action: "Measure the stable prefix separately and avoid assuming that a repeated but tiny instruction block is cached.",
    measure: "Record prefix tokens and confirm non-zero cached input tokens on warm calls.",
    caveat: "Do not pad a prompt merely to reach the threshold; added uncached content can erase the benefit.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "model-route-by-difficulty",
    title: "Route by measured task difficulty",
    category: "Model routing",
    access: "pro",
    grade: official,
    summary: "OpenAI recommends establishing the quality target with a capable model, then finding the cheapest model that maintains it.",
    action: "Create simple, medium, and hard task buckets, then test Luna, Terra, and Sol against the same acceptance rubric.",
    measure: "Use cost per quality-passing answer, including retries and escalations.",
    caveat: "Cheap-first routing loses money when failed attempts frequently require a second call.",
    source: { label: "OpenAI model selection", url: "https://developers.openai.com/api/docs/guides/model-selection" },
  },
  {
    id: "lower-reasoning-effort",
    title: "Lower reasoning effort one step at a time",
    category: "Reasoning",
    access: "free",
    grade: official,
    summary: "Reasoning effort should be matched to task complexity rather than fixed at the highest setting.",
    action: "Compare the current effort with one level lower on a representative evaluation set.",
    measure: "Track reasoning tokens, quality-pass rate, latency, and accepted-answer cost.",
    caveat: "A lower setting is not a saving if it causes retries or misses important constraints.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "cap-output",
    title: "Give every response an output ceiling",
    category: "Output",
    access: "free",
    grade: official,
    summary: "An output-token limit bounds the most expensive side of a runaway generation.",
    action: "Set a task-appropriate maximum and ask for concise structure rather than an open-ended answer.",
    measure: "Compare output tokens, truncation rate, retries, and quality-pass rate.",
    caveat: "A ceiling that truncates valid answers creates extra calls and can increase total cost.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "batch-offline-work",
    title: "Move delay-tolerant work to Batch",
    category: "Processing",
    access: "pro",
    grade: official,
    summary: "The Batch API offers a 50% cost discount for asynchronous workloads that can complete within 24 hours.",
    action: "Batch evaluations, classification, enrichment, and other work that does not need an immediate user response.",
    measure: "Compare billed cost and completion time against identical synchronous requests.",
    caveat: "Batch is a poor fit for interactive product paths or work with a short deadline.",
    source: { label: "OpenAI Batch API", url: "https://developers.openai.com/api/docs/guides/batch" },
  },
  {
    id: "explicit-cache-breakpoint",
    title: "Set explicit cache breakpoints around durable context",
    category: "Caching",
    access: "pro",
    grade: official,
    summary: "Explicit-only caching can prevent a changing suffix from repeatedly becoming a new cache write.",
    action: "End the cacheable region after the stable instructions and shared context, before volatile request data.",
    measure: "Compare cache-write tokens, cache-read tokens, and total input cost over a cold call plus repeated warm calls.",
    caveat: "Breakpoint placement is workload-specific and must be tested against real prefix reuse.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "cache-key-partition",
    title: "Partition prompt cache keys by stable workload",
    category: "Caching",
    access: "pro",
    grade: official,
    summary: "A stable prompt cache key improves routing to machines that may already hold the matching prefix.",
    action: "Use one key per stable prompt family, not one global key and not a new key for every request.",
    measure: "Track cache-read ratio and requests per minute for each key.",
    caveat: "OpenAI recommends keeping traffic to roughly 15 requests per minute per key to avoid overflow that reduces cache efficiency.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "cache-break-even",
    title: "Calculate cache break-even before redesigning prompts",
    category: "Caching",
    access: "pro",
    grade: derived,
    summary: "With current GPT-5.6 cache rates, one write plus one read costs about 1.35 uncached-prefix equivalents instead of 2.0.",
    action: "Estimate the number of warm hits per write and isolate the reusable prefix from variable input and output.",
    measure: "Calculate total prefix cost across the full request distribution, including misses.",
    caveat: "The 32.5% two-call reduction applies only to the reused prefix; it is not a whole-request savings claim.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "deduplicate-instructions",
    title: "Remove duplicated instructions before shortening prose",
    category: "Prompt design",
    access: "free",
    grade: experiment,
    summary: "Rules often appear in system text, examples, tool descriptions, and the user prompt at the same time.",
    action: "Map each requirement to one authoritative location, then remove only true duplicates in a paired test.",
    measure: "Compare input tokens and constraint-pass rate across at least three repeats per case.",
    caveat: "Repetition can be useful when it fixes a measured failure; do not remove it on aesthetics alone.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "remove-example-one-at-time",
    title: "Ablate examples one at a time",
    category: "Prompt design",
    access: "free",
    grade: experiment,
    summary: "Few-shot examples are recurring input cost, but some may be carrying most of the quality gain.",
    action: "Remove one example, rerun the same evaluation set, and keep it removed only when quality remains inside the declared margin.",
    measure: "Track input-token reduction and per-example quality failures.",
    caveat: "Deleting every example at once hides which one was valuable and makes regressions hard to diagnose.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "stop-at-known-delimiter",
    title: "Stop at a known delimiter",
    category: "Output",
    access: "free",
    grade: official,
    summary: "A stop sequence can prevent trailing explanations or repeated sections after the useful payload is complete.",
    action: "Choose a delimiter that cannot occur inside valid content, instruct the model to end with it, and configure the provider stop-sequence parameter.",
    measure: "Compare output tokens and incomplete-output rate, including delimiter-collision and escaping tests.",
    caveat: "Stop support differs by model, and structured outputs are safer for complex JSON or content that may contain the delimiter.",
    source: { label: "Google prompt design strategies", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies" },
  },
  {
    id: "route-by-accepted-cost",
    title: "Optimize cost per accepted answer",
    category: "Measurement",
    access: "pro",
    grade: derived,
    summary: "Nominal per-token price misses retries, escalations, malformed outputs, and rejected answers.",
    action: "Divide total cost—including failed attempts—by the number of outputs that pass the predefined quality gate.",
    measure: "Report cost per accepted answer beside raw token cost.",
    caveat: "A cheaper model can be the expensive route when its acceptance rate is low.",
    source: { label: "OpenAI cost optimization", url: "https://developers.openai.com/api/docs/guides/cost-optimization" },
  },
  {
    id: "previous-response-not-discount",
    title: "Do not mistake previous_response_id for a discount",
    category: "Conversation",
    access: "pro",
    grade: official,
    summary: "The API simplifies threaded state with previous_response_id, but prior input tokens in the chain remain billable.",
    action: "Use it for state management, then separately measure whether the accumulated context is still worth carrying.",
    measure: "Track input tokens by turn and cumulative accepted-answer cost.",
    caveat: "A short-looking follow-up request can still carry a large billed history.",
    source: { label: "OpenAI conversation state", url: "https://developers.openai.com/api/docs/guides/conversation-state" },
  },
  {
    id: "server-compaction",
    title: "Compact long conversations before they dominate every turn",
    category: "Conversation",
    access: "pro",
    grade: official,
    summary: "Server-side compaction replaces older context with an opaque encrypted state item that uses fewer tokens.",
    action: "Set a compact threshold and test long scripted conversations for fact and instruction retention.",
    measure: "Compare per-turn input tokens, total cost, recall, and final task success.",
    caveat: "In stateless chaining, content before the latest compaction item may be dropped; follow the documented chaining pattern.",
    source: { label: "OpenAI compaction", url: "https://developers.openai.com/api/docs/guides/compaction" },
  },
  {
    id: "cache-versus-compaction",
    title: "Measure the cache-versus-compaction crossover",
    category: "Conversation",
    access: "pro",
    grade: experiment,
    summary: "Summarizing or rewriting history can shrink context while also invalidating an otherwise reusable cache prefix.",
    action: "Compare full cached history, rolling summary, and server compaction over the same multi-turn script.",
    measure: "Find the turn where marginal history cost becomes larger than lost cache reuse.",
    caveat: "There is no universal best turn because repetition and conversation growth vary by workload.",
    source: { label: "OpenAI prompt caching", url: "https://developers.openai.com/api/docs/guides/prompt-caching" },
  },
  {
    id: "avoid-long-context-premium",
    title: "Route or compact before the long-context premium",
    category: "Context",
    access: "pro",
    grade: official,
    summary: "GPT-5.6 Sol requests above 272K input tokens are charged at higher input and output rates for the entire request.",
    action: "Count the request first, then retrieve, compact, or split work before crossing the threshold when quality allows.",
    measure: "Track preflight input count, threshold crossings, final cost, and quality.",
    caveat: "Splitting can lose global context or add duplicate instructions, so verify the end task rather than tokens alone.",
    source: { label: "GPT-5.6 Sol", url: "https://developers.openai.com/api/docs/models/gpt-5.6-sol" },
  },
  {
    id: "low-verbosity",
    title: "Use low verbosity for machine-consumed answers",
    category: "Output",
    access: "free",
    grade: official,
    summary: "GPT-5.6 supports a low text-verbosity setting for shorter responses without relying only on prompt wording.",
    action: "Use low verbosity for extraction, classification, routing, and other outputs where elaboration has no product value.",
    measure: "Compare output tokens, completeness, and retry rate.",
    caveat: "Low verbosity can remove useful explanation from customer-facing or high-stakes answers.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "structured-output-retries",
    title: "Price schema overhead against avoided retries",
    category: "Structured output",
    access: "pro",
    grade: official,
    summary: "Structured Outputs conform to a supplied JSON Schema and can eliminate formatting-only instructions and malformed-response retries.",
    action: "Compare prompt-requested JSON with strict schema output on the same extraction set.",
    measure: "Include schema input tokens, malformed outputs, retries, and accepted-answer cost.",
    caveat: "For tiny one-shot outputs, a large schema can cost more than the retries it prevents.",
    source: { label: "OpenAI Structured Outputs", url: "https://developers.openai.com/api/docs/guides/structured-outputs" },
  },
  {
    id: "strict-tools",
    title: "Use strict tool schemas to prevent repair calls",
    category: "Tools",
    access: "pro",
    grade: official,
    summary: "Strict function calling makes generated arguments conform to the declared schema.",
    action: "Enable strict mode, make optionality explicit, and remove prose that merely repeats the schema.",
    measure: "Track invalid tool arguments, repair calls, schema tokens, and successful completion cost.",
    caveat: "Strictness improves conformance, not whether the model chose the correct tool.",
    source: { label: "OpenAI function calling", url: "https://developers.openai.com/api/docs/guides/function-calling" },
  },
  {
    id: "limit-initial-tools",
    title: "Keep the initial tool surface small",
    category: "Tools",
    access: "pro",
    grade: official,
    summary: "Tool definitions count as input, and OpenAI suggests keeping fewer than 20 functions initially available when practical.",
    action: "Expose the task-relevant tools first and defer large or infrequent tool groups.",
    measure: "Compare schema input tokens, correct-tool selection, latency, and end-task success.",
    caveat: "Hiding a needed tool creates extra discovery or retry turns, so route using intent rather than a hard arbitrary cap.",
    source: { label: "OpenAI function calling", url: "https://developers.openai.com/api/docs/guides/function-calling" },
  },
  {
    id: "omit-known-tool-args",
    title: "Remove tool arguments already known by code",
    category: "Tools",
    access: "pro",
    grade: official,
    summary: "Arguments that the application already knows add schema and generation tokens while creating another failure point.",
    action: "Inject authenticated user IDs, tenant IDs, locale, and fixed configuration in application code rather than asking the model to supply them.",
    measure: "Compare schema size, tool-argument tokens, and invalid-call rate.",
    caveat: "Never hide a value whose choice genuinely belongs to the model or user.",
    source: { label: "OpenAI function calling", url: "https://developers.openai.com/api/docs/guides/function-calling" },
  },
  {
    id: "combine-sequential-tools",
    title: "Combine tool calls that always occur in sequence",
    category: "Tools",
    access: "pro",
    grade: official,
    summary: "A tool pair that always runs together can often become one application operation, avoiding an extra model round trip.",
    action: "Merge only truly inseparable sequences and keep independent operations separate for clarity and control.",
    measure: "Track model calls, tool-call tokens, latency, and recoverability when the second operation fails.",
    caveat: "Over-combining tools creates opaque, overly powerful operations and makes partial failure harder to handle.",
    source: { label: "OpenAI function calling", url: "https://developers.openai.com/api/docs/guides/function-calling" },
  },
  {
    id: "file-search-result-limit",
    title: "Tune file-search result count against answer recall",
    category: "Retrieval",
    access: "pro",
    grade: official,
    summary: "max_num_results can reduce file-search token use and latency, with a possible answer-quality tradeoff.",
    action: "Test result counts such as 2, 4, and 8 against questions with known supporting documents.",
    measure: "Track retrieved tokens, gold-source recall, answer quality, and latency.",
    caveat: "A lower result count is false economy when the supporting passage is omitted.",
    source: { label: "OpenAI file search", url: "https://developers.openai.com/api/docs/guides/tools-file-search" },
  },
  {
    id: "metadata-filter-first",
    title: "Filter retrieval before generation",
    category: "Retrieval",
    access: "pro",
    grade: official,
    summary: "Metadata filters narrow the candidate set before file-search results are added to model context.",
    action: "Tag documents with reliable tenant, product, date, jurisdiction, or content-type metadata and filter on known request attributes.",
    measure: "Compare retrieved tokens, source recall, cross-tenant leakage checks, and answer quality.",
    caveat: "Incorrect or incomplete metadata silently removes relevant evidence.",
    source: { label: "OpenAI file search", url: "https://developers.openai.com/api/docs/guides/tools-file-search" },
  },
  {
    id: "flex-processing",
    title: "Use Flex only where latency and retries fit",
    category: "Processing",
    access: "pro",
    grade: official,
    summary: "Flex processing exchanges lower cost for slower responses and possible resource unavailability.",
    action: "Use it for background work with deadlines that tolerate variable completion, and define retry limits first.",
    measure: "Track completion rate, retries, wall-clock time, and final accepted-answer cost.",
    caveat: "Resource-unavailable retries can erase savings for deadline-sensitive work.",
    source: { label: "OpenAI cost optimization", url: "https://developers.openai.com/api/docs/guides/cost-optimization" },
  },
  {
    id: "exact-preflight-count",
    title: "Count the complete request before generating",
    category: "Measurement",
    access: "pro",
    grade: official,
    summary: "The input-token endpoint counts messages, roles, images, files, tools, schemas, and conversation state in the same request shape as Responses.",
    action: "Preflight expensive requests and use the result to reject, compact, retrieve, split, or route before generation.",
    measure: "Compare predicted input tokens with actual usage and track actions taken at each threshold.",
    caveat: "A local text tokenizer cannot exactly account for every non-text request component.",
    source: { label: "OpenAI token counting", url: "https://developers.openai.com/api/docs/guides/token-counting" },
  },
  {
    id: "include-retries",
    title: "Charge retries to the strategy that caused them",
    category: "Measurement",
    access: "pro",
    grade: derived,
    summary: "Aggressive limits, weaker models, and brittle formats look artificially cheap when failed attempts are omitted.",
    action: "Attribute every repair, retry, fallback, and escalation to the original experiment arm.",
    measure: "Report attempt count and total tokens per accepted answer, not per final call.",
    caveat: "Provider-level automatic retries also need to be captured where the SDK exposes them.",
    source: { label: "OpenAI cost optimization", url: "https://developers.openai.com/api/docs/guides/cost-optimization" },
  },
  {
    id: "separate-tool-fees",
    title: "Separate tokens from non-token fees",
    category: "Measurement",
    access: "pro",
    grade: official,
    summary: "Search, storage, and other tools can have charges that are not represented by language-model token totals.",
    action: "Calculate token cost first, then add tool calls, storage, and other metered items as separate ledger lines.",
    measure: "Report model-token cost, tool cost, and total request cost side by side.",
    caveat: "A token-saving change can still increase the invoice when it adds expensive tool calls.",
    source: { label: "OpenAI pricing", url: "https://developers.openai.com/api/docs/pricing" },
  },
  {
    id: "concise-example-length-target",
    title: "Demonstrate the target answer length",
    category: "Prompt design",
    access: "free",
    grade: official,
    summary: "A compact example can teach the desired response length and structure more concretely than a vague request to be concise.",
    action: "Add one short example that contains every required element and no optional commentary, then remove prose that the example makes redundant.",
    measure: "Compare median output tokens, required-element recall, and retry rate with and without the concise example.",
    caveat: "The example adds input tokens on every uncached request, so keep it only when output or retry savings exceed that recurring cost.",
    source: { label: "Google prompt design strategies", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies" },
  },
  {
    id: "no-preamble-or-restatement",
    title: "Remove preambles and task restatements",
    category: "Output",
    access: "free",
    grade: derived,
    summary: "Machine-consumed answers rarely need to repeat the request or announce that the model is about to answer it.",
    action: "Tell the candidate to begin with the answer, omit greetings and conclusions, and never restate the task unless clarification is required.",
    measure: "Track output tokens, first-useful-token position, completeness, and the rate of confusingly abrupt answers.",
    caveat: "Customer-facing explanations may need context or tone; do not remove framing that users demonstrably rely on.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "required-before-optional",
    title: "Put required answer elements before optional detail",
    category: "Output",
    access: "free",
    grade: experiment,
    summary: "A response budget is safer when the must-have fields or conclusions appear before explanation that can be shortened or omitted.",
    action: "List the required answer elements in priority order and tell the candidate to add optional rationale only when budget remains.",
    measure: "Compare required-field recall, truncation failures, output tokens, and human preference on the same tasks.",
    caveat: "Some reasoning-heavy tasks need explanation before a defensible conclusion; use the product acceptance rubric, not length alone.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "compact-choice-labels",
    title: "Encode closed choices as compact labels",
    category: "Structured output",
    access: "free",
    grade: derived,
    summary: "A fixed decision can usually be returned as a short enum, boolean, or identifier instead of a repeated prose description.",
    action: "Give each allowed decision a stable compact label, ask for exactly one label, and map it to user-facing text in application code.",
    measure: "Compare output tokens, invalid-label rate, decision accuracy, and any repair calls against the prose response.",
    caveat: "Compact labels hide nuance; keep a separate explanation field when downstream users need the reasoning.",
    source: { label: "OpenAI Structured Outputs", url: "https://developers.openai.com/api/docs/guides/structured-outputs" },
  },
  {
    id: "one-line-success-criteria",
    title: "Replace style boilerplate with one success criterion",
    category: "Prompt design",
    access: "free",
    grade: experiment,
    summary: "Several overlapping style instructions can often become one observable definition of a successful answer.",
    action: "Replace generic adjectives such as clear, helpful, thorough, and professional with one testable sentence describing what the answer must let the reader do.",
    measure: "Compare input tokens, evaluator pass rate, clarification requests, and output length across a representative task set.",
    caveat: "Do not collapse distinct safety, policy, or contractual requirements merely because their wording looks repetitive.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
  {
    id: "fixed-response-budget",
    title: "State a concrete response budget",
    category: "Output",
    access: "free",
    grade: experiment,
    summary: "A measurable word, sentence, bullet, or field budget gives the model a clearer stopping target than an unqualified request for brevity.",
    action: "Choose the smallest task-appropriate budget—for example three bullets or six fields—and state both the limit and the content that must fit inside it.",
    measure: "Track output tokens, budget violations, missing requirements, truncation, and retries against the current prompt.",
    caveat: "Prompt budgets are soft controls; pair them with a safe API output ceiling for worst-case spend and leave headroom for valid edge cases.",
    source: { label: "OpenAI model guidance", url: "https://developers.openai.com/api/docs/guides/latest-model" },
  },
];

const compiledResearchMethods = researchMethods as readonly TipInput[];

export const catalogueAliases: Readonly<Record<string, readonly string[]>> = {
  "cache-key-partition": ["research-pc-08"],
  "research-pc-15": ["research-ca-06"],
  "research-ctx-10": ["research-pd-09"],
  "research-ctx-11": ["research-pd-06"],
  "research-ctx-12": ["research-pd-07"],
  "structured-output-retries": ["research-so-01"],
  "limit-initial-tools": ["research-tl-01"],
  "combine-sequential-tools": ["research-tl-09"],
  "lower-reasoning-effort": ["research-oc-05", "research-oc-06", "research-oc-07"],
  "server-compaction": ["research-cmp-04"],
  "stop-at-known-delimiter": ["research-oc-03"],
};

const requestConfigIds = new Set(["lower-reasoning-effort", "low-verbosity", "cap-output", "stop-at-known-delimiter"]);
const supportedExperimentIds = new Set(["lower-reasoning-effort", "low-verbosity"]);

export const tokenTips: readonly TokenTip[] = [...coreTips, ...compiledResearchMethods].map((tip) => {
  const experimentType: ExperimentType = tip.experimentType ?? (requestConfigIds.has(tip.id) ? "request_config" : tip.access === "free" ? "prompt_diff" : "guided_only");
  const experimentSupport: ExperimentSupport = tip.experimentSupport ?? (supportedExperimentIds.has(tip.id) ? "supported" : tip.id === "cap-output" || tip.id === "stop-at-known-delimiter" ? "not-supported" : "guided-only");
  const provider = tip.providers ?? providerFromSource(tip.source.url);
  return {
    ...tip,
    canonicalId: tip.canonicalId ?? tip.id,
    intervention: tip.intervention ?? tip.action,
    aliases: tip.aliases ?? catalogueAliases[tip.id] ?? [],
    providers: provider,
    sources: tip.sources ?? [tip.source],
    lastVerified: tip.lastVerified ?? "2026-08-15",
    experimentType,
    experimentSupport,
  };
});

export const publicTips = tokenTips.filter((tip) => tip.access === "free");
export const proTips = tokenTips.filter((tip) => tip.access === "pro");

export const evidenceLabels: Record<EvidenceGrade, string> = {
  official: "Official fact",
  derived: "Derived math",
  experiment: "Test protocol",
};

function providerFromSource(url: string): string {
  if (url.includes("openai.com")) return "OpenAI";
  if (url.includes("google.com") || url.includes("google.dev")) return "Google Gemini";
  if (url.includes("anthropic.com") || url.includes("claude.com")) return "Anthropic Claude";
  if (url.includes("aws.amazon.com")) return "Amazon Bedrock";
  if (url.includes("arxiv.org")) return "Provider-agnostic";
  return "Provider scope stated in source";
}
