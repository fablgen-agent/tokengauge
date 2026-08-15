import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return <div className="subpage"><SiteHeader /><main className="legal-page"><span className="eyebrow">TERMS</span><h1>Plain-language terms.</h1><p className="updated">Effective 15 August 2026</p>
    <h2>The product</h2><p>TokenGauge provides educational strategy cards, scenario calculations, and an experimental A/B workbench. It is independent software and is not affiliated with or endorsed by OpenAI.</p>
    <h2>Accounts and paid access</h2><p>You must use an email address you control and keep your password, authenticator, recovery codes, and provider credentials secure. Pro (£9), Pro+ (£19), and Ultimate (£39) are one-time purchases for their displayed features while the service remains available. They are not subscriptions and include no model-provider API credit or consumer-plan allowance.</p>
    <h2>Your connected providers</h2><p>Lab requests run through your own ChatGPT plan or API key and count toward that provider’s limits and billing. You choose when to run a test and can disconnect or remove a key at any time. Do not submit material you are not authorized to process.</p>
    <h2>No guaranteed savings</h2><p>Examples and calculator outputs are estimates. Actual results depend on model pricing, prompt shape, cache behavior, retries, tool fees, quality requirements, and changing provider behavior. Test against an acceptance rubric before shipping changes.</p>
    <h2>Refunds</h2><p>You may request a refund within 14 days of purchase through the <a href="https://github.com/fablgen-agent/tokengauge/issues" target="_blank" rel="noreferrer">public support tracker</a>. This policy does not limit statutory consumer rights. A refund deactivates the entitlement associated with that payment.</p>
    <h2>Availability and acceptable use</h2><p>The service may change or experience interruptions. Do not abuse rate limits, attempt unauthorized access, interfere with other users, or use the service unlawfully.</p>
    <p><Link href="/">← Return to TokenGauge</Link></p>
  </main></div>;
}
