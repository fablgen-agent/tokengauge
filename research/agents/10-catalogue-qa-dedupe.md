# TokenGauge catalogue QA and deduplication pass

Review date: **2026-08-15 UTC**
Scope: the latest working-tree versions of `src/lib/catalog.ts`, `src/data/research-methods.json`, `scripts/compile-method-catalogue.mjs`, the method reports 04–07, the free-lab review in report 08, the implemented pricing snapshot/calculator, and anonymous browser delivery. No application code was changed.

## Decision

**The arithmetic target passes, but the distinct-method and “testable free methods” claims do not yet pass.**

- The current build contains exactly **120 cards = 12 Free + 108 Pro**: 39 hand-authored cards (12 Free, 27 Pro) plus 81 compiled, all-Pro cards. The existing catalogue and pricing tests pass under the repository-required Node 24 runtime, and the production build succeeds.
- There are at least **eight high-confidence semantic duplicates** still sold as separate Pro cards. Removing only those leaves **112 cards = 12 Free + 100 Pro**. That is the best-case floor, with no room for another duplicate, filler card, or invalid source.
- Applying report 08's stricter rule that provider spellings of the same intervention are profiles, not separate methods, also merges the reasoning-effort and server-compaction clusters. That leaves at most **108 canonical cards = 12 Free + 96 Pro** before removing evaluation-only/filler entries.
- The current lab provides a special request-setting branch for three Free IDs, but no Free method currently produces a valid single-variable benchmark by default. Two settings reach the request (`lower-reasoning-effort`, `low-verbosity`) while prompt text changes at the same time; `cap-output` is deleted by the installed transport; the other nine remain generic prompt trials rather than method adapters.
- Source quality is strong at the domain level: all 120 displayed links go to first-party provider documentation or original papers. Source completeness is weak: the compiler discards secondary sources, all 39 hand-authored cards lack provider scope, and no card has a `lastVerified` date.
- Pricing has broad raw coverage—49 rate rows across all nine intended providers, freshly source-checked—but the calculator does not enforce context tiers, has no OpenAI `>272K` rows, and makes both sides of the DeepSeek transition effective at the exact cutover instant.
- Anonymous runtime delivery is sound in the tested production build: distinctive Pro bodies were absent from `/`, `/library`, and `/lab`. The Pro text is nevertheless fully available in the public MIT-licensed repository, so the product can sell hosted delivery and maintained workflows, not textual secrecy.

## Audit scorecard

| Area | Result | Evidence |
| --- | --- | --- |
| Raw inventory | **Pass** | 39 core + 81 compiled = 120; 12 Free + 108 Pro. `catalog.test.ts` passes. |
| ID uniqueness | **Pass, insufficient** | String IDs are unique, but semantic interventions are not. |
| Distinct inventory | **Fail** | Eight certain duplicate aliases reduce Pro to 100; consistent provider-profile canonicalization reduces it below 100. |
| Free access count | **Pass numerically** | All 12 Free cards are hand-authored. The compiler now marks all 81 research cards Pro. |
| Free lab testability | **Fail** | Zero default experiments meet report 08's minimum valid paired-benchmark contract. |
| Evidence quality | **Pass on origin** | 102 first-party provider links and 18 original-paper links; no secondary blogs. |
| Source-to-claim completeness | **Fail** | One-link schema and first-link compilation lose 21 citations from 18 compiled cards. |
| Provider coverage | **Fail for methods** | Pricing covers nine providers; methods directly cover OpenAI, Anthropic, Google/Gemini and Bedrock, with no xAI, DeepSeek, Kimi, Qwen, Mistral, or Cohere method profile. |
| Freshness model | **Fail** | No method has `lastVerified`, model/API version, or effective interval. |
| Anonymous browser exposure | **Pass at runtime** | Production responses contained Free data and counts but no sampled Pro bodies. |
| Public-source exclusivity | **Fail if promised** | All Pro copy is in the public MIT source tree. |
| Pricing row/source freshness | **Pass with limitations** | 49 rows checked against 16 official pages on 2026-08-15; the verifier does not validate every billable field. |
| Pricing calculation correctness | **Fail at tier edges** | Threshold metadata is ignored by `calculateCostUsd`; OpenAI long-context rows are absent. |

