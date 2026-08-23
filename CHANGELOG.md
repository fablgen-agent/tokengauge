# Changelog

TokenGauge follows semantic versioning for its public source releases. A release describes shipped behavior; it is not a claim of customer adoption, savings, or provider endorsement.

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

[0.4.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.4.0
[0.3.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.3.0
[0.2.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.2.0
[0.1.0]: https://github.com/fablgen-agent/tokengauge/releases/tag/v0.1.0
