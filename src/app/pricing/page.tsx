import type { Metadata } from "next";
import Link from "next/link";

import { CostCalculator } from "@/components/calculator";
import { PricingDirectory } from "@/components/pricing-directory";
import { SiteHeader } from "@/components/site-header";
import { modelPrices, priceSnapshotDate } from "@/lib/costs";
import { providerComparisons } from "@/lib/provider-comparisons";
import { providerLabel, providerPageProfiles, providerRateCards, uniqueProviderModels } from "@/lib/provider-pages";

export const metadata: Metadata = {
  title: `AI API pricing calculator — ${priceSnapshotDate}`,
  description: "Compare official AI API token rates, monthly workload costs, and quality-adjusted cost per accepted answer across nine providers.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "AI API pricing calculator · TokenGauge",
    description: `Compare ${modelPrices.length} dated rate cards across nine AI providers, then model spend and cost per accepted answer.`,
    url: "/pricing",
  },
};

export default function PricingHub() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TokenGauge AI API pricing calculator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://tokengauge.enby.fish/pricing",
    description: "A dated, official-source AI model API rate directory with workload and quality-adjusted cost-per-accepted-answer calculations.",
  };

  return (
    <div className="subpage provider-pricing-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad pricing-hub-hero">
          <span className="eyebrow eyebrow-lime">AI API PRICING DIRECTORY</span>
          <h1>Calculate model costs without flattening the billing rules.</h1>
          <p>Compare {modelPrices.length} official-source rate cards across nine providers. Then model requests, tokens, warm cache reads, and quality pass rates against the exact model tier.</p>
          <p className="provider-snapshot">Snapshot verified {priceSnapshotDate} · USD per one million tokens · consumer chat subscriptions excluded</p>
        </section>

        <section className="section-pad provider-index" aria-labelledby="provider-index-title">
          <div className="section-heading"><span className="eyebrow">PROVIDER CALCULATORS</span><h2 id="provider-index-title">Start with the billing surface you use.</h2></div>
          <div className="provider-page-grid">
            {providerPageProfiles.map((profile) => (
              <Link href={`/pricing/${profile.id}`} key={profile.id}>
                <span>{providerLabel(profile.id)}</span>
                <strong>{uniqueProviderModels(profile.id)} models</strong>
                <small>{providerRateCards(profile.id).length} dated rate cards</small>
                <p>{profile.description}</p>
                <b>Open calculator →</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="section-pad provider-index comparison-index" aria-labelledby="comparison-index-title">
          <div className="section-heading split-heading"><div><span className="eyebrow">PAIRWISE API COSTS</span><h2 id="comparison-index-title">Put two providers on one workload.</h2></div><p>Choose exact model tiers, reuse the same request and token inputs, then set separate quality pass rates before calling either side cheaper.</p></div>
          <div className="provider-page-grid comparison-page-grid">
            {providerComparisons.map((comparison) => <Link href={`/compare/${comparison.slug}`} key={comparison.slug}><span>{providerLabel(comparison.left)} / {providerLabel(comparison.right)}</span><strong>{comparison.searchTitle}</strong><p>{comparison.description}</p><b>Open comparison →</b></Link>)}
          </div>
          <p className="comparison-index-link"><Link className="text-link" href="/compare">View every provider comparison <span aria-hidden="true">→</span></Link></p>
        </section>

        <section id="rates" className="section-pad section-block rates-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">ALL RATE CARDS</span><h2>Search the current snapshot.</h2></div>
            <p>Keep context bands, regions, cache modes, and effective dates visible. A missing cache price is never treated as free.</p>
          </div>
          <PricingDirectory />
        </section>

        <section id="calculator" className="section-pad section-block calculator-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">WORKLOAD CALCULATOR</span><h2>Turn rates into a monthly scenario.</h2></div>
            <p>Compare raw spend with cost per accepted answer and the candidate pass rate needed to break even. These remain estimates until a quality-gated test confirms them.</p>
          </div>
          <CostCalculator />
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/library">Methods</Link><Link href="/lab">Lab</Link><Link href="/privacy">Privacy</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by any listed model provider.</p>
      </footer>
    </div>
  );
}