## 1. Exact semantic duplicates

The following are not merely similar titles. Each pair applies the same principal manipulation and observes the same outcome. The second ID should become an alias/source reference, not a sellable card.

| Priority | Canonical survivor | Merge/remove as sellable ID | Why it is the same intervention |
| --- | --- | --- | --- |
| P0 | `cache-key-partition` | `research-pc-08` | Both derive and reuse a stable, low-cardinality OpenAI `prompt_cache_key` for one stable prefix family and measure hit rate. |
| P0 | `research-pc-15` | `research-ca-06` | Both instrument cache read/write/uncached fields, alert on misses, and diagnose serialized-prefix divergence. Report 08 already called out PC-15/CA-06 as overlap. |
| P0 | `research-ctx-10` | `research-pd-09` | Both are the Selective Context paper's low-information-token filtering method. |
| P0 | `research-ctx-11` | `research-pd-06` | Both are LLMLingua budget-controlled prompt compression using the same paper and intervention. |
| P0 | `research-ctx-12` | `research-pd-07` | Both are question-aware LongLLMLingua ranking/compression using the same paper and intervention. |
| P0 | `structured-output-retries` | `research-so-01` | Both replace “return JSON” prose with native Structured Outputs and measure malformed/retry cost. |
| P0 | `limit-initial-tools` | `research-tl-01` | Both expose only task-relevant tools initially and measure schema tokens plus correct-tool selection. |
| P0 | `combine-sequential-tools` | `research-tl-09` | Both collapse a predictable multi-tool chain into one programmatic/application operation to remove model round trips. |

The compiler should exclude those eight research IDs or, preferably, consume a checked-in alias registry. Its current `methods.length === 81` assertion proves only that an exclusion list happens to produce a number; it does not prove semantic uniqueness.

After those merges:

| Inventory view | Free | Pro | Total |
| --- | ---: | ---: | ---: |
| Current raw cards | 12 | 108 | 120 |
| After eight certain merges | 12 | 100 | 112 |
| After consistent provider-profile merges below | 12 | at most 96 | at most 108 |

### Provider-profile duplicates that need canonicalization

Report 08 says that entries differing only by provider spelling should be one method with provider profiles (`08-free-ab-product-review.md:64-80`). Applying that rule consistently creates two more clusters:

- Keep `lower-reasoning-effort` as the canonical intervention; merge `research-oc-05`, `research-oc-06`, and `research-oc-07` into Claude and Gemini profiles. In particular, OC-06 and OC-07 change the same Gemini `thinking_budget` parameter; zero versus a small positive value is one tuning ladder, not two products.
- Keep `server-compaction` as the canonical intervention; merge `research-cmp-04` as the Anthropic provider profile. The provider APIs and failure modes differ, but the sellable intervention is still “enable server-side compaction at a measured long-session threshold.”

Two lower-confidence overlaps should receive a reviewer decision and a one-sentence `intervention` field before launch:

- `deduplicate-instructions` and `one-line-success-criteria`: the latter currently reads like a narrower rewording of prompt-rule deduplication. Retain both only if fixtures prove distinct transformations (duplicate removal versus replacement of subjective style adjectives with one objective criterion).
- `compact-choice-labels` and `research-so-06`: both replace generated prose/records with compact identifiers hydrated in code. They can remain separate only if the first is explicitly scoped to one closed decision and the second to selecting existing application records.

## 2. Filler and classification issues

These cards should not be counted as token/cost-saving interventions in their current form:

