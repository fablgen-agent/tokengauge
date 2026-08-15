# TokenGauge free/paid product and A/B testing review

Review date: **2026-08-15 UTC**
Scope: repository review only; no application code changed. The review covers the intended minimum of **10 free methods, 100 paid methods, and free-method A/B testing**.

## Executive decision

**Do not market the requested inventory or the current lab as complete yet.** The product structure is promising, but the implementation and copy are ahead of the evidence in several places.

- The application currently ships **6 free and 27 Pro cards**, enforced by a test that requires exactly those counts (`src/lib/catalog.test.ts:5-10`). This misses both requested floors.
- The two method research files contain **110 raw headings** (52 in `04-methods-cache-context.md`, 58 in `05-methods-prompt-output-tools.md`), but they are not 110 distinct sellable methods. Examples such as PC-01/PD-04, PC-03/CA-01, PC-10/CA-03, PC-11/CA-02, PC-15/CA-06, CTX-01/PD-05, and CTX-04/TL-02 overlap. Selecting 10-12 free entries from that raw pool therefore does **not** establish 100 distinct paid entries.
- One lab screen says **12 open methods**, while the actual free array and library say six (`src/app/lab/page.tsx:27`; `src/app/library/page.tsx:25`; `src/lib/catalog.ts:423-424`).
- The current lab is a **single randomized pair of prompt-instruction variants**. It does not implement the intervention required for most current free methods: it uses one model, one run per arm, fixed low reasoning/verbosity, no quality rubric, no actual Batch path, and no controlled cold/warm cache sequence (`src/app/api/experiment/route.ts:55-89`).
- Runtime delivery of paid cards is appropriately decided on the server, and the experiment route rechecks method access. However, all paid card text lives in an MIT-licensed repository, so payment cannot honestly be positioned as keeping the method text secret.
- The privacy notice says reasoning and cache totals are retained, but the database saves only input, output, and total tokens. Session expiry is lazy and renewable, so “kept for up to seven days” is also not a hard deletion promise (`src/lib/db.ts:54-67,75-100,188-216`; `src/app/privacy/page.tsx:10-13`).

Recommended launch contract: **12 free methods + at least 100 genuinely distinct Pro methods**, with every free method carrying an explicit experiment adapter and passing its method-specific lab test. Until that exists, describe the current feature as a **paired prompt trial**, not a general A/B lab.

## 1. Product access and data delivery review

This section is deliberately framed as ordinary product behavior: what each customer state receives, what the server checks, and what data travels where.

### What is already sound

1. The library decides `visibleTips` on the server. A customer without Pro receives `publicTips`; a Pro customer receives `tokenTips` (`src/app/library/page.tsx:13-29`). Paid cards are not merely hidden with CSS.
2. The experiment endpoint does not trust the client-side selector. It looks up the submitted `strategyId` and returns 403 when a non-Pro account selects a paid card (`src/app/api/experiment/route.ts:38-47`).
3. A ChatGPT plan label is informational. Pro status comes only from the TokenGauge entitlement table (`src/lib/access.ts:22-37`). A paid ChatGPT plan does not silently grant TokenGauge Pro.
4. Model names are checked against the models available to the connected account before either arm runs (`src/app/api/experiment/route.ts:49-53`).
5. The experiment response uses `Cache-Control: no-store`, and raw credential export is disabled (`src/app/api/experiment/route.ts:87-90`; `src/lib/chatgpt.ts:29-30`).
6. Payment identity is separated from the ChatGPT account identifier through an HMAC-derived billing ID, and refunds deactivate the entitlement (`src/lib/access.ts:18-20`; `src/lib/db.ts:178-185`).

### Product-scope gaps to resolve

