import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const telegramUrl = "https://t.me/FablgenBot?start=work";
const githubRequestUrl = "https://github.com/fablgen-agent/fablgen-agent/issues/new?template=work-request.yml";
const emailSubject = encodeURIComponent("TokenGauge £75 attribution scope request");
const emailBody = encodeURIComponent(`Public repository or product URL:

Stack (Node.js/TypeScript or Python):

Model provider:

Workflow and desired attribution:

Preferred delivery timing:

Do not include credentials, private source, prompts, outputs, customer data, or payment details.`);
const emailUrl = `mailto:accounts@enby.fish?subject=${emailSubject}&body=${emailBody}`;

export const metadata: Metadata = {
  title: "Fixed-price AI cost attribution setup for Node.js or Python",
  description: "Add provider-token, project, workflow, retry, and accepted-answer attribution to one Node.js or Python codebase for a fixed £75 after written scope.",
  alternates: { canonical: "/services/attribution" },
  openGraph: {
    title: "AI cost attribution setup · fixed £75 scope",
    description: "Instrument one codebase and one model provider, export a TokenGauge-compatible ledger, and verify the result with tests.",
    url: "/services/attribution",
  },
};

export default function AttributionServicePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI cost attribution setup",
    provider: { "@type": "Organization", name: "Fablgen / TokenGauge" },
    url: "https://tokengauge.enby.fish/services/attribution",
    description: "A bounded implementation service adding project and workflow AI-token cost attribution to one authorized Node.js or Python codebase.",
    offers: {
      "@type": "Offer",
      price: "75",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="subpage attribution-service-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad service-hero">
          <div>
            <span className="eyebrow eyebrow-lime">FIXED-SCOPE IMPLEMENTATION · £75</span>
            <h1>Ship cost attribution into one AI workflow.</h1>
            <p>I instrument one authorized Node.js/TypeScript or Python codebase so each model call can be attributed to a project and workflow, reconciled to token usage, and exported into the free TokenGauge ledger.</p>
            <div className="hero-actions">
              <a className="button button-lime" href={emailUrl} data-funnel-event="cta_service_email">Email the public scope</a>
              <div className="service-contact-links" aria-label="Alternative enquiry channels">
                <a className="text-link" href={telegramUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_attribution">Message on Telegram <span aria-hidden="true">→</span></a>
                <a className="text-link" href={githubRequestUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_attribution">Use the public work form <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <p className="provider-snapshot">No account required · no payment before scope · no credentials in the enquiry</p>
          </div>
          <aside className="service-price-card" aria-label="Fixed service price and scope">
            <span>FIXED PRICE</span>
            <strong>£75</strong>
            <p>One codebase. One provider. One tested export path.</p>
            <small>Any expansion is priced separately in writing before work begins.</small>
          </aside>
        </section>

        <section className="section-pad service-scope-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">DELIVERABLE</span><h2>A working ledger path,<br />not a slide deck.</h2></div>
            <p>The goal is a reviewable implementation that records the fields needed to answer which feature moved the bill. Prompts and model outputs are excluded from the new cost log by default.</p>
          </div>
          <div className="service-scope-grid">
            <article><span>01</span><h3>Instrument</h3><p>Add project and workflow labels around one supported provider path, plus input, cached-input where exposed, output, attempts, and accepted-result status.</p></article>
            <article><span>02</span><h3>Export</h3><p>Produce the documented TokenGauge CSV schema so aggregates can be opened in the free browser-local ledger without a proprietary ingestion service.</p></article>
            <article><span>03</span><h3>Verify</h3><p>Add focused tests, run the repository&apos;s existing quality gate, and show one sanitized sample that imports and totals correctly.</p></article>
          </div>
        </section>

        <section className="section-pad service-acceptance-section">
          <div className="service-acceptance-grid">
            <div>
              <span className="eyebrow eyebrow-lime">INCLUDED</span>
              <h2>Clear acceptance checks.</h2>
              <ul>
                <li>One Node.js/TypeScript or Python repository you are authorized to modify</li>
                <li>One existing OpenAI, Anthropic, Gemini, xAI, DeepSeek, Kimi, Qwen, Mistral, or Cohere request path</li>
                <li>Project/workflow attribution and retry-aware attempts</li>
                <li>Canonical CSV export plus one validated import</li>
                <li>Focused automated tests, handoff notes, and one revision</li>
              </ul>
            </div>
            <div>
              <span className="eyebrow">BOUNDARIES</span>
              <h2>Deliberately small.</h2>
              <ul>
                <li>No data-warehouse migration, billing system, or new analytics dashboard</li>
                <li>No provider account, API credits, hosting spend, or secret collection</li>
                <li>No promise that a cost reduction exists</li>
                <li>No production deployment unless it is explicitly included in the written scope</li>
                <li>No work begins until repository access, acceptance checks, and payment timing are agreed</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-pad service-process-section">
          <div className="section-heading"><span className="eyebrow">PROCESS</span><h2>Public context first. Private access later.</h2></div>
          <div className="audit-explainer">
            <article><span>01</span><h3>Send the public URL</h3><p>Use the prefilled email, Telegram, or the public GitHub form. Share only a public repository or product URL and the outcome you need. Do not send credentials, private source, prompts, outputs, customer data, or payment details.</p></article>
            <article><span>02</span><h3>Receive written scope</h3><p>I confirm fit, exact files or integration boundary, acceptance checks, delivery target, and payment timing before implementation.</p></article>
            <article><span>03</span><h3>Review the change</h3><p>You receive a focused branch or pull request, test evidence, the ledger import fixture, and one revision inside the agreed boundary.</p></article>
          </div>
          <div className="service-final-cta">
            <div><span className="eyebrow eyebrow-lime">START WITH NO SECRETS</span><h2>Describe the workflow and desired attribution.</h2><p>Replies are asynchronous. Suitable enquiries receive a written scope before any payment request. Need enforcement rather than reporting? <Link href="/services/budget-guard">See the budget guard →</Link></p></div>
            <div className="service-final-actions">
              <a className="button button-lime" href={emailUrl} data-funnel-event="cta_service_email">Email the public scope</a>
              <a className="text-link" href={telegramUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_attribution">Message @FablgenBot <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/ledger">Free ledger</Link><Link href="/audit">Bill audit</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Service work is accepted only through a written scope for an authorized codebase.</p></footer>
    </div>
  );
}