- **Replace `directional-lean-prompts`.** It is a warning about interpreting an OpenAI sample, not a changed request, model, route, or architecture. Its action—reproduce the result—is evaluation guidance and cannot generate a candidate manifest.
- **Move `randomize-paired-order`, `repeat-nondeterministic-tests`, `declare-quality-margin`, and `pin-model-snapshots` to a benchmark-playbook section.** They are necessary experiment controls, but none independently reduces tokens or cost. Counting them as paid optimization methods inflates inventory with QA procedure.
- **Mark `required-before-optional` guided/experimental until a capped-output fixture proves a saving.** Reordering content alone need not shorten an uncapped response; its primary benefit is truncation resilience.
- **Keep `fixed-response-budget` distinct from `cap-output` only as a soft prompt lever versus a hard API guardrail.** The UI must state that difference; otherwise the two read as rewording.

A safe product count should include only cards with a unique one-sentence intervention and an observable changed variable. Benchmark hygiene can remain valuable Pro content without being part of the “100 optimization methods” denominator.

## 3. Exact replacement queue

Do not restore the count by inventing more prose variants. Reports 06 and 07 already contain unused, materially different work.

Recommended first eight replacements for the eight certain duplicates:

1. `MRE-002` — learned weak/strong model router.
2. `MRE-003` — confidence-gated cascade.
3. `MRE-006` — managed Bedrock prompt routing.
4. `MRE-020` — Spot GPU capacity for fault-tolerant offline work.
5. `MRE-026` — semantic answer cache.
6. `MRE-041` — fine-tune a smaller model for a fixed task.
7. `MRE-045` — PagedAttention and continuous batching.
8. `MRE-052` — idempotency ledger and in-flight deduplication.

Reserve replacements if provider-profile and evaluation-control merges are also applied: `MRE-004`, `MRE-010`, `MRE-043`, `MRE-044`, `MRE-046`, and `MRE-051`. Each requires the same canonical schema and must be checked against the retained catalogue before insertion.

Provider breadth should be added as **profiles on canonical methods**, not as count inflation. At minimum ingest the compatibility, price-rule, and caveat details from:

- xAI: `PS-XA-01` through `PS-XA-05`;
- DeepSeek: `PS-DS-01` through `PS-DS-05`;
- Kimi: `PS-KI-01` through `PS-KI-05`;
- Qwen: `PS-QW-01` through `PS-QW-06`;
- Mistral: `PS-MI-01` through `PS-MI-06`;
- Cohere: `PS-CO-01` through `PS-CO-06`.

Where a report-07 item is genuinely a new lever—Cohere billed-unit accounting (`PS-CO-01`) is a good example—it can be a new method. Where it merely supplies another cache key, effort value, Batch discount, or long-context threshold, it belongs under the existing canonical intervention.

## 4. Free-method lab testability

The route has three ID-specific setting branches, but it still sends `baselineInstructions` and `candidateInstructions` from separate textareas for every test. Therefore even the settings tests change prompt text and the setting together (`route.ts:33-47,74-87`; `lab-workbench.tsx:14-16,63-83`). No server-owned manifest asserts one changed variable.

| Free ID(s) | Current execution | QA classification |
| --- | --- | --- |
| `lower-reasoning-effort`, `low-verbosity` | The intended request setting differs, but candidate system text also differs from baseline; one run per arm and no quality gate. | **Adapter present but confounded; not a valid method benchmark.** |
| `cap-output` | Route requests 600 versus 300 tokens, but the installed ChatGPT transport deletes both `max_output_tokens` and `max_completion_tokens`. Prompt text also differs. | **Not supported end to end.** |
| `no-preamble-or-restatement` | Candidate text directly applies a no-preamble instruction. The default baseline also asks for a detailed answer, so more than the target feature changes. | **Exploratory prompt diff only.** |
| `deduplicate-instructions`, `remove-example-one-at-time`, `concise-example-length-target`, `required-before-optional`, `compact-choice-labels`, `one-line-success-criteria`, `fixed-response-budget` | The selected card's prose is pasted as a system instruction; the server does not remove duplicate text/examples, supply an example, create a choice map, define required fields, or instantiate a concrete budget. | **Guided-only, despite UI claiming testable.** |
| `directional-lean-prompts` | Past-study interpretation text is pasted into the candidate prompt; there is no optimization treatment. | **Not a runnable method.** |

