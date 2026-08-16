import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { CostCalculator } from "@/components/calculator";
import { PricingDirectory } from "@/components/pricing-directory";
import { SiteHeader } from "@/components/site-header";
import { TipCard } from "@/components/tip-card";
import { evidenceLabels, proTips, publicTips, tokenTips } from "@/lib/catalog";
import { modelPrices, priceProviders, priceSnapshotDate } from "@/lib/costs";
import { launchOfferStatus } from "@/lib/db";
import { getOwnerAccountContext } from "@/lib/access";
import { launchPricesGbp, paidPlans } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const request = new Request("http://tokengauge.internal/", { headers: await headers() });
  const owner = await getOwnerAccountContext(request);
  const offer = launchOfferStatus(owner?.accountId);
  const value = "Compare official LLM API rates, calculate realistic workloads, and test token-saving strategies without storing prompts or outputs.";
  const description = offer.eligible
    ? `${value} Your Launch 100 prices are secured.`
    : offer.remaining > 0
      ? `${value} ${offer.remaining} Launch 100 places remain.`
      : value;
  return {
    title: "TokenGauge Workbench — Evidence-backed AI cost optimization",
    description,
    openGraph: {
      title: "TokenGauge Workbench — LLM API cost intelligence",
      description,
      images: [{ url: "/images/tokengauge-launch-social.jpg", width: 1270, height: 760, alt: "TokenGauge model-cost measurement workbench" }],
    },
    twitter: { title: "TokenGauge Workbench — LLM API cost intelligence", description, images: ["/images/tokengauge-launch-social.jpg"] },
  };
}