| Gap | Current behavior | Product consequence | Recommendation |
|---|---|---|---|
| Paid content is in the public source tree | Full card copy is in `src/lib/catalog.ts` in an MIT-licensed repository. | “Locked” means gated in the hosted UI, not unavailable elsewhere. | Sell curation, workflow, maintained updates, presets, and history—not secrecy. If textual exclusivity is essential, keep Pro content outside the public repository and load it server-side. |
| The generic ChatGPT responses route remains available | `/api/chatgpt/[...lwc]` exposes the SDK responses proxy to every connected account. Its proxy allowance is 64 KiB and 10 requests/minute (`src/lib/chatgpt.ts:31-38`), whereas the lab route has a 20 KiB input rule. | A connected free customer can make arbitrary plan-consuming requests through TokenGauge outside the lab schema. This does not reveal paid cards, but it makes the real connected-account capability broader than the UX promises. | Decide explicitly whether the generic proxy is a product feature. If not, expose only the narrow server workflow. Add an acceptance test for the decision. |
| Generic editing exceeds “free-method testing” | A free customer may select a free ID and replace the candidate text with any instruction (`src/components/lab-workbench.tsx:58-82`). | The entitlement protects presets/card content, not generic prompt comparison. | Make this the stated rule: the comparison tool is free; Pro unlocks curated Pro templates and workflows. Otherwise, make templates immutable and validate the submitted experiment manifest against the selected method. |
| Authenticated visits create durable profile rows | `getAuthContext` upserts account ID, name, and email on authenticated page/API access (`src/lib/access.ts:22-37`). | “Disconnect” deletes the ChatGPT session but does not remove the TokenGauge profile, experiments, or payment records. | Explain the distinction in the disconnect UI and offer a separate “Delete TokenGauge data” control. |
| Runtime gating and source availability tell different stories | The library says paid content is not sent to the browser first (`src/app/library/page.tsx:26`). That is true for runtime rendering but not for public source access. | Customers may interpret the statement more broadly than intended. | Use: “Pro cards are delivered to signed-in Pro accounts in the hosted app.” Do not imply the public repository lacks the text. |

## 2. Clear entitlement rules

Use one entitlement vocabulary everywhere. “Connected,” “ChatGPT plan,” and “TokenGauge Pro” are three separate states.

| Customer state | Included | Not included |
|---|---|---|
| Anonymous | API rate directory, calculator, all 12 free method cards, sources, sample experiment explanation | Running model requests, Pro method cards/templates, API credits |
| Connected free | Everything anonymous gets; generic paired benchmark; presets for the 12 free methods; current account model list; locally displayed results | Pro cards/templates, provider API credits, any promise of dollar savings, any entitlement based on ChatGPT plan name |
| TokenGauge Pro | Everything connected free gets; 100+ distinct Pro cards; Pro presets/adapters; future additions while the hosted service remains available | OpenAI API credits, a ChatGPT subscription, guaranteed savings, guaranteed perpetual service |
| Refunded/revoked | Falls back immediately to connected free; keeps the 12 free cards and free lab presets | Pro cards/templates and Pro workflows |

Rules to implement and test:

1. `access: "free"` means **no TokenGauge payment is required**. It does not mean the underlying model run is free; a lab run can consume the connected account’s allowance.
2. `access: "pro"` means an active TokenGauge entitlement is required. A ChatGPT plan label never substitutes for this entitlement.
3. Public counts are floors, not exact brittle marketing constants: `publicTips.length >= 12` and `proTips.length >= 100`. Product copy should render counts from the catalog rather than hard-code “six” or “12.”
4. A method is counted once only when it has a unique intervention and observable outcome. Provider-specific instructions belong under one canonical method unless the intervention itself materially differs.
5. Every free method must have an experiment support state: `supported`, `guided-only`, or `not-supported`. For the stated launch requirement, all 12 public methods should be `supported`.
6. The free comparison capability may remain generic. Pro should monetize maintained method content, valid adapters, richer fixtures/history, and expert workflow—not the mere ability to type two prompts.

## 3. Building a defensible 12 + 100 catalog

### Do not count the raw research headings as inventory

The 110 headings in research passes 04 and 05 are a strong source pool, but the overlap means there is no demonstrated path yet to **12 free plus 100 paid distinct cards**. Before publishing “100+,” create a canonical registry with:

- stable canonical ID;
- one-sentence intervention;
- observable outcome;
- provider/API scope and supported models;
- extra-cost class (`configuration-only`, `provider feature`, `extra inference`, `infrastructure`);
- canonical source(s) and last verified date;
- aliases/merged research IDs;
- evidence grade;
- caveat and failure mode;
- experiment adapter and fixture requirements;
- free/Pro entitlement.