This means the current honest support count is:

- **2/12** with a method-specific request-setting branch, both confounded;
- **1/12** with a direct prompt instruction that approximates the card, also confounded;
- **0/12** meeting the report-08 minimum valid paired-benchmark requirements.

The same issue is larger for Pro: all 108 IDs are offered in the selector, but there are no server adapters for model routing, Batch/Flex, caching, retrieval, tools, schemas, multimodal preprocessing, compaction, or retries. “Pro unlocks experiments for the complete catalogue” is false; most Pro entries are guided measurement plans at best.

Required immediate classification:

- `lower-reasoning-effort`, `low-verbosity`: `experimentType: request_config`, `experimentSupport: supported` only after identical prompt enforcement and repeat/quality support.
- `cap-output`: `experimentType: request_config`, `experimentSupport: not-supported` until an upstream capture proves the limit survives transport.
- `no-preamble-or-restatement`: `experimentType: prompt_diff`, initially `guided-only` until a server-owned baseline/candidate pair and fixture exist.
- Other Free IDs: `guided-only` or `not-supported` until their adapters construct the actual intervention.

## 5. Evidence and source-to-claim audit

### What is strong

- Every displayed source is HTTPS.
- The 120 cards use 52 unique source URLs.
- 102 cards point to first-party OpenAI, Anthropic, Google, or AWS documentation; 18 point to original arXiv papers. Primary/original-source quality is therefore strong.
- Evidence grades are present and use the expected three-value vocabulary.

### What breaks traceability

1. **The schema permits only one source.** Report 08 requires canonical source(s), provider scope, aliases, and `lastVerified`, but `TokenTip` has only one `source` and optional `providers`; it has no verification or alias fields.
2. **The compiler deliberately takes only the first link.** `sourceMatch` captures one URL from `Source`/`Sources` and writes no remaining citations (`compile-method-catalogue.mjs:55-75`).
3. **Eighteen included methods lose 21 secondary primary-source citations:** `research-so-01`, `research-so-03`, `research-so-07`, `research-tl-01`, `research-tl-02`, `research-tl-03`, `research-tl-05`, `research-tl-07`, `research-tl-09`, `research-mm-02`, `research-mm-03`, `research-ca-04`, `research-ca-06`, `research-er-01`, `research-er-02`, `research-er-04`, `research-er-06`, and `research-er-07`.
4. **Several other cross-provider cards make official claims broader than their one retained source:** `research-pc-06`, `research-pc-07`, `research-pc-13`, `research-pc-15`, `research-pc-16`, and `research-ret-05`. Provider portability should be graded derived unless every provider-specific assertion has its own source.
5. **All 39 hand-authored cards omit `providers`.** Their source mix is 38 OpenAI links and one Google link, so the UI cannot distinguish OpenAI-only facts from portable engineering advice.
6. **All 120 cards omit `lastVerified`.** Numeric/model-specific cards can become false while tests remain green. High-risk examples include `cache-minimum-prefix`, `batch-offline-work`, `cache-key-partition`, `cache-break-even`, `directional-lean-prompts`, `avoid-long-context-premium`, `limit-initial-tools`, `research-pc-04`, `research-pc-06`, `research-pc-07`, `research-pc-11`, `research-pc-12`, `research-oc-05`, `research-oc-06`, `research-oc-07`, `research-mm-01`, `research-mm-04`, and `research-mm-05`.
7. **There is no method-source verifier.** The pricing pipeline records URL, status, hash, timestamp, and checked rows; the method catalogue has no equivalent artifact.