export default async function Home() {
  const request = new Request("http://tokengauge.internal/", { headers: await headers() });
  const owner = await getOwnerAccountContext(request);
  const launchOffer = launchOfferStatus(owner?.accountId);
  const launchActive = launchOffer.eligible || launchOffer.remaining > 0;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TokenGauge Workbench",
    alternateName: "TokenGauge",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Official AI model rate cards, evidence-backed token-saving methods, and controlled multi-provider A/B experiments.",
    url: "https://tokengauge.enby.fish/",
    sameAs: "https://github.com/fablgen-agent/tokengauge",
    offers: paidPlans.map((plan) => ({ "@type": "Offer", name: `TokenGauge ${plan.name}`, price: launchActive ? launchPricesGbp[plan.id] : plan.priceGbp, priceCurrency: "GBP", availability: "https://schema.org/InStock", url: "https://tokengauge.enby.fish/#pricing" })),
  };
  return (
    <div className={`page-shell ${launchActive ? "has-launch" : ""}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <SiteHeader />
      <main>
        {launchActive ? <aside className="launch-banner" aria-label="Launch offer"><strong>LAUNCH 100</strong><span>First 100 authenticated accounts: Pro £5 · Pro+ £15 · Ultimate £20</span><span>{launchOffer.eligible ? `Signup ${launchOffer.ordinal} price secured` : `${launchOffer.remaining} places remain`}</span><Link href={launchOffer.eligible ? "/#pricing" : "/account"} data-funnel-event={launchOffer.eligible ? "cta_pricing" : "cta_account"}>{launchOffer.eligible ? "Use your launch price" : "Secure your account price"} <span aria-hidden="true">→</span></Link></aside> : null}
        <section className="hero section-pad">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-lime">LLM COST INTELLIGENCE</span>
            <h1>Should you lower reasoning effort?</h1>
            <p className="hero-lede">Run the same task at two settings. Compare the token totals and both outputs before you change a production workflow.</p>
            <div className="hero-actions">
              <Link className="button button-lime" href="/lab" data-funnel-event="cta_lab">Run the paired test</Link>
              <Link className="text-link" href="/audit" data-funnel-event="cta_audit">Audit an AI API bill <span>→</span></Link>
            </div>
          </div>
          <aside className="coverage-panel" aria-label="Pricing coverage">
            <div className="coverage-heading"><span>Source coverage</span><strong>Verified {priceSnapshotDate}</strong></div>
            <dl>
              <div><dt>Providers</dt><dd>{priceProviders.length}</dd></div>
              <div><dt>Rate cards</dt><dd>{modelPrices.length}</dd></div>
              <div><dt>Evidence cards</dt><dd>{tokenTips.length}</dd></div>
            </dl>
            <div className="provider-list">{priceProviders.map((provider) => <Link href={`/pricing/${provider.id}`} key={provider.id}>{provider.label}</Link>)}</div>
            <p>Rates link to the provider’s own page. Region, context tier, cache mode, and effective dates stay visible.</p>
          </aside>
        </section>

        <section className="decision-demo section-pad" aria-labelledby="decision-demo-title">
          <div className="decision-demo-copy">
            <span className="eyebrow">CONTROLLED DEMONSTRATION · 2026-08-16</span>
            <h2 id="decision-demo-title">One step lower used 15 fewer tokens in this run.</h2>
            <p>The same short task and shared instructions ran on GPT-5.5 at medium and low reasoning effort. Both outputs contained the requested three bullets; a human still has to judge whether either answer meets the real product rubric.</p>
            <Link className="text-link" href="/lab" data-funnel-event="cta_lab">Repeat it with your own task <span>→</span></Link>
          </div>
          <dl className="decision-demo-result">
            <div><dt>Medium effort</dt><dd>172</dd><small>63 input · 109 output · 20 reasoning</small></div>
            <div><dt>Low effort</dt><dd>157</dd><small>63 input · 94 output · 0 reasoning</small></div>
            <div><dt>Observed delta</dt><dd>−8.7%</dd><small>15 fewer total tokens</small></div>
          </dl>
          <p className="decision-demo-caveat">Demonstration, not customer evidence or an API invoice. ChatGPT-plan requests count against plan limits; provider-key requests are billed by that provider. Token reduction is not a quality verdict or guaranteed saving.</p>
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
            <p>Choose a real provider tier, enter your workload and quality pass rates, then compare raw spend with cost per accepted answer. Every number remains an estimate until a quality-gated test confirms it.</p>
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
            <div><span className="lock-icon" aria-hidden="true">+</span><h3>{proTips.length} Pro cards + 2,500 research rows</h3><p>The curated cards stay distinct from 1,316 atomic candidates and 1,184 compound configurations in the server-filtered research atlas.</p></div>
            <div className="locked-preview-actions"><Link className="text-link" href="/atlas" data-funnel-event="cta_atlas">Preview the atlas <span>→</span></Link><Link className="button button-dark" href="#pricing" data-funnel-event="cta_pricing">See one-time Pro access</Link></div>
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
            <p>Pro includes the evidence library and every encrypted bring-your-own-key adapter. Higher tiers expand dashboard and export depth instead of withholding providers.</p>
            <ul>
              <li>The public rate directory and free methods remain open</li><li>API credits are never bundled or resold</li>
              <li>Usage totals retained; prompts and outputs discarded</li><li>14-day refund policy; statutory rights unaffected</li>
            </ul>
          </div>
          <div className="pricing-tier-grid">{paidPlans.map((plan) => { const shownPrice = launchActive ? launchPricesGbp[plan.id] : plan.priceGbp; return <article className={`price-card price-card-${plan.id}`} key={plan.id}><div><span>{plan.name} access</span><strong><sup>£</sup>{shownPrice}</strong><small>{launchActive ? <><s>£{plan.priceGbp}</s> · launch signup price</> : <>one time · no subscription</>}</small></div><p>{plan.summary}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><AccountPanel targetPlan={plan.id} /><p>No API credits included. Provider requests use your own connection and billing. Savings are not guaranteed.</p></article>; })}</div>
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><span className="brand"><span className="brand-mark">T</span>TokenGauge</span><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/audit">Bill audit</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/library">Library</Link><Link href="/dashboard">Dashboard</Link><Link href="/settings">Settings</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by any listed model provider.</p>
      </footer>
    </div>
  );
}