Two entries that differ only in provider spelling or repeat the same manipulation should merge into one method with provider profiles. A reviewer should approve the merge map before the count is used in copy. The current 33 cards may be seeds in that registry, not an additive set on top of the 110 research headings, because many are already represented there.

### Free-set selection criteria

Pick 12 rather than the bare minimum of 10 because the current onboarding already gestures at 12 and a dozen supports category breadth. Each free method should score well on all of these criteria:

1. **Immediate value:** useful without buying another TokenGauge feature.
2. **Low setup burden:** a customer can supply a small fixture in under five minutes.
3. **Broad relevance:** applicable to a substantial segment of API builders, not one narrow provider edge case.
4. **Observable delta:** the intervention produces a measurable request/configuration difference.
5. **Quality checkability:** the user can predeclare a rubric or expected output.
6. **Lab compatibility:** TokenGauge can actually apply the intervention, not merely paste its prose into a system message.
7. **Category breadth:** prompt, output/reasoning, caching, schema/tools, and measurement should all be represented.
8. **Honest cost story:** “free” must not conceal an extra compressor/model/tool bill. Connected-account usage should be disclosed.
9. **Durable evidence:** current first-party documentation or a clearly labeled test protocol, with volatile numeric claims kept out of the title.
10. **Natural upgrade path:** the free method demonstrates the workflow while Pro provides deeper variants, provider profiles, or scaled experiment design.

### Recommended public twelve

These are good candidates from the existing research, but they must not be labeled lab-supported until the named adapter exists.

| Free candidate | Research ID | Required experiment mode |
|---|---|---|
| State each instruction once | PD-01 | Prompt-diff paired benchmark |
| Ablate examples one at a time | PD-02 | Prompt-diff paired benchmark over multiple fixtures |
| Demonstrate concise outputs | PD-03 | Prompt-diff benchmark with a completeness rubric |
| Put reusable prefix first | PD-04 / PC-01 | Controlled cold/warm cache sequence |
| Use low response verbosity | OC-01 | Two actual verbosity settings |
| Use a task-sized output ceiling | OC-02 | Two verified output-limit settings plus truncation tracking |
| Lower reasoning effort on routine work | OC-04 | Two actual reasoning settings |
| Minimize the output schema | SO-03 | Structured-output schema comparison |
| Encode closed decisions as enums/IDs | SO-04 | Structured-output schema comparison |
| Expose only task-relevant tools | TL-01 | Tool-schema comparison |
| Make tool descriptions concise and precise | TL-05 | Tool-schema comparison with correct-tool scoring |
| Instrument cache misses | CA-06 / PC-15 | Repeated cache run with miss diagnostics |

This set intentionally demotes the current Batch card from the free lab launch set. Batch is valuable content, but the connected ChatGPT prompt lab does not submit a Batch API job and therefore cannot test it. Batch can remain a Pro/guided card until an actual API-backed Batch adapter exists.

## 4. Onboarding and test UX

### Recommended flow

1. **Browse before connecting.** Show all 12 free cards, source, caveat, experiment type, approximate number of model calls, and “No TokenGauge payment required.”
2. **Choose a method.** The card CTA should say “Set up a benchmark,” not “prove savings.” Open a method-specific form; do not drop every method into the same baseline/candidate textareas.
3. **Explain the connection before login.** State that the open-source third-party connection lets TokenGauge send model requests using access from the connected ChatGPT account, that requests may count against that account’s limits, and that this is not OpenAI API billing or a purchase of API credit.
4. **Declare success first.** Ask for the quality rubric, allowed regression, fixtures, and repeat count before generating. Default to at least three paired repeats per fixture and call that a practical trial floor, not statistical proof.
5. **Preview the request plan.** Show arms, changed variable, model(s), reasoning/verbosity/output settings, call count, cache order, and what will be retained. Disable Run when the selected method’s required variable is unchanged.
6. **Judge quality before revealing the token winner.** Present outputs as blind “Variant 1/2” where feasible, collect pass/fail or rubric scores, then reveal arm labels and token totals. This reduces the temptation to prefer the shorter answer automatically.
7. **Show an honest result.** Lead with `quality-passing / inconclusive / quality-failing`, then token delta. Do not show API dollars for connected-plan runs. Show the exact model identifier, run time, repeats, spread, failures, cache state, and unsupported metrics.
8. **Convert after demonstrated value.** The best upgrade moment is after a customer completes a valid free benchmark or tries to open a Pro adapter—not before they understand the lab.

