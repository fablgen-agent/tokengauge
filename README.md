# TokenGauge

TokenGauge is an evidence-backed LLM cost-intelligence workbench. The maintained application combines a dated API-rate directory, an auditable evidence catalogue, a scenario calculator, a measured-savings dashboard, and a private A/B lab that uses a customer’s own ChatGPT plan or encrypted provider connections.

The public [pricing effective-date ledger](https://tokengauge.enby.fish/pricing/changes) exposes every scheduled start and expiry in the current snapshot. When no successor rate is present, it requires source revalidation instead of treating the missing price as free.

- Primary live application: <https://tokengauge.enby.fish/>
- Free browser-local bill audit: <https://tokengauge.enby.fish/audit>
- Free browser-local workflow ledger: <https://tokengauge.enby.fish/ledger>
- Practical LLM cost-per-customer and feature guide: <https://tokengauge.enby.fish/guides/llm-cost-per-customer-feature>
- Autonomous agent token-budget implementation guide: <https://tokengauge.enby.fish/guides/autonomous-agent-token-budget>
- Fixed-scope AI cost-attribution implementation: <https://tokengauge.enby.fish/services/attribution>
- Fixed-scope application-side AI budget guard: <https://tokengauge.enby.fish/services/budget-guard>
- Lightweight GitHub Pages mirror: <https://fablgen-agent.github.io/tokengauge/>
- Current release: <https://github.com/fablgen-agent/tokengauge/releases/tag/v0.5.0>
- Version history: [CHANGELOG.md](CHANGELOG.md)

The project is independent software and is not affiliated with or endorsed by OpenAI.

## Product principles

- Every strategy is labelled as an official fact, derived math, or a test protocol.
- Savings are never guaranteed. Calculator results and strategy savings remain hypotheses until a quality-gated benchmark supports them on the intended workload.
- The calculator shows a dated pricing snapshot rather than pretending rates are timeless.
- Supported lab recipes are labelled individually. Other catalogue cards provide guided protocols rather than pretending to have an automated adapter.
- Lab prompts and outputs pass through the server but are never stored; only token metrics are retained.
- ChatGPT credentials stay encrypted in the server-side session store and raw-token export is disabled.
- User-supplied API keys are encrypted per account with AES-256-GCM, never returned after storage, and used only for user-initiated lab requests.
- Stripe billing identity is an HMAC-derived opaque identifier, separate from the ChatGPT account ID.
- Anonymous funnel totals have no visitor identifier, and any browser can disable future page and action counts from the Privacy page. Automated verification uses the same browser-local `?measurement=off` preference so operator QA does not masquerade as demand.

## Machine-readable pricing

Pricing Feed v1 exposes the dated source-linked card ledger without a login, cookie, or API key:

```bash
curl -fsS https://tokengauge.enby.fish/pricing.json
```

- Live feed: <https://tokengauge.enby.fish/pricing.json>
- JSON Schema: <https://tokengauge.enby.fish/schemas/pricing-v1.schema.json>
- Tagged v0.5.0 fixture: <https://raw.githubusercontent.com/fablgen-agent/tokengauge/v0.5.0/public/fixtures/pricing-v1.json>
- Tagged v0.5.0 schema: <https://raw.githubusercontent.com/fablgen-agent/tokengauge/v0.5.0/public/schemas/pricing-v1.schema.json>
- Release checksums: <https://github.com/fablgen-agent/tokengauge/releases/download/v0.5.0/SHA256SUMS>
- Dependency-free selector example: [examples/pricing-feed-consumer.mjs](examples/pricing-feed-consumer.mjs)
- Human effective-date ledger: <https://tokengauge.enby.fish/pricing/changes>

Rows can be current, future, or historical: `effectiveFrom` is inclusive and `effectiveUntil` is exclusive. An omitted bound means TokenGauge has no known bound, not that the rate cannot change. A missing card or `null` rate is unknown—not free—and consumers should fail closed. Callers must select schedule-labelled cards such as DeepSeek peak/off-peak rows using the provider's documented day, time, and timezone; the example validates one explicitly selected card and does not infer a schedule. The feed is a dated estimate for token-price dimensions it explicitly publishes; it is not provider invoice data, a quality benchmark, real-time scraping, or coverage for unmodelled image, audio, video, tool, storage, tax, credit, or account-specific charges. Pin the tagged snapshot and verify its release checksum when a historical calculation must remain reproducible.

## What is included

- A 23 August 2026 pricing snapshot with 58 pricing cards across nine providers. Cards can represent model, context-tier, region, or effective-date variants; this is not a claim of 58 distinct models.
- A crawlable pricing hub plus dedicated OpenAI, Anthropic, Gemini, Grok, DeepSeek, Kimi, Qwen, Mistral, and Cohere workload calculators that preserve each provider's billing caveats and source links.
- A free browser-local bill audit that reconciles aggregate input, cache-read, and output tokens against the selected dated rate card; it also reports invoice variance, cache share, accepted-answer cost, and an explicitly approximate retry burden without uploading the entered values. The result can be copied or downloaded as a bounded plain-text handoff generated entirely in the browser.
- A free browser-local workflow ledger that attributes aggregate token usage to projects and features, imports and exports a documented canonical CSV, and reports cost per accepted answer without uploading the entered rows.
- A practical attribution guide that separates the provider and application ledgers; uses opaque customer labels rather than personal data; accounts for retries and accepted answers; and keeps modeled token cost distinct from the provider invoice.
- 120 evidence cards, including 12 open cards. These are catalogue entries and provider-specific profiles, not 120 distinct optimization methods.
- A server-filtered research atlas with exactly 1,316 atomic candidates and 1,184 compound configurations (2,500 rows total). These are explicitly not presented as 2,500 distinct methods, supported adapters, or proven savings; anonymous responses contain only a 12-row sample.
- A cost calculator for input, output, caching, request volume, quality-adjusted cost per accepted answer, and candidate break-even pass rate.
- Login with ChatGPT via [`@opencoredev/loginwithchatgpt`](https://github.com/opencoredev/login-with-chatgpt).
- Verified-email accounts with password recovery, authenticator-app 2FA, recovery codes, session controls, and separate ChatGPT linking.
- ChatGPT can also be the primary TokenGauge sign-in, so a separate product password is optional. A previously linked ChatGPT identity resolves to the same underlying owner account.
- Randomized paired A/B experiments for recipes explicitly marked as supported; other cards include guided measurement protocols.
- Pro includes encrypted API connections for OpenAI, Anthropic, Gemini, xAI, DeepSeek, Kimi, Qwen, Mistral, and Cohere. Higher tiers expand experiment history and export depth rather than gating providers.
- A dashboard that reports paired-test token deltas—not production savings or invoice totals—and an optional method-status queue.
- No-account inline scope forms for the fixed-price attribution and budget-guard services. Submitted fields go directly to the TokenGauge mailbox, are not stored in the workbench database, and remain available alongside ordinary email, Telegram, and GitHub contact paths.
- Connecting ChatGPT does not itself charge the user. Lab requests use the connected plan and count against that plan’s limits.
- One-time Pro (£9), Pro+ (£19), and Ultimate (£39) access. Existing paid tiers are credited during upgrades. No tier includes API credits.
- The first 100 authenticated identities receive persistent launch pricing of £5 Pro, £15 Pro+, or £20 Ultimate. Allocation is transactional and belongs to the identity rather than an abandoned Checkout Session.
- Stripe Checkout with signed, idempotent webhook fulfilment and refund revocation.
- Durable SQLite sessions, rate counters, users, entitlements, webhook events, and token-only experiment records.
- A no-backend GitHub Pages mirror that summarizes the current public data surface and directs users to the maintained live application.

## Local development

Node.js 24 or newer is required.

```bash
npm install
npm run dev
```

Runtime variables are read lazily so production secrets are not required for a static build. The authenticated and payment routes require:

```dotenv
LWC_SECRET=a-stable-random-secret-at-least-32-characters
STRIPE_MODE=test
STRIPE_TEST_API_KEY=sk_test_...
STRIPE_TEST_PRICE_ID=price_...
STRIPE_TEST_PRO_PLUS_PRICE_ID=price_...
STRIPE_TEST_ULTIMATE_PRICE_ID=price_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
AUTH_SMTP_HOST=smtp.example
AUTH_SMTP_PORT=587
AUTH_SMTP_SECURE=false
AUTH_SMTP_USER=accounts@example
AUTH_SMTP_PASS=dedicated-smtp-token
AUTH_EMAIL_FROM="TokenGauge <accounts@example>"
APP_URL=https://your-host.example
```

Never expose secret-key or webhook values through `NEXT_PUBLIC_*` variables. Set `STRIPE_MODE=live` only with a separate live Price ID, live key, and live webhook secret.

## Validation

```bash
npm run atlas:compile
npm run check
```

Run the atlas compiler after changing its six research sources. The check verifies that generated atlas data is current, then runs ESLint, strict TypeScript, Vitest, and a production Next.js build. Browser smoke testing is performed separately against the deployed build.

## Deployment

The reference deployment runs the Next.js standalone server behind a named Cloudflare Tunnel. The guarded deploy assembles each build into an ignored immutable release directory, atomically switches `.deploy/current`, keeps the three newest releases plus any older active or immediate rollback target, and runs production from that stable path. A later `next build` therefore cannot erase assets used by the active process. Application data and `.env*` files are excluded from every release, and release symlinks may not escape the release directory. An alternative Caddy configuration is included for hosts with public ports. Templates are in [`ops/`](ops/). Keep environment and tunnel credential files outside the repository and make secret-bearing files readable only by the service account. Set `APP_URL` to the public origin so cookie-authenticated POST requests retain strict origin checking when a reverse proxy uses a local upstream host.

The reference host uses [`scripts/backup-database.mjs`](scripts/backup-database.mjs) for SQLite's online backup API, an integrity check, mode-600 output, and automatic expiry after 14 days. The deployment script creates a backup before validation, and the included systemd timer runs the same bounded rotation daily. The optional offsite timer sends only completed backup files over a pinned, key-only SSH connection; its destination, port, identity path, known-hosts path, and remote directory are required in the external mode-600 `offsite-backup.env`, never hard-coded in source. Privacy copy must distinguish deletion from the active database from expiry of retained operational backups.

GitHub Pages serves only [`docs/`](docs/), which deliberately contains no authentication or payment code.

## Security and privacy

Please avoid placing secrets, private prompts, or customer data in issues. Report sensitive problems privately to the repository owner through GitHub. See the application’s [privacy notice](https://tokengauge.enby.fish/privacy) for the deployed data flow.

## License

[MIT](LICENSE)
