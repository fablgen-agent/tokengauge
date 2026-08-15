import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CostCalculator } from "@/components/calculator";
import { CacheEpisodeCalculator } from "@/components/cache-episode-calculator";
import { PricingDirectory } from "@/components/pricing-directory";
import { SiteHeader } from "@/components/site-header";
import { formatRate, priceSnapshotDate } from "@/lib/costs";
import {
  providerLabel,
  providerPageProfile,
  providerPageProfiles,
  providerRateCards,
  providerSourceUrls,
  uniqueProviderModels,
} from "@/lib/provider-pages";

type Props = { params: Promise<{ provider: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return providerPageProfiles.map((profile) => ({ provider: profile.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = providerPageProfile((await params).provider);
  if (!profile) return {};
  const label = providerLabel(profile.id);
  const description = `${profile.description} Snapshot verified ${priceSnapshotDate}.`;
  return {
    title: `${profile.searchName} API pricing calculator — ${priceSnapshotDate}`,
    description,
    alternates: { canonical: `/pricing/${profile.id}` },
    openGraph: {
      title: `${profile.searchName} API pricing calculator`,
      description,
      url: `/pricing/${profile.id}`,
      images: [{ url: "/images/tokengauge-launch-social.jpg", width: 1270, height: 760, alt: `${label} API token cost calculator in TokenGauge` }],
    },
    twitter: { title: `${profile.searchName} API pricing calculator`, description },
  };
}

export default async function ProviderPricingPage({ params }: Props) {
  const profile = providerPageProfile((await params).provider);
  if (!profile) notFound();

  const label = providerLabel(profile.id);
  const cards = providerRateCards(profile.id);
  const sources = providerSourceUrls(profile.id);
  const inputRates = cards.map((card) => card.inputPerMillionUsd);
  const outputRates = cards.map((card) => card.outputPerMillionUsd);
  const cacheCards = cards.filter((card) => card.cachedInputPerMillionUsd !== null);
  const cacheWriteCards = cacheCards.filter((card) => card.cacheWritePerMillionUsd !== undefined);
  const faq = [
    {
      question: `How current are the ${label} API prices?`,
      answer: `This page uses TokenGauge’s ${priceSnapshotDate} official-source snapshot. Follow the linked provider pages before making a production commitment because prices can change.`,
    },
    {
      question: `Does this calculator include every ${label} charge?`,
      answer: cacheWriteCards.length
        ? "No. The workload calculator models input, output, and a warm cache-read share. The separate cache-episode calculator includes published cache writes and reads, but storage, tools, retries, regional uplifts, taxes, batch modes, and quality failures can still change the invoice."
        : "No. It models input, output, and a warm cache-read share. Cache writes or storage, tools, retries, regional uplifts, taxes, batch modes, and quality failures can change the final invoice.",
    },
    {
      question: "Are consumer chat subscriptions included?",
      answer: "No. ChatGPT, Claude, Gemini, Grok, Kimi, and other consumer-plan quotas are separate from provider API token billing.",
    },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `${profile.searchName} API pricing snapshot`,
      description: profile.description,
      dateModified: priceSnapshotDate,
      url: `https://tokengauge.enby.fish/pricing/${profile.id}`,
      citation: sources,
      creator: { "@type": "Organization", name: "TokenGauge" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    },
  ];

  return (
    <div className="subpage provider-pricing-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad provider-hero">
          <div>
            <span className="eyebrow eyebrow-lime">{label.toUpperCase()} API PRICING</span>
            <h1>{profile.searchName} token cost calculator.</h1>
            <p>{profile.description}</p>
            <div className="hero-actions">
              <Link className="button button-lime" href="#calculator">Calculate a workload</Link>
              <Link className="text-link" href="#rates">Review rate cards <span>→</span></Link>
            </div>
          </div>
          <dl className="provider-summary" aria-label={`${label} pricing snapshot summary`}>
            <div><dt>Models</dt><dd>{uniqueProviderModels(profile.id)}</dd></div>
            <div><dt>Rate cards</dt><dd>{cards.length}</dd></div>
            <div><dt>Input range</dt><dd>{formatRate(Math.min(...inputRates))}–{formatRate(Math.max(...inputRates))}</dd></div>
            <div><dt>Output range</dt><dd>{formatRate(Math.min(...outputRates))}–{formatRate(Math.max(...outputRates))}</dd></div>
            <div><dt>Cache-priced cards</dt><dd>{cacheCards.length}</dd></div>
            <div><dt>Verified</dt><dd>{priceSnapshotDate}</dd></div>
          </dl>
        </section>

        {cacheWriteCards.length ? <section id="cache-economics" className="section-pad section-block calculator-section cache-episode-section">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">CACHE AMORTIZATION</span><h2>Price writes and reads as an episode.</h2></div>
            <p>Model a stable reusable prefix, each cache creation, and the reads that actually land inside its lifetime. The counterfactual weights every billing category at its published rate.</p>
          </div>
          <CacheEpisodeCalculator providerId={profile.id} />
        </section> : null}

        <section id="calculator" className="section-pad section-block calculator-section provider-calculator">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">{label.toUpperCase()} WORKLOAD</span><h2>Model the calls you actually make.</h2></div>
            <p>Enter monthly workload, tokens, and quality pass rates. The calculator resolves eligible price bands, then shows cost per accepted answer and the candidate break-even pass rate.</p>
          </div>
          <CostCalculator providerId={profile.id} />
          <p className="snapshot-note">{profile.billingNote}</p>
        </section>

        <section id="rates" className="section-pad section-block rates-section provider-rates">
          <div className="section-heading split-heading">
            <div><span className="eyebrow">DATED RATE CARDS</span><h2>{label} prices with their scope intact.</h2></div>
            <p>Rates are USD per one million tokens. Future and transitional cards remain labeled with their effective dates instead of silently replacing today’s tier.</p>
          </div>
          <PricingDirectory initialProvider={profile.id} />
        </section>

        <section className="section-pad provider-notes">
          <article>
            <span className="eyebrow">BILLING CAVEAT</span>
            <h2>What to verify before shipping</h2>
            <p>{profile.billingNote}</p>
            <ul>{sources.map((source, index) => <li key={source}><a href={source} target="_blank" rel="noreferrer">Official source {index + 1} ↗</a></li>)}</ul>
          </article>
          <article>
            <span className="eyebrow">MEASUREMENT RULE</span>
            <h2>Price accepted answers, not token deltas</h2>
            <p>Count retries, fallbacks, tool calls, latency failures, and answers rejected by the quality rubric. A lower estimated token bill is useful only when the workload still succeeds.</p>
            <Link className="button button-dark" href="/lab">Open the controlled A/B lab</Link>
          </article>
        </section>

        <section className="section-pad provider-faq" aria-labelledby="provider-faq-title">
          <span className="eyebrow">QUESTIONS</span>
          <h2 id="provider-faq-title">Before you trust the estimate.</h2>
          <div>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <nav className="section-pad provider-switcher" aria-label="Other provider pricing calculators">
          <strong>Compare another provider</strong>
          <div>{providerPageProfiles.filter((candidate) => candidate.id !== profile.id).map((candidate) => <Link href={`/pricing/${candidate.id}`} key={candidate.id}>{providerLabel(candidate.id)}</Link>)}</div>
        </nav>
      </main>
      <footer className="site-footer section-pad">
        <div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div>
        <nav aria-label="Footer navigation"><Link href="/pricing">All pricing</Link><Link href="/library">Methods</Link><Link href="/lab">Lab</Link><Link href="/privacy">Privacy</Link></nav>
        <p>Independent software. Not affiliated with or endorsed by {label} or any listed model provider.</p>
      </footer>
    </div>
  );
}
