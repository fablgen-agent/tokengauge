# TokenGauge

TokenGauge is an evidence-backed AI cost-optimization workbench. It combines a free API-cost calculator, an auditable strategy catalogue, and a private A/B lab that compares prompt variants using a customer’s own ChatGPT plan.

- Public mirror: <https://fablgen-agent.github.io/tokengauge/>
- Full application: <https://tokengauge.2a01-4f8-10a-cac--1-63.nip.io/>

The project is independent software and is not affiliated with or endorsed by OpenAI.

## Product principles

- Every strategy is labelled as an official fact, derived math, or a test protocol.
- Savings are reported as hypotheses until a quality-gated benchmark supports them.
- The calculator shows a dated pricing snapshot rather than pretending rates are timeless.
- Lab prompts and outputs pass through the server but are never stored; only token metrics are retained.
- ChatGPT credentials stay encrypted in the server-side session store and raw-token export is disabled.
- Stripe billing identity is an HMAC-derived opaque identifier, separate from the ChatGPT account ID.

## What is included

- 33 sourced optimization cards: 6 free and 27 behind a server-side entitlement gate.
- A client-side cost calculator for input, output, caching, and request volume scenarios.
- Login with ChatGPT via [`@opencoredev/loginwithchatgpt`](https://github.com/opencoredev/login-with-chatgpt).
- Randomized paired A/B experiments with request-size, model, output, and rate limits.
- One-time Stripe Checkout with signed, idempotent webhook fulfilment and refund revocation.
- Durable SQLite sessions, rate counters, users, entitlements, webhook events, and token-only experiment records.
- A no-backend GitHub Pages mirror for the free calculator and library.

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
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
APP_URL=https://your-host.example
```

Never expose secret-key or webhook values through `NEXT_PUBLIC_*` variables. Set `STRIPE_MODE=live` only with a separate live Price ID, live key, and live webhook secret.

## Validation

```bash
npm run check
```

The check runs ESLint, strict TypeScript, Vitest, and a production Next.js build. Browser smoke testing is performed separately against the deployed build.

## Deployment

The reference deployment runs the Next.js standalone server behind Caddy. Templates are in [`ops/`](ops/). Keep environment files outside the repository and make secret-bearing files readable only by the service account.

GitHub Pages serves only [`docs/`](docs/), which deliberately contains no authentication or payment code.

## Security and privacy

Please avoid placing secrets, private prompts, or customer data in issues. Report sensitive problems privately to the repository owner through GitHub. See the application’s [privacy notice](https://tokengauge.2a01-4f8-10a-cac--1-63.nip.io/privacy) for the deployed data flow.

## License

[MIT](LICENSE)