### Important current UX corrections

- The current default task is about prompt-prefix stability regardless of selected method (`src/components/lab-workbench.tsx:14`). Each adapter needs a relevant example or an empty user fixture.
- Selecting a method replaces only candidate instructions (`src/components/lab-workbench.tsx:58-64`); it does not explain which variable will change.
- “Run randomized A/B test” should become “Run one paired trial” until repeats, fixtures, and quality gates exist (`src/components/lab-workbench.tsx:83`).
- Results show token counts and raw outputs but no quality judgment, latency, failures, cost components, or uncertainty (`src/components/lab-workbench.tsx:91-115`).
- The UI should say how many requests will occur before the user clicks Run. With the current 10-request/minute proxy allowance and two calls per pair, only five complete pairs fit in a window.

## 5. Method-benchmark validity

### Why the current lab does not validate most method claims

1. **Only instructions vary.** Both arms use the same task and model. A model-routing method requires different models; a reasoning method requires different effort values; a schema method requires different schemas; Batch requires different processing; and a cache method requires controlled repeated prefixes.
2. **The selected method prose is treated as a system instruction.** For example, telling a model to “Batch evaluations” does not create a Batch request. This tests whether the model talks differently, not whether the method saves tokens or money.
3. **Both arms force low reasoning and low verbosity** (`src/app/api/experiment/route.ts:64-70`). This erases the treatment for the current “lower reasoning effort” method and contaminates output-style comparisons.
4. **The declared 600-token output cap is not reliable in this transport.** The installed `@opencoredev/loginwithchatgpt-core` normalizer explicitly deletes `max_output_tokens` and `max_completion_tokens` for its ChatGPT-backed Codex endpoint (`node_modules/@opencoredev/loginwithchatgpt-core/dist/codex-transport.js:9-16,44-48`). The README claim that experiments have output limits should be removed until an end-to-end test proves an enforceable limit.
5. **There is one observation per arm.** Random order helps with simple order effects, but it does not estimate normal model variation (`src/app/api/experiment/route.ts:56-72`).
6. **Randomization is wrong for some methods.** Cache tests need declared cold/warm phases and controlled order, which the catalog itself acknowledges (`src/lib/catalog.ts:362-371`).
7. **No quality gate is collected.** The UI reminds customers to judge quality but still reports token totals without recording a pass/fail outcome.
8. **No model snapshot is recorded.** The database stores the submitted model string, not a returned dated model identifier, although the catalog recommends snapshot pinning.
9. **Failures disappear from the comparison.** If the second call fails, the endpoint returns an error and saves no attempt record. Cost/allowance consumed by the first arm is then absent from experiment history.
10. **The database lacks several displayed metrics.** The response contains cache read/write and reasoning tokens, while `experiments` persists only input/output/total for each arm (`src/lib/db.ts:54-67,188-216`).

### Required experiment architecture

Give every catalog method an `experimentType` and a server-owned adapter:

- `prompt_diff`: baseline/candidate instructions or examples;
- `model_route`: different model IDs with the same fixture and rubric;
- `request_config`: actual reasoning, verbosity, stop, or output settings;
- `cache_sequence`: cold call plus declared warm repeats with prefix identity recorded;
- `schema_diff`: actual structured-output or tool schemas;
- `context_diff`: controlled history/retrieval payloads;
- `processing_diff`: synchronous versus Batch/Flex with completion-time accounting;
- `guided_only`: no runnable connected-plan experiment; instructions and external measurement checklist only.

The server should construct the intervention from the method adapter. Customer-supplied text can fill fixtures, but it should not be the only proof that the chosen method was applied.

