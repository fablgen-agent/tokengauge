# TokenGauge

TokenGauge is an evidence-backed LLM cost-intelligence workbench. The maintained application combines a dated API-rate directory, an auditable evidence catalogue, a scenario calculator, a measured-savings dashboard, and a private A/B lab that uses a customer’s own ChatGPT plan or encrypted provider connections.

- Primary live application: <https://tokengauge.enby.fish/>
- Lightweight GitHub Pages mirror: <https://fablgen-agent.github.io/tokengauge/>

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

## What is included

- A 15 August 2026 pricing snapshot with 52 pricing cards across nine providers. Cards can represent model, context-tier, region, or effective-date variants; this is not a claim of 52 distinct models.
- 120 evidence cards, including 12 open cards. These are catalogue entries and provider-specific profiles, not 120 distinct optimization methods.
- A cost calculator for input, output, caching, and request-volume scenarios.
- Login with ChatGPT via [`@opencoredev/loginwithchatgpt`](https://github.com/opencoredev/login-with-chatgpt).
- Verified-email accounts with password recovery, authenticator-app 2FA, recovery codes, session controls, and separate ChatGPT linking.
- ChatGPT can also be the primary TokenGauge sign-in, so a separate product password is optional. A previously linked ChatGPT identity resolves to the same underlying owner account.
- Randomized paired A/B experiments for recipes explicitly marked as supported; other cards include guided measurement protocols.
- Pro includes encrypted API connections for OpenAI, Anthropic, Gemini, xAI, DeepSeek, Kimi, Qwen, Mistral, and Cohere. Higher tiers expand experiment history and export depth rather than gating providers.
- A dashboard that reports paired-test token deltas—not production savings or invoice totals—and an optional method-status queue.
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
npm run check
```

The check runs ESLint, strict TypeScript, Vitest, and a production Next.js build. Browser smoke testing is performed separately against the deployed build.

## Deployment

The reference deployment runs the Next.js standalone server behind a named Cloudflare Tunnel. An alternative Caddy configuration is included for hosts with public ports. Templates are in [`ops/`](ops/). Keep environment and tunnel credential files outside the repository and make secret-bearing files readable only by the service account. Set `APP_URL` to the public origin so cookie-authenticated POST requests retain strict origin checking when a reverse proxy uses a local upstream host.

GitHub Pages serves only [`docs/`](docs/), which deliberately contains no authentication or payment code.

## Security and privacy

Please avoid placing secrets, private prompts, or customer data in issues. Report sensitive problems privately to the repository owner through GitHub. See the application’s [privacy notice](https://tokengauge.enby.fish/privacy) for the deployed data flow.

## License

[MIT](LICENSE)