The fix is a `sources[]` structure with provider/model/API scope, claim keys, verification date, and optional effective interval. “Official” should mean the displayed claim is directly supported for that scope; cross-provider extrapolation should be `derived` even when the underlying mechanism is documented for one provider.

## 6. Provider coverage

The pricing snapshot supports OpenAI, Anthropic, Google, xAI, DeepSeek, Kimi, Qwen, Mistral, and Cohere. The method catalogue does not match that promise:

- compiled provider strings mention OpenAI on 33 cards, Anthropic on 37, Gemini on 30, and Bedrock on 8;
- compiled provider strings mention xAI, DeepSeek, Kimi, Qwen, Mistral, and Cohere on **zero** cards;
- core cards expose no provider scope at all.

This is not merely a cosmetic gap. Report 07 documents incompatible cache minimums, TTLs, context-tier comparison operators, Batch discounts, reasoning controls, regional multipliers, and billed-unit semantics. A user can calculate a Qwen or Cohere rate but receives no corresponding method profile warning them not to import OpenAI semantics.

Acceptance should require one canonical method registry plus provider profiles keyed by provider, exact model/API surface, region, service tier, and effective date. A profile can be absent or `not_documented`; it must never silently inherit another provider's setting.

## 7. Pricing-data QA

### Positive findings

- `pricing-snapshot.json` contains 49 rows across the intended nine providers.
- `observedAt` is 2026-08-15 and `pricing-source-check.json` records zero fetch/needle errors across 16 official pages.
- Current OpenAI short-context Terra and Luna prices have been corrected to the report-01 live values.
- Null cache prices remain null and display as a dash rather than zero.

### Release-blocking calculation issues

1. **OpenAI long-context rates are absent.** The only three OpenAI IDs end at `maxInputTokensInclusive: 272000`; there is no row for `>272000`, even though the same snapshot says each model has a 1.05M context window. Report 01 says input/cache/write double and output rises 1.5× for the entire long request. The calculator accepts any nonnegative input count and will continue pricing 300K+ at the short row.
2. **Threshold metadata is never enforced.** Seventeen rows carry min/max boundary fields, but `calculateCostUsd` receives a preselected row and ignores them. Users may select short xAI/Gemini/Qwen tiers for long inputs or long tiers for short inputs. Either select the band automatically from provider/model/input count or reject an incompatible row.
3. **The effective interval is closed at both ends.** `timestamp >= starts && timestamp <= ends` makes all six old/new DeepSeek Flash/Pro rows selectable at exactly `2026-08-16T16:00:00Z`. Use half-open intervals (`start <= t < end`) and test the exact boundary.
4. **DeepSeek's future schedule needs post-activation verification.** The source reports explicitly require rechecking after launch. Store daily UTC peak windows structurally; an effective date alone cannot choose peak versus off-peak after activation.
5. **Gemini introductory rows have an expiry but no successor.** `gemini-3.7-flash` and `gemini-3.6-flash` will disappear from the calculator after 2026-12-31 rather than switch to a verified standard row.
6. **Cohere Command A remains a quarantinable conflict.** `cohere:command-a-03-2025:standard` uses the dedicated Command A price page, while report 03 documents that page's conflicting A+ model-ID snippet. Store both the price provenance and catalogue-ID provenance plus a manual-review flag; the current one-URL row cannot express the conflict.
7. **The verifier covers only three numeric fields.** It checks model ID/label plus input, cache-read, and output. It does not validate cache-write, one-hour write, explicit-cache read/storage, context limits, tier thresholds, effective dates, region, or service tier. It explicitly skips Mistral cached-input verification. A nearby occurrence of the same number can satisfy the current wide source window without proving the correct table cell.
8. **The savings calculator is a steady-state read-only scenario, not full cache economics.** It ignores cache writes/storage, tool fees, retries, and quality failures. The caveat admits this, but a generic “Potential saving” result still overstates low-reuse cache scenarios. Either ask for writes/reuse/storage or label the calculation “warm cache-read scenario.”