Minimum valid paired benchmark:

- one versioned fixture set;
- predeclared quality rubric and non-inferiority margin;
- at least three paired repeats per fixture for an exploratory result;
- blocked/randomized order when order is not itself the treatment;
- controlled order for cache and stateful methods;
- exact request settings and model IDs;
- latency, attempt count, provider usage fields, failures, retries, and cache state;
- quality result before a winner is declared;
- median and spread, not only one total;
- “inconclusive” when quality or sample requirements are not met.

For a statistically interpreted product experiment, three repeats are not enough. Estimate variance with a pilot, choose a minimum detectable effect, calculate sample size, and run to the predeclared stopping rule.

## 6. Conversion experiment validity

Do not A/B test the entitlement itself by giving some visitors fewer than 12 free methods. Keep the free product stable and test positioning.

Recommended first conversion experiment:

- **Eligibility:** connected free customers who have completed one valid free benchmark and have not started checkout.
- **Control copy:** “Unlock 100+ advanced methods and their benchmark recipes.”
- **Candidate copy:** “Turn this trial into a repeatable cost program: 100+ methods, provider-specific setups, and maintained test recipes.”
- **Assignment:** deterministic account-level assignment, retained across sessions; anonymous pre-login views should not be mixed into the post-benchmark analysis.
- **Primary metric:** completed paid checkout divided by eligible upgrade-panel views.
- **Secondary metrics:** checkout start, Pro library open, second benchmark completion.
- **Guardrails:** disconnect rate, refund rate, lab error rate, and the share of customers who misidentify connected-plan tokens as API dollars in a short comprehension prompt.
- **Analysis:** predeclare duration/sample size and one primary metric; do not stop when a daily result first looks favorable. Report absolute and relative lift with an interval.

Only log the minimum events needed: experiment ID/version, assigned variant, account-scoped opaque ID, timestamp, eligibility event, checkout start, checkout completion, and refund. Do not attach prompt/output content.

## 7. Retention and privacy expectations

### Current behavior versus stated behavior

| Data | Current implementation | Copy issue | Recommended expectation |
|---|---|---|---|
| ChatGPT session credentials | Encrypted session record with a renewable seven-day TTL; expired rows are deleted only when that exact key is read. Disconnect deletes the session. | “Up to seven days” sounds like a hard maximum; it is closer to seven days of inactivity, and physical cleanup is lazy. | Say “expires after seven days of inactivity,” add a scheduled purge within 24 hours of expiry, and test immediate disconnect deletion. |
| Account ID, name, email, plan label | Upserted into `users`; no expiry or deletion function. | Disconnect language can imply more deletion than occurs. | State that profile data remains until deletion/request or a defined inactive-account period. Add self-service deletion. |
| Prompts and outputs | Pass through TokenGauge and OpenAI; returned to the browser; not inserted into the TokenGauge experiment table. | “0 prompts stored” and “private” can be read as “never processed” or “seen only by me.” | Say “not saved to TokenGauge’s application database.” Confirm request bodies and upstream error bodies are not retained in logs/backups. Explain browser and OpenAI processing separately. |
| Experiment metrics | Model, strategy, timestamp, input/output/total tokens are stored indefinitely. | Notice says cache and reasoning totals are retained, but schema does not store them. No retention duration is named. | Either store the promised fields or narrow the notice. Default to 30 days unless a useful history UI justifies longer; offer delete/export. |
| Payment/entitlement data | Stripe IDs and entitlement rows have no expiry. | “May be retained” has no schedule. | Publish the operational/legal retention category and deletion handling; keep it separate from optional experiment history. |
| Rate-limit rows | TTL exists but cleanup is lazy. | Not disclosed, though low sensitivity. | Periodically purge expired key-value rows. |

Additional expectations:

1. Do not apply OpenAI API data-retention statements to the connected ChatGPT-account flow. They are different product paths. Link the relevant ChatGPT terms/data controls for the account connection, and link API data controls only for a future API-key mode.
2. “Not stored” must cover application database, structured logs, error reporting, reverse-proxy body logs, backups, and analytics payloads. Test each path with a unique marker.
3. Results are visible in the current browser response. Explain that customers should copy what they need before leaving if no history is kept.
4. Decide whether experiment history is a paid feature. If no customer can retrieve it, retaining rows provides little product value and should be minimized.
5. Provide a real support/deletion link before launch; “once published” is not an actionable control (`src/app/privacy/page.tsx:13`).

