import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProviderComparisonCalculator } from "@/components/provider-comparison-calculator";
import { SiteHeader } from "@/components/site-header";
import { formatRate, getSelectableModelPrices, priceSnapshotDate } from "@/lib/costs";
import { providerComparison, providerComparisons } from "@/lib/provider-comparisons";
import { providerLabel, providerSourceUrls } from "@/lib/provider-pages";

type Props = { params: Promise<{ comparison: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return providerComparisons.map((comparison) => ({ comparison: comparison.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comparison = providerComparison((await params).comparison);
  if (!comparison) return {};
  const description = `${comparison.description} Official-source snapshot verified ${priceSnapshotDate}.`;
  return {
    title: `${comparison.searchTitle} calculator — ${priceSnapshotDate}`,
    description,
    alternates: { canonical: `/compare/${comparison.slug}` },
    openGraph: { title: `${comparison.searchTitle} calculator`, description, url: `/compare/${comparison.slug}`, images: [{ url: "/images/tokengauge-launch-social.jpg", width: 1270, height: 760, alt: `${comparison.searchTitle} in TokenGauge Workbench` }] },
    twitter: { title: `${comparison.searchTitle} calculator`, description },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const comparison = providerComparison((await params).comparison);
  if (!comparison) notFound();
  const leftLabel = providerLabel(comparison.left);
  const rightLabel = providerLabel(comparison.right);
  const current = getSelectableModelPrices();
  const leftCards = current.filter((price) => price.provider === comparison.left);
  const rightCards = current.filter((price) => price.provider === comparison.right);
  const sourceUrls = Array.from(new Set([...providerSourceUrls(comparison.left), ...providerSourceUrls(comparison.right)]));
  const faq = [
    { question: `Which is cheaper, ${leftLabel} or ${rightLabel}?`, answer: "There is no provider-wide answer. Cost depends on the exact model tier, input and output size, cache behavior, region, execution mode, and the share of answers that pass the workload’s quality bar." },
    { question: "Does this comparison prove the models have equal quality?", answer: "No. The calculator keeps separate quality-pass assumptions so you can enter measured results. Equal token counts or prices do not establish equivalent capabilities." },
    { question: "Are consumer subscriptions included?", answer: "No. ChatGPT, Claude, Gemini, Grok, Kimi, and other consumer-plan quotas are separate from API token billing." },
  ];
  const jsonLd = [{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${comparison.searchTitle} calculator`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `https://tokengauge.enby.fish/compare/${comparison.slug}`,
    dateModified: priceSnapshotDate,
    description: comparison.description,
    citation: sourceUrls,
  }, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  }];

  return (
    <div className="subpage provider-pricing-page comparison-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad provider-hero comparison-hero">
          <div><span className="eyebrow eyebrow-lime">{leftLabel.toUpperCase()} / {rightLabel.toUpperCase()}</span><h1>{comparison.searchTitle} calculator.</h1><p>{comparison.description}</p><div className="hero-actions"><Link className="button button-lime" href="#comparison-calculator">Compare a workload</Link><Link className="text-link" href="/pricing">Review all rates <span>→</span></Link></div></div>
          <dl className="provider-summary" aria-label={`${leftLabel} and ${rightLabel} pricing snapshot summary`}>
            <Summary label={leftLabel} cards={leftCards} />
            <Summary label={rightLabel} cards={rightCards} />
            <div><dt>Verified</dt><dd>{priceSnapshotDate}</dd></div>
            <div><dt>Unit</dt><dd>USD / 1M tokens</dd></div>
          </dl>
        </section>
        <section id="comparison-calculator" className="section-pad section-block calculator-section">
          <div className="section-heading split-heading"><div><span className="eyebrow">SHARED WORKLOAD</span><h2>Change the models, not the accounting.</h2></div><p>Both sides receive the same requests and token counts. Set separate quality pass rates so a low token price cannot hide rejected answers.</p></div>
          <ProviderComparisonCalculator leftId={comparison.left} rightId={comparison.right} />
          <p className="snapshot-note">{comparison.billingCaveat}</p>
        </section>
        <section className="section-pad provider-notes comparison-notes">
          <article><span className="eyebrow">{leftLabel.toUpperCase()}</span><h2>Inspect the exact rate card</h2><p>{leftCards.length} currently effective cards are available in the calculator. Context bands and regions remain separate.</p><Link className="button button-dark" href={`/pricing/${comparison.left}`}>Open {leftLabel} pricing</Link></article>
          <article><span className="eyebrow">{rightLabel.toUpperCase()}</span><h2>Keep billing scope intact</h2><p>{rightCards.length} currently effective cards are available in the calculator. A missing cache rate is never treated as free.</p><Link className="button button-dark" href={`/pricing/${comparison.right}`}>Open {rightLabel} pricing</Link></article>
        </section>
        <section className="section-pad provider-faq" aria-labelledby="comparison-faq-title"><span className="eyebrow">QUESTIONS</span><h2 id="comparison-faq-title">Before you call a winner.</h2><div>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
        <nav className="section-pad provider-switcher" aria-label="Other API cost comparisons"><strong>Compare another pair</strong><div>{providerComparisons.filter((candidate) => candidate.slug !== comparison.slug).map((candidate) => <Link href={`/compare/${candidate.slug}`} key={candidate.slug}>{providerLabel(candidate.left)} vs {providerLabel(candidate.right)}</Link>)}</div></nav>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge Workbench</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/compare">Comparisons</Link><Link href="/pricing">All pricing</Link><Link href="/library">Methods</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Not affiliated with or endorsed by {leftLabel}, {rightLabel}, or any listed model provider.</p></footer>
    </div>
  );
}

function Summary({ label, cards }: { label: string; cards: readonly { modelId: string; inputPerMillionUsd: number; outputPerMillionUsd: number }[] }) {
  return <div className="comparison-summary"><dt>{label}</dt><dd>{new Set(cards.map((card) => card.modelId)).size} models</dd><small>Published range {formatRate(Math.min(...cards.map((card) => card.inputPerMillionUsd)))}–{formatRate(Math.max(...cards.map((card) => card.outputPerMillionUsd)))}</small></div>;
}