## 8. Paid-content browser exposure

Runtime gating passed a production-build smoke test:

- production build succeeded under Node 24;
- anonymous GETs to `/`, `/library`, and `/lab` were captured;
- sampled distinctive Pro bodies (`research-pc-02`, `research-pc-04`, `research-so-01`, `research-tl-09`) appeared in none of the three HTML/RSC responses;
- `library/page.tsx` filters to `publicTips` on the server, and the client library component imports catalogue types only.

That supports the narrow copy: **“Pro cards are delivered to signed-in Pro accounts in the hosted app.”**

It does not support secrecy claims. `src/lib/catalog.ts`, `src/data/research-methods.json`, reports 04/05, and the compiler contain the complete copy in an MIT-licensed public repository. Continue to position Pro as maintained curation, provider profiles, adapters, workflows, and update cadence. Add a browser-response regression test because a future refactor that passes `tokenTips` into a client boundary before filtering would expose the payload even if CSS hides it.

## 9. Prioritized exact-ID action list

### P0 — required before inventory claims

1. Merge the eight exact duplicate IDs listed in section 1 and add aliases.
2. Replace `directional-lean-prompts` with a real Free intervention; do not merely rename it.
3. Mark `cap-output` not-supported until an upstream request capture proves the limit survives transport.
4. Mark `deduplicate-instructions`, `remove-example-one-at-time`, `concise-example-length-target`, `required-before-optional`, `compact-choice-labels`, `one-line-success-criteria`, and `fixed-response-budget` guided-only until server-owned transformations/fixtures exist.
5. Stop offering all Pro IDs as runnable experiments. Default all compiled IDs to guided-only until an explicit adapter says otherwise.
6. Add OpenAI `>272K` price rows and enforce all model-band boundaries in calculator selection.
7. Fix the exact DeepSeek effective-time overlap.

### P1 — canonical integrity and evidence

1. Merge `research-oc-05`, `research-oc-06`, and `research-oc-07` under `lower-reasoning-effort` provider profiles.
2. Merge `research-cmp-04` under `server-compaction` as an Anthropic profile.
3. Resolve reviewer decisions for `deduplicate-instructions`/`one-line-success-criteria` and `compact-choice-labels`/`research-so-06`.
4. Move `randomize-paired-order`, `repeat-nondeterministic-tests`, `declare-quality-margin`, and `pin-model-snapshots` out of the optimization-method denominator.
5. Replace the compiler's numeric exclusion assertion with canonical-ID/alias validation and retain every source URL.
6. Add provider scope to all 39 core IDs and add report-07 profiles for the six missing pricing providers.
7. Add method-source verification with `lastVerified`, content hash, claim keys, and stale-age policy.
8. Quarantine `cohere:command-a-03-2025:standard` until dual provenance is represented.

### P2 — breadth after correctness

1. Fill open Pro slots from the report-06 replacement queue rather than prompt/output paraphrases.
2. Add real adapters in order of feasibility: prompt diff, request config, schema diff, model route, cache sequence, context diff, then processing diff.
3. Add cache-write/storage/reuse inputs to pricing scenarios and method economics.

## 10. Acceptance tests

### Catalogue identity and count

1. The registry has `canonicalId`, a one-sentence `intervention`, `aliases`, `access`, `providers`, `sources[]`, `lastVerified`, `experimentType`, and `experimentSupport` for every card.
2. `publicTips.length >= 12` and `proTips.length >= 100`; tests do not require brittle exact counts.
3. Every alias resolves to one canonical card and is absent from the sellable-card array.
4. The eight P0 duplicate pairs fail a test if both IDs reappear as cards.
5. A reviewer-approved semantic fixture asserts that provider profiles do not increase method count.
6. Evaluation controls are counted separately from optimization interventions.

