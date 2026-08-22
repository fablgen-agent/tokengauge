import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { priceSnapshotDate } from "@/lib/costs";
import { providerComparisons } from "@/lib/provider-comparisons";
import { providerLabel } from "@/lib/provider-pages";

export const metadata: Metadata = {
  title: `AI API provider comparisons — ${priceSnapshotDate}`,
  description: "Compare OpenAI, Anthropic, Gemini, Grok, DeepSeek, Kimi, Qwen, Mistral, and Cohere API costs with retry, quality, observed p95 latency, and client-compatibility gates.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "AI API provider cost comparisons · TokenGauge Workbench",
    description: "Source-linked model rates, shared workloads, retry-adjusted spend, p95 latency and client-compatibility gates, and cost per accepted answer.",
    url: "/compare",
  },
};

export default function ComparisonIndex() {
  return (
    <div className="subpage provider-pricing-page">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad pricing-hub-hero">
          <span className="eyebrow eyebrow-lime">AI API COST COMPARISONS</span>
          <h1>Compare providers on the same workload.</h1>
          <p>Pick exact model tiers, enter one task profile, and compare retry- and quality-adjusted cost per accepted answer under your own p95 latency and OpenAI-client compatibility gates. No provider-wide minimum is treated as a like-for-like model claim.</p>
          <p className="provider-snapshot">Snapshot verified {priceSnapshotDate} · official sources linked · consumer chat subscriptions excluded</p>
        </section>
        <section className="section-pad provider-index" aria-labelledby="comparison-index-title">
          <div className="section-heading"><span className="eyebrow">PAIRWISE CALCULATORS</span><h2 id="comparison-index-title">Start with the decision you are making.</h2></div>
          <div className="provider-page-grid comparison-page-grid">
            {providerComparisons.map((comparison) => <Link href={`/compare/${comparison.slug}`} key={comparison.slug}><span>{providerLabel(comparison.left)} / {providerLabel(comparison.right)}</span><strong>{comparison.searchTitle}</strong><p>{comparison.description}</p><b>Compare exact tiers →</b></Link>)}
          </div>
        </section>
      </main>
      <footer className="site-footer section-pad">
        <div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge Workbench</Link><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/pricing">All pricing</Link><Link href="/library">Methods</Link><Link href="/lab">Lab</Link><Link href="/privacy">Privacy</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by any listed model provider.</p>
      </footer>
    </div>
  );
}
