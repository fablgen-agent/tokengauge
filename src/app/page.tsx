import Link from "next/link";

import { AccountPanel } from "@/components/account-panel";
import { CostCalculator } from "@/components/calculator";
import { SiteHeader } from "@/components/site-header";
import { TipCard } from "@/components/tip-card";
import { evidenceLabels, proTips, publicTips, tokenTips } from "@/lib/catalog";
import { priceSnapshotDate } from "@/lib/costs";

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero section-pad">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-lime">THE TOKEN ECONOMICS WORKBENCH</span>
            <h1>Spend tokens on answers. <em>Not overhead.</em></h1>
            <p className="hero-lede">Evidence-backed strategies, honest cost math, and repeatable A/B tests for teams building with language models.</p>
            <div className="hero-actions">
              <Link className="button button-lime" href="#calculator">Calculate your waste</Link>
              <Link className="text-link" href="#evidence">See the evidence <span>↘</span></Link>
            </div>
            <div className="trust-strip" aria-label="Product principles">
              <span>Primary sources</span><span>Quality-gated tests</span><span>No miracle claims</span>
            </div>
          </div>
          <div className="hero-gauge" aria-label="Illustration of lower token waste">
            <div className="gauge-card gauge-card-back"><span>OUTPUT</span><b>↓ 20%</b></div>
            <div className="gauge-card gauge-card-mid"><span>CACHE READ</span><b>↑ 42%</b></div>
            <div className="gauge-card gauge-card-front">
              <span>ACCEPTED-ANSWER COST</span><strong>−37.4%</strong>
              <div className="gauge-track"><i /></div><small>Illustrative scenario</small>
            </div>
          </div>
        </section>

        <section className="metric-ribbon" aria-label="TokenGauge overview">
          <div><strong>{tokenTips.length}</strong><span>Documented strategies</span></div>
          <div><strong>3</strong><span>Evidence grades</span></div>
          <div><strong>0</strong><span>Prompts stored</span></div>
          <div><strong>£9</strong><span>Founding access, once</span></div>
        </section>

        <section id="calculator" className="section-pad section-block calculator-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">FREE COST CALCULATOR</span><h2>Make the invisible<br />line item visible.</h2></div>
            <p>Model the effect of shorter inputs, leaner outputs, and real cache hits. Rates are a dated snapshot—not silently changing live data.</p>
          </div>
          <CostCalculator />
          <p className="snapshot-note">API price snapshot: {priceSnapshotDate}. ChatGPT plan usage is quota-based and is not the same as an API invoice.</p>
        </section>

        <section id="evidence" className="section-pad section-block evidence-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow eyebrow-coral">THE OPEN LIBRARY</span><h2>Advice you can audit.</h2></div>
            <div className="legend">
              {Object.entries(evidenceLabels).map(([grade, label]) => <span className={`evidence evidence-${grade}`} key={grade}>{label}</span>)}
            </div>
          </div>
          <div className="tips-grid">{publicTips.map((tip) => <TipCard tip={tip} compact key={tip.id} />)}</div>
          <div className="locked-preview">
            <div><span className="lock-icon" aria-hidden="true">↳</span><h3>{proTips.length} more strategies with test protocols</h3><p>Caching break-even math, schema slimming, model routing, compaction, retrieval, retries, and more.</p></div>
            <Link className="button button-dark" href="#pricing">Unlock the full library</Link>
          </div>
        </section>

        <section className="section-pad section-block method-section">
          <div className="section-heading"><span className="eyebrow">THE METHOD</span><h2>Optimize the whole answer,<br />not one flattering metric.</h2></div>
          <ol className="method-grid">
            <li><span>01</span><h3>Hold quality constant</h3><p>Define an acceptance rubric before touching the prompt, model, or reasoning level.</p></li>
            <li><span>02</span><h3>Run paired trials</h3><p>Randomize baseline and candidate order, repeat at least three times, and record cache state.</p></li>
            <li><span>03</span><h3>Count every attempt</h3><p>Include retries, escalations, tool calls, latency, and rejected answers in the denominator.</p></li>
            <li><span>04</span><h3>Ship only winners</h3><p>Prefer cost per accepted answer over token savings that quietly reduce usefulness.</p></li>
          </ol>
        </section>

        <section id="pricing" className="section-pad section-block pricing-section">
          <div className="pricing-copy">
            <span className="eyebrow eyebrow-lime">FOUNDING ACCESS</span><h2>One useful test can pay for the library.</h2>
            <p>Get every current strategy, future additions, and the private A/B lab. One payment—no recurring billing.</p>
            <ul>
              <li>All {tokenTips.length} evidence cards</li><li>Custom baseline-vs-candidate experiments</li>
              <li>Token usage captured, prompts and outputs discarded</li><li>14-day refund policy; statutory rights unaffected</li>
            </ul>
          </div>
          <div className="price-card">
            <div><span>Founding price</span><strong><sup>£</sup>9</strong><small>one time</small></div>
            <AccountPanel />
            <p>No API credits included. Lab requests use your own ChatGPT plan and count against its limits. Savings are not guaranteed.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><span className="brand"><span className="brand-mark">T</span>TokenGauge</span><p>Evidence before optimization.</p></div>
        <nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/library">Library</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by OpenAI.</p>
      </footer>
    </div>
  );
}