### Evidence and freshness

7. Every displayed factual claim maps to at least one source entry; provider-specific claims map to that provider's primary source.
8. Compilation preserves all source links for the 18 currently truncated multi-source methods.
9. `official` is rejected for provider scopes not directly supported by a mapped source; portable inferences use `derived`.
10. Volatile cards fail CI when `lastVerified` exceeds the declared age or their source content hash changes without review.
11. All source URLs return a successful response, and anchors/claim needles are checked rather than URL status alone.

### Free and Pro lab

12. Every Free method has `experimentSupport === "supported"` before copy says all 12 are testable; otherwise copy renders the smaller supported count.
13. Selecting a supported method creates a server-owned manifest with exactly one changed variable and identical non-treatment prompt/config fields.
14. `lower-reasoning-effort` and `low-verbosity` captures prove only the intended setting differs; freeform candidate prose cannot introduce a second treatment.
15. `cap-output` uses a long-output fixture and captured upstream body/finish reason to prove two honored limits. Deletion by the transport makes the test fail and support remain false.
16. Prompt-ablation methods operate on a supplied baseline artifact: examples/rules are actually removed or replaced, not described to the model.
17. Choice/schema methods send actual enum/ID schemas and score invalid labels; they do not paste schema advice into a system prompt.
18. A minimum exploratory run uses at least three paired repeats per fixture, records failures, latency and usage, and requires a predeclared quality outcome before naming a winner.
19. Cache/stateful methods use controlled cold/warm order rather than random order.
20. A Pro method without an adapter is labeled guided-only and cannot be presented as a runnable experiment.

### Provider coverage

21. The registry has explicit profiles—or an explicit `not_documented` state—for all nine pricing providers on each relevant canonical method family.
22. Provider profiles key constraints by exact model/API surface, region, service tier, and effective interval; no fallback copies another provider's minimum, TTL, discount, or comparison operator.
23. At least one integration test covers a non-OpenAI profile from each of xAI, DeepSeek, Kimi, Qwen, Mistral, and Cohere.

### Pricing

24. Input `272000` selects OpenAI short; `272001` selects the verified long row and reprices the full request.
25. Exact boundary tests cover Gemini `>200K`, xAI `>=200K`, and Qwen 32K/256K semantics. Incompatible manually selected tiers are rejected.
26. At exactly `2026-08-16T16:00:00Z`, no expired DeepSeek standard row is selectable; post-launch verification is required before the new rows are treated as current.
27. Peak/off-peak DeepSeek selection uses structured UTC windows or is clearly a user-selected scenario, never an automatic current-price claim.
28. Introductory Gemini rows have a verified successor or a visible unavailable state before expiry.
29. The source verifier validates every non-null billable field and its table association, including Mistral's derived 10% cache rule with the separate official cache source.
30. The Cohere Command A row carries dual provenance and a conflict/manual-review flag.
31. A cache-savings scenario either includes writes, storage and reuse count or is labeled warm-read-only and excluded from general ROI claims.

### Delivery

32. Anonymous HTML and RSC responses for `/`, `/library`, and `/lab` contain all Free cards and no Pro title, summary, action, measurement, caveat, source label, or provider text.
33. Connected-Free responses behave the same; submitting a Pro ID returns 403 before model access.
34. Hosted copy says runtime delivery is gated and never implies that Pro text is absent from the public MIT repository.

## Final release gate

Do not ship “120 distinct methods,” “108 Pro methods,” or “all 12 Free methods are testable” from the current data. Safe interim wording is:

> 120 evidence cards in the current catalogue, including 12 open cards. Supported lab recipes are labeled individually; other cards provide guided measurement plans.

Restore stronger method-count and lab claims only after the alias registry, replacements, provider profiles, and adapter acceptance tests above pass.