## 8. ChatGPT plan versus API pricing

The product uses two different cost contexts and must never blend them:

1. **Calculator/rate directory:** estimates an API invoice from provider-published API prices. Official OpenAI API documentation uses API keys, API billing/credits, usage reporting, and per-token or other API price units: [API quickstart](https://platform.openai.com/docs/quickstart), [API pricing](https://developers.openai.com/api/docs/pricing), and [Usage/Costs API](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage).
2. **Connected-account lab:** uses a third-party open-source “Login with ChatGPT” integration and the connected account’s available model access. It reports token usage, but those tokens are **not an API invoice** and must not be multiplied by the rate directory to claim money saved. ChatGPT plans have their own plan descriptions: [ChatGPT pricing documentation](https://learn.chatgpt.com/docs/pricing).
3. **TokenGauge £9 payment:** buys TokenGauge content/workflow access only. It includes neither OpenAI API credits nor a ChatGPT plan.

The official OpenAI pages above establish separate API-key/billing and ChatGPT-plan product surfaces. The more specific claim that this third-party library’s requests “use your own ChatGPT plan” comes from that library, not from the OpenAI API docs. TokenGauge should present it as implementation behavior of the independent integration, avoid an official-OpenAI tone, and keep the “not affiliated or endorsed” statement next to connection copy—not only in the footer.

### Claims that currently overpromise or confuse

| Claim/location | Assessment | Replacement/action |
|---|---|---|
| “33 sourced optimization cards: 6 free and 27…” (`README.md:21`) | Accurate for the current code, but fails the intended 10+/100+ product and will become stale. | Render/catalog-generate the counts; do not launch the new promise until tests prove it. |
| “The 12 open methods are testable for free” (`src/app/lab/page.tsx:27`) | False now: six are free, and the generic prompt lab cannot validly test most of them. | “Connect to run supported free benchmarks.” Render the count and support status. |
| “Test any free strategy” / “Pro unlocks experiments for the complete catalogue” (`src/app/lab/page.tsx:21`) | Overbroad. Many cards require adapters that do not exist. | “Run supported paired benchmarks; other cards include guided measurement plans.” |
| “Randomized paired A/B experiments with request-size, model, output, and rate limits” (`README.md:24`) | Partly true. Request size/model/rate checks exist; the output cap is stripped by the installed transport, and a single pair is not a robust A/B result. | “Exploratory paired prompt trials with request-size, model, and rate checks.” Restore stronger copy only after end-to-end adapter tests. |
| “Private A/B lab” (`README.md:3`, page metadata) | Ambiguous because prompt/output content traverses TokenGauge and OpenAI. | “Prompt-retention-minimized paired benchmark” or “Connected-account benchmark.” Explain the data path adjacent to the CTA. |
| “0 prompts stored” / “prompts and outputs discarded” (`README.md:15`; `src/app/page.tsx:85`) | Defensible only when narrowed to the TokenGauge application database; prompts still traverse services and may be present transiently. | “Prompt and output text is not saved to TokenGauge’s application database.” |
| “Usage retained” (`src/app/page.tsx:85`) | Too vague and inconsistent with the privacy schema claim. | Name the exact fields and retention period. |
| “Authentication credentials … kept … up to seven days” (`src/app/privacy/page.tsx:10`) | Not a hard maximum due to renewable TTL and lazy cleanup. | “Encrypted session credentials expire after seven days of inactivity; disconnect deletes the active session. Expired records are purged within [period].” |
| “We retain … reasoning/cache token totals” (`src/app/privacy/page.tsx:11`) | False for the current database schema. | Store those fields or remove them from the notice. |
| “Founding access … [includes] the A/B lab” (`src/app/terms/page.tsx:11`) | Conflicts with free lab access described elsewhere. | “Founding access adds Pro method cards and Pro lab presets; supported free benchmarks remain available without a TokenGauge payment.” |
| “Connect my ChatGPT plan” (`src/components/account-panel.tsx:46`) | Can sound like an official OpenAI integration and can blur plan access with API billing. | “Connect ChatGPT account for lab runs,” followed by independent-integration and plan-limit disclosure. |
| “No API credits included. Lab requests use your connected ChatGPT plan…” (`src/app/page.tsx:91`) | Directionally good, but needs the independent third-party qualifier and a statement that token totals are not dollar charges. | Use the copy below. |
| Static mirror says 33 methods / 27 more (`docs/index.html`) | Will conflict with the 12 + 100 product unless updated in the same release. | Generate mirror counts/content from the canonical registry or add a release-blocking parity check. |

The calculator’s current separation—“API billing is separate from … consumer-plan quotas” (`src/app/page.tsx:52`)—is the right model. Keep that language adjacent to every API estimate, and never carry an API dollar rate into lab results.

## 9. Recommended conversion copy

### Home / pricing

> **12 methods free. 100+ advanced methods with founding access.**
> Read every free method and run its supported paired benchmark before you buy. Founding access adds the complete maintained catalog, provider-specific setups, and Pro benchmark recipes for a one-time £9 payment.

> TokenGauge access includes no OpenAI API credit or ChatGPT subscription. Connected-account lab runs may count against your ChatGPT account’s limits. Lab token totals are not API charges, and savings are never guaranteed.

### Connection disclosure

> **Connect a ChatGPT account for lab runs**
> TokenGauge uses an independent open-source connection to send the benchmark prompts you choose and return the outputs to this browser. Requests may count against the connected account’s limits. Prompt and output text is not saved to TokenGauge’s application database. TokenGauge is not affiliated with or endorsed by OpenAI.

Button: **Connect ChatGPT account**

### Free-to-Pro upgrade panel

> **You tested the method. Now build the operating system.**
> Unlock 100+ additional methods, maintained provider notes, and method-specific benchmark recipes. £9 once; no recurring TokenGauge charge.

Button: **Unlock 100+ Pro methods — £9 once**

### Lab result note

> This connected-account result reports tokens, not an API invoice. Treat it as exploratory until the candidate passes your declared quality margin across the planned fixtures and repeats.

### Avoid

- “Pay for itself,” “guaranteed saving,” or any single-test ROI claim.
- “Free to run” when a model request consumes plan allowance.
- “Private” without the exact data path.
- “Official OpenAI login,” “OpenAI plan integration,” or language implying endorsement.
- Converting connected-plan token counts to API dollars.

## 10. Concrete acceptance tests

These are release gates, not optional follow-up ideas.

### Catalog and copy

1. `publicTips.length >= 12`, `proTips.length >= 100`, and `tokenTips.length >= 112`.
2. Every ID is unique; every card has source, last-verified date, evidence grade, provider scope, caveat, experiment type, and support status.
3. A checked-in alias/merge map proves that overlapping research IDs do not inflate the count; no alias may appear as a separate sellable method.
4. All UI and static-mirror counts are catalog-derived. A parity test fails when rendered counts differ from the registry.
5. Every free card is visible without login and has a working source link.
6. Every free card has `experimentSupport === "supported"` for the stated launch promise; otherwise launch copy must state the smaller supported count.

### Entitlements and delivery

7. Anonymous library response contains all free cards and no Pro card body in HTML/RSC data.
8. Connected free response contains the same free cards and free presets; a paid `strategyId` submitted to `/api/experiment` returns 403 before a model request occurs.
9. Active Pro receives all free and Pro cards/presets; a refunded/revoked account immediately returns to the free set.
10. ChatGPT plan strings (`free`, `plus`, `pro`, unknown, absent) never change TokenGauge Pro status.
11. Decide and test generic editing: either a free method ID may carry arbitrary candidate text and copy calls the tool generic, or the server rejects a manifest that does not match the selected adapter.
12. Decide and test `/api/chatgpt/responses`: it is either unavailable as a public product route or explicitly documented, rate-limited, and included in connected-account consent.
13. Public-repository positioning test: no hosted copy claims the Pro method text is unavailable outside the app if it remains in the MIT source tree.

### Method-specific benchmark behavior

14. Selecting a method produces a server-owned experiment manifest naming the one intended changed variable; unchanged or multi-variable manifests are rejected with a useful message.
15. Reasoning method: captured requests prove baseline and candidate use different configured effort values.
16. Verbosity method: captured requests prove different verbosity values.
17. Output-ceiling method: an end-to-end long-output fixture proves the upstream honors different limits. If the transport removes the field, the method is marked unsupported.
18. Model-routing method: captured requests use the two declared available model IDs and report each separately.
19. Cache-order method: fixture runs cold plus warm repeats; records prefix fingerprint, order, cached reads/writes, and excludes random order where warmth is the treatment.
20. Batch method: only marked supported when the experiment creates and completes a real Batch job and includes elapsed time. A synchronous prompt containing the word “Batch” fails this test.
21. Schema/tool methods: captured request bodies prove the actual schema/tool payload differs as declared; scoring includes conformance/correct-tool outcomes.
22. Prompt methods: baseline and candidate share the exact task fixture and all non-treatment settings.
23. Default exploratory run uses at least three paired repeats per fixture, reports median and spread, and never labels one pair statistically significant.
24. Arm order is balanced/randomized for non-stateful methods with a recorded assignment/seed; cache/stateful adapters use their declared controlled order.
25. Exact returned model identifier, settings, start time, latency, usage breakdown, arm order, attempts, and failures are recorded.
26. A result cannot say “winner” until the customer records a quality outcome and the predeclared margin passes; otherwise it says “inconclusive” or “quality failed.”
27. If arm two fails after arm one succeeds, the consumed first attempt remains recorded and attributed. Retrying does not erase earlier usage.
28. Lab result pages never apply API price cards to connected-plan token counts.

### Retention and privacy

29. Submit unique markers in baseline, candidate, and output; assert none appears in application DB, analytics events, structured logs, reverse-proxy body logs, or backups covered by the retention claim.
30. Experiment responses have `Cache-Control: no-store`; browser history/reload behavior matches the displayed warning.
31. Disconnect deletes the active session row immediately and clears the cookie, but does not claim to delete profile/payment/history data.
32. A scheduled cleanup removes expired session and rate-limit rows within the published period, without requiring the expired key to be read.
33. Experiment rows auto-delete at the published age; “Delete my TokenGauge data” removes profile and experiments while preserving only legally required payment records under a documented rule.
34. Privacy copy is schema-tested: the enumerated retained usage fields exactly match database columns.
35. Consent copy names TokenGauge, the independent third-party integration, OpenAI processing, connected-account limit consumption, text-retention behavior, and disconnection behavior before login.

### Conversion experiment

36. Variant assignment is deterministic per eligible account and does not change across devices/sessions after login.
37. Eligibility fires only after a completed, method-valid free benchmark; repeated page views do not create repeated assignments.
38. Only the predeclared primary conversion metric determines the decision; sample size and end date are recorded before exposure starts.
39. Event payload inspection proves that prompts, outputs, names, email addresses, and raw account IDs are absent.
40. Refund, disconnect, comprehension, and lab-error guardrails are reported beside conversion lift.

## Recommended release sequence

1. Reconcile the registry and prove 12 distinct free plus 100 distinct Pro methods after deduplication.
2. Define the entitlement contract and update contradictory counts/copy across the app, README, terms, privacy notice, and static mirror.
3. Build server-owned experiment adapters for the 12 free methods; rename the current feature to paired prompt trial until those adapters pass.
4. Align stored experiment fields and retention behavior with the privacy notice; add deletion and scheduled expiry cleanup.
5. Run method-level end-to-end tests, especially output caps, reasoning/verbosity variation, cache sequences, failures, and plan-versus-API result labeling.
6. Only then start the post-benchmark conversion-copy experiment.

The durable product position is strong: **free evidence and honest trials establish trust; Pro sells breadth, maintained implementation detail, and valid measurement workflows.** The current repository has the beginnings of that model, but the inventory, experiment adapters, and retention claims need to catch up before the 12 + 100 promise is credible.
