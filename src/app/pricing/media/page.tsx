import type { Metadata } from "next";
import Link from "next/link";

import { MediaCostCalculator } from "@/components/media-cost-calculator";
import { SiteHeader } from "@/components/site-header";
import { mediaPriceSnapshotDate, mediaRateCards } from "@/lib/media-costs";

export const metadata: Metadata = {
  title: `AI image and video API cost calculator — ${mediaPriceSnapshotDate}`,
  description: "Model per-image and per-second AI media costs, input-image fees, and a hard monthly budget using dated first-party OpenAI and xAI rates.",
  alternates: { canonical: "/pricing/media" },
  openGraph: {
    title: "AI image and video API cost calculator · TokenGauge",
    description: "Keep per-image and per-second charges visible instead of forcing them into a token-only price schema.",
    url: "/pricing/media",
  },
};

export default function MediaPricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TokenGauge AI media cost calculator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://tokengauge.enby.fish/pricing/media",
    description: "A browser-local per-image and per-second AI media workload and hard-budget calculator.",
  };

  return (
    <div className="subpage provider-pricing-page media-pricing-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad pricing-hub-hero">
          <span className="eyebrow eyebrow-lime">IMAGE + VIDEO API COST GUARD</span>
          <h1>Do not force every model price into a token field.</h1>
          <p>Model per-image output, per-second video, input-image fees, and separate billable overhead before a request reaches the provider. The calculator runs locally in your browser.</p>
          <p className="provider-snapshot">{mediaRateCards.length} OpenAI and xAI output tiers · verified {mediaPriceSnapshotDate} · USD · no usage upload</p>
          <div className="hero-actions"><Link className="button button-lime" href="#media-calculator">Set a media budget</Link><Link className="text-link" href="/pricing">Compare token rates <span aria-hidden="true">→</span></Link></div>
        </section>
        <section id="media-calculator" className="section-pad section-block calculator-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">PER-UNIT WORKLOAD</span><h2>Price the unit the provider actually bills.</h2></div>
            <p>Choose the exact output tier, enter request volume and media units, then reserve any token or tool overhead separately. The result is a planning estimate, not an invoice.</p>
          </div>
          <MediaCostCalculator />
        </section>
        <section className="section-pad media-schema-section">
          <div className="section-heading split-heading"><div><span className="eyebrow">PORTABLE COST RECORD</span><h2>Keep the dimension beside the amount.</h2></div><p>A flat number is ambiguous without its billing unit, resolution or quality tier, effective date, and source.</p></div>
          <div className="audit-explainer">
            <article><span>01</span><h3>Unit</h3><p>Record whether the amount applies to an image, output second, input image, token, minute, character, or tool call.</p></article>
            <article><span>02</span><h3>Tier</h3><p>Keep resolution, quality, region, and model version as explicit dimensions instead of hiding them in a label.</p></article>
            <article><span>03</span><h3>Authority</h3><p>Store the dated source and reconcile provider-reported usage after execution. Missing catalogue data must fail closed for a hard dollar cap.</p></article>
          </div>
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/pricing">Token rates</Link><Link href="/audit">Bill audit</Link><Link href="/ledger">Ledger</Link><Link href="/privacy">Privacy</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by any listed model provider.</p>
      </footer>
    </div>
  );
}
