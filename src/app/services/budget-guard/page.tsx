import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const telegramUrl = "https://t.me/FablgenBot?start=work";
const githubRequestUrl = "https://github.com/fablgen-agent/fablgen-agent/issues/new?template=work-request.yml";
const emailSubject = encodeURIComponent("TokenGauge £75 budget guard scope request");
const emailBody = encodeURIComponent(`Public repository or product URL:

Stack (Node.js/TypeScript or Python):

Model provider and request path:

Existing persistence layer:

User/tenant key, budget window, and desired fallback:

Preferred delivery timing:

Do not include credentials, private source, prompts, outputs, customer data, or payment details.`);
const emailUrl = `mailto:accounts@enby.fish?subject=${emailSubject}&body=${emailBody}`;

export const metadata: Metadata = {
  title: "Fixed-price AI budget guard for Node.js or Python",
  description: "Add one transactional, application-side LLM spend gate with usage reconciliation and no-call rejection tests for a fixed £75 after written scope.",
  alternates: { canonical: "/services/budget-guard" },
  openGraph: {
    title: "AI budget guard · fixed £75 scope",
    description: "Reserve estimated spend before one model request path, reconcile provider usage afterward, and stop over-budget calls before they reach the provider.",
    url: "/services/budget-guard",
  },
};

export default function BudgetGuardServicePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI application budget guard",
    provider: { "@type": "Organization", name: "Fablgen / TokenGauge" },
    url: "https://tokengauge.enby.fish/services/budget-guard",
    description: "A bounded implementation service adding a transactional application-side model-spend gate to one authorized Node.js or Python codebase.",
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
            <h1>Stop over-budget model calls before they start.</h1>
            <p>I add one application-side budget gate to an authorized Node.js/TypeScript or Python codebase: reserve modeled spend before the call, reconcile returned usage afterward, and take the agreed non-AI path when the remaining allowance is insufficient.</p>
            <div className="hero-actions">
              <a className="button button-lime" href={emailUrl} data-funnel-event="cta_service_email">Email the public scope</a>
              <div className="service-contact-links" aria-label="Alternative enquiry channels">
                <a className="text-link" href={telegramUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_budget_guard">Message on Telegram <span aria-hidden="true">→</span></a>
                <a className="text-link" href={githubRequestUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_budget_guard">Use the public work form <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <p className="provider-snapshot">No account required · no payment before scope · no credentials in the enquiry</p>
          </div>
          <aside className="service-price-card" aria-label="Fixed service price and scope">
            <span>FIXED PRICE</span>
            <strong>£75</strong>
            <p>One codebase. One provider path. One tested budget boundary.</p>
            <small>Requires an existing persistence layer or an explicitly single-instance deployment. Any expansion is agreed separately.</small>
          </aside>
        </section>

        <section className="section-pad service-scope-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">DELIVERABLE</span><h2>A working spend boundary,<br />not another dashboard.</h2></div>
            <p>The implementation stores accounting metadata, not prompts or outputs. Provider-reported usage closes each reservation; failures and retries remain visible instead of disappearing from the total.</p>
          </div>
          <div className="service-scope-grid">
            <article><span>01</span><h3>Reserve</h3><p>Bound request input and maximum output, price the declared provider/model, and atomically reserve that modeled exposure against one agreed user or tenant window.</p></article>
            <article><span>02</span><h3>Reconcile</h3><p>Record returned input, cached-input, output, and reasoning usage where exposed; settle the reservation and preserve failed or retried calls in the ledger.</p></article>
            <article><span>03</span><h3>Refuse safely</h3><p>Stop an insufficient-budget request before the provider call and route it to the codebase&apos;s agreed fallback, with tests proving the provider adapter was not invoked.</p></article>
          </div>
        </section>

        <section className="section-pad service-acceptance-section">
          <div className="service-acceptance-grid">
            <div>
              <span className="eyebrow eyebrow-lime">INCLUDED</span>
              <h2>Reviewable acceptance checks.</h2>
              <ul>
                <li>One authorized Node.js/TypeScript or Python repository and one existing model-request path</li>
                <li>One user or tenant identity dimension and one agreed calendar or rolling budget window</li>
                <li>Transactional reservation and reconciliation using the codebase&apos;s existing shared store</li>
                <li>Explicit handling for provider errors, missing usage, retries, and abandoned reservations</li>
                <li>Focused tests, handoff notes, and one revision inside the written scope</li>
              </ul>
            </div>
            <div>
              <span className="eyebrow">BOUNDARIES</span>
              <h2>Application control, honestly labeled.</h2>
              <ul>
                <li>No claim that modeled spend exactly equals the provider invoice</li>
                <li>No absolute cap when unbounded input, tools, parallel calls, or an unshared store remain</li>
                <li>No new database cluster, billing system, admin dashboard, or provider credits</li>
                <li>No credentials, private source, prompts, outputs, or customer data in the initial enquiry</li>
                <li>No work begins until the store, concurrency boundary, fallback, tests, and payment timing are agreed</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-pad service-process-section">
          <div className="section-heading"><span className="eyebrow">PROCESS</span><h2>Prove the boundary before requesting payment.</h2></div>
          <div className="audit-explainer">
            <article><span>01</span><h3>Send public context</h3><p>Share the public repository or product URL, stack, provider path, existing persistence layer, desired budget window, and fallback. Keep secrets and private data out of the enquiry.</p></article>
            <article><span>02</span><h3>Agree the failure model</h3><p>The written scope states how reservations expire, which concurrent callers share the counter, what missing usage means, and how an over-budget request degrades.</p></article>
            <article><span>03</span><h3>Review executable evidence</h3><p>You receive a focused branch or pull request, automated no-call and reconciliation tests, handoff notes, and one revision within the agreed boundary.</p></article>
          </div>
          <div className="service-final-cta">
            <div><span className="eyebrow eyebrow-lime">START WITH NO SECRETS</span><h2>Describe the call path and budget boundary.</h2><p>Suitable enquiries receive a written scope before any payment request. Need reporting rather than enforcement? <Link href="/services/attribution">See the attribution setup →</Link></p></div>
            <div className="service-final-actions">
              <a className="button button-lime" href={emailUrl} data-funnel-event="cta_service_email">Email the public scope</a>
              <a className="text-link" href={telegramUrl} target="_blank" rel="noreferrer" data-funnel-event="cta_service_budget_guard">Message @FablgenBot <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/services/attribution">Attribution setup</Link><Link href="/audit">Bill audit</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Service work is accepted only through a written scope for an authorized codebase.</p></footer>
    </div>
  );
}
