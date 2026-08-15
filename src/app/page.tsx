import Link from "next/link";
import Image from "next/image";

import { AccountPanel } from "@/components/account-panel";
import { CostCalculator } from "@/components/calculator";
import { PricingDirectory } from "@/components/pricing-directory";
import { SiteHeader } from "@/components/site-header";
import { TipCard } from "@/components/tip-card";
import { evidenceLabels, proTips, publicTips, tokenTips } from "@/lib/catalog";
import { modelPrices, priceProviders, priceSnapshotDate } from "@/lib/costs";
import { paidPlans } from "@/lib/plans";

export default function Home() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TokenGauge",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Official AI model rate cards, evidence-backed token-saving methods, and controlled multi-provider A/B experiments.",
    offers: paidPlans.map((plan) => ({ "@type": "Offer", name: `TokenGauge ${plan.name}`, price: plan.priceGbp, priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://tokengauge.enby.fish/#pricing" })),
  };
  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <SiteHeader />
      <main>
        <section className="hero section-pad">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-lime">LLM COST INTELLIGENCE</span>
            <h1>Know what every model call costs.</h1>
            <p className="hero-lede">Compare official API rates, model realistic savings, and test token-reduction methods without hiding quality failures.</p>
            <div className="hero-actions">
              <Link className="button button-lime" href="#rates">Compare current rates</Link>
              <Link className="text-link" href="/lab">Open the A/B lab <span>→</span></Link>
            </div>
          </div>
          <aside className="coverage-panel" aria-label="Pricing coverage">
            <div className="coverage-heading"><span>Source coverage</span><strong>Verified {priceSnapshotDate}</strong></div>
            <dl>
              <div><dt>Providers</dt><dd>{priceProviders.length}</dd></div>
              <div><dt>Rate cards</dt><dd>{modelPrices.length}</dd></div>
              <div><dt>Evidence cards</dt><dd>{tokenTips.length}</dd></div>
            </dl>
            <div className="provider-list">{priceProviders.map((provider) => <span key={provider.id}>{provider.label}</span>)}</div>
            <p>Rates link to the provider’s own page. Region, context tier, cache mode, and effective dates stay visible.</p>
          </aside>
        </section>

        <section id="rates" className="section-pad section-block rates-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">OFFICIAL API RATE CARDS</span><h2>One directory.<br />No fake equivalence.</h2></div>
            <p>Gemini, Grok, Kimi, and Qwen are first-class—not footnotes. Provider-specific cache, region, and long-context rules remain separate instead of being flattened into misleading averages.</p>
          </div>
          <PricingDirectory />
        </section>

        <section id="calculator" className="section-pad section-block calculator-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">FREE SCENARIO CALCULATOR</span><h2>Price the workload,<br />then the optimization.</h2></div>
            <p>Choose a real provider tier, enter your workload, then model shorter inputs, outputs, and warm cache reads. Every number remains an estimate until production usage confirms it.</p>
          </div>
          <CostCalculator />
          <p className="snapshot-note">Official-source snapshot: {priceSnapshotDate}. API billing is separate from ChatGPT, Claude, Gemini, Grok, or Kimi consumer-plan quotas.</p>
        </section>

        <section id="evidence" className="section-pad section-block evidence-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">FREE METHOD LIBRARY</span><h2>Try the method.<br />Keep the evidence.</h2></div>
            <div className="legend">
              {Object.entries(evidenceLabels).map(([grade, label]) => <span className={`evidence evidence-${grade}`} key={grade}>{label}</span>)}
            </div>
          </div>
          <div className="tips-grid">{publicTips.slice(0, 3).map((tip) => <TipCard tip={tip} compact key={tip.id} />)}</div>
          <div className="free-library-link"><Link href="/library">View all {publicTips.length} free methods <span aria-hidden="true">→</span></Link><span>Supported lab recipes are labeled individually; every card includes a guided measurement plan.</span></div>
          <div className="locked-preview">
            <div><span className="lock-icon" aria-hidden="true">+</span><h3>{proTips.length} Pro evidence cards</h3><p>Caching, context, routing, retrieval, schemas, tools, retries, batch processing, and provider-specific billing tactics with guided measurement plans.</p></div>
            <Link className="button button-dark" href="#pricing">See one-time Pro access</Link>
          </div>
        </section>

        <section className="section-pad section-block method-section">
          <div className="section-heading"><span className="eyebrow">EXPERIMENT STANDARD</span><h2>A cheaper answer only wins<br />when it still works.</h2></div>
          <figure className="method-visual"><Image src="/images/token-flow-workbench.webp" alt="Abstract token tiles moving through a calibrated gauge and emerging as a smaller organized set" width={1536} height={1024} sizes="(max-width: 620px) 100vw, 1240px" /></figure>
          <ol className="method-grid">
            <li><span>01</span><h3>Declare quality</h3><p>Set the acceptance rubric and allowed regression before looking at the outputs.</p></li>
            <li><span>02</span><h3>Pair the trials</h3><p>Run the same inputs through baseline and candidate, recording exact model and cache state.</p></li>
            <li><span>03</span><h3>Count every attempt</h3><p>Charge retries, fallbacks, tools, latency, and rejected answers to the arm that caused them.</p></li>
            <li><span>04</span><h3>Ship accepted-cost winners</h3><p>Choose on cost per quality-passing answer, not the nicest token-reduction percentage.</p></li>
          </ol>
        </section>

        <section id="pricing" className="section-pad section-block pricing-section pricing-tiers-section">
          <div className="pricing-copy">
            <span className="eyebrow eyebrow-lime">ONE-TIME ACCESS</span><h2>Choose the workbench you will actually use.</h2>
            <p>Start with the evidence library, add an encrypted bring-your-own-key lab, or unlock every supported provider adapter. These are one-time purchases, not subscriptions.</p>
            <ul>
              <li>The public rate directory and free methods remain open</li><li>API credits are never bundled or resold</li>
              <li>Usage totals retained; prompts and outputs discarded</li><li>14-day refund policy; statutory rights unaffected</li>
            </ul>
          </div>
          <div className="pricing-tier-grid">{paidPlans.map((plan) => <article className={`price-card price-card-${plan.id}`} key={plan.id}><div><span>{plan.name} access</span><strong><sup>£</sup>{plan.priceGbp}</strong><small>one time · no subscription</small></div><p>{plan.summary}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><AccountPanel targetPlan={plan.id} /><p>No API credits included. Provider requests use your own connection and billing. Savings are not guaranteed.</p></article>)}</div>
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><span className="brand"><span className="brand-mark">T</span>TokenGauge</span><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/library">Library</Link><Link href="/dashboard">Dashboard</Link><Link href="/settings">Settings</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by any listed model provider.</p>
      </footer>
    </div>
  );
}
