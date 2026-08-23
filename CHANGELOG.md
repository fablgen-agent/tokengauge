# Changelog

TokenGauge follows semantic versioning for its public source releases. A release describes shipped behavior; it is not a claim of customer adoption, savings, or provider endorsement.

## Unreleased

### Pricing-model transparency

- Label ordinary-input fallback whenever cached tokens use a rate card with no separately published cache-read price, including the workload calculator, workflow ledger, and provider-pair comparisons.
- Keep Pricing Feed v1 null values unchanged and keep zero-cache rows unflagged; no provider rate or canonical workflow CSV field changed.

## [0.5.0] — 2026-08-23

### Machine-readable pricing contract

- Added a versioned, source-linked Pricing Feed v1 at `/pricing.json` while preserving `/api/pricing` as a compatibility response.
- Published a checked-in JSON Schema, generated fixture, SHA-256 manifest, and dependency-free schema-plus-semantic validating consumer example for dated card, context-band, and unavailable-rate handling.
- Added cross-origin GET and body-free HEAD support with public cache headers and a schema relation; the route has no account, database, prompt, output, provider-key, or runtime provider-fetch dependency.
- Documented the feed in README and `llms.txt`, including the estimate-versus-invoice, missing-is-not-zero, effective-date, schedule-selection, media-unit, and tagged-snapshot boundaries.

### Pricing and purchase trust

- Reverified all current and future rate cards against sixteen official provider pages without changing a numeric rate.
- Corrected Gemini introductory-rate end timestamps to represent all of 31 December under the contract's exclusive upper-bound rule; no unpublished successor rate is inferred.
- Routed refund requests to private email rather than the public issue tracker.
- Preserved Pro, Pro+, and Ultimate plan context through authentication with exact launch and standard prices before the explicit Stripe Checkout action.

### Verification

- Pricing Feed v1 fixture and schema validation, compatibility equality, unique/source-linked cards, DeepSeek effective-date boundaries, OpenAI context bands, null-cache handling, and manual-review provenance passed.
- 2,500 compiled research-atlas rows, ESLint, strict TypeScript, application tests, database-backup tests, pricing-source verification, and the production build passed.

## [0.4.1] — 2026-08-23

### Public evidence boundaries

- Added a no-account lab measurement audit that exposes the two published GPT-5.5 token rows while stating that the exact historical prompt and outputs were not retained, so the record cannot support an independent quality verdict.
- Moved the current lab starter task and instructions into one shared fixture so the displayed context cannot silently drift from the live workbench defaults.
- Added source-linked implementation evidence to the fixed £75 budget-guard scope: an open repository-owner report and the Fablgen Agent account's open, unmerged proposed patch.
- Kept the public patch separate from claims of upstream adoption, endorsement, customer work, savings, revenue, production outcomes, or a precise provider-billing cap.

### Verification

- 2,500 compiled research-atlas rows verified.
- ESLint and strict TypeScript passed.
- 109 application tests and two database-backup tests passed.
- The Next.js production build generated all 38 routes.
- The lab audit was checked at 390px and 1440px with exact document widths, working disclosure controls, and no production browser warnings or errors.

## [0.4.0] — 2026-08-23

### Pricing and comparison integrity

- Expanded the dated pricing snapshot from 52 to 58 cards across the same nine provider families, including DeepSeek's current weekday/weekend schedule and experimental vision rate bands.
- Added a source-linked pricing lifecycle ledger that keeps starts, expiries, and missing successor rates explicit.
- Added retry burden, tail-latency, quality-gate, and client-compatibility controls to provider-pair comparisons without inventing benchmark results.
- Renamed calculator deltas as modeled raw-spend changes rather than unverified savings.

### Budget controls and services

- Added a practical autonomous-agent token-budget guide and a fixed £75 implementation scope for one authorized provider path.
- Added pre-call reservation, provider-usage reconciliation, deterministic non-model fallback, concurrency, and invoice-authority boundaries to the public implementation model.
- Kept the existing fixed £75 project/workflow attribution service and separated its email, Telegram, and GitHub enquiry counters.

### Accounts, privacy, and operations

- Added account data export/deletion controls, bounded local and offsite backup retention, and clearer active-database versus backup deletion disclosures.
- Hardened checkout cancellation, plan handoff, entitlement upgrades, email-versus-ChatGPT connection copy, and linked ChatGPT experiment ownership.
- Added a public `llms.txt` product manifest and explicit anonymous daily aggregate funnel labels.
- Preserved the no-prompt/output-storage lab boundary and browser-local audit/ledger workflows.

### Verification

- 2,500 compiled research-atlas rows verified.
- ESLint and strict TypeScript passed.
- 62 application tests and two database-backup tests passed.
- The Next.js production build generated all 34 routes.
- Production was checked at 390px and 1440px with exact document widths and no browser warnings or errors.

## [0.3.0] — 2026-08-16

- Added the browser-local workflow ledger, cost-per-customer/feature guide, and fixed £75 attribution implementation scope.
- Released the first complete application-attribution workflow on top of the pricing directory, research atlas, account system, billing, dashboard, and controlled lab.

## [0.2.0] — 2026-08-16

- Added the 2,500-row Research Atlas with explicit atomic-candidate and compound-configuration boundaries.

## [0.1.0] — 2026-08-15

- Published the initial pricing workbench, evidence catalogue, account system, controlled lab, and one-time paid plans.

[0.5.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.5.0
[0.4.1]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.4.1
[0.4.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.4.0
[0.3.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.3.0
[0.2.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.2.0
[0.1.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.1.0
