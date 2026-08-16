import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { formatRate, priceSnapshotDate } from "@/lib/costs";
import { priceTransitions, type PriceTransition } from "@/lib/price-transitions";

export const metadata: Metadata = {
  title: `AI API pricing changes and effective dates — ${priceSnapshotDate}`,
  description: "Track exact UTC boundaries for scheduled and expiring AI API token-price cards without treating a missing successor rate as free.",
  alternates: { canonical: "/pricing/changes" },
  openGraph: {
    title: "AI API pricing changes and effective dates · TokenGauge",
    description: "A source-linked lifecycle view of scheduled and expiring AI API token rates.",
    url: "/pricing/changes",
    images: [{ url: "/images/tokengauge-launch-social.jpg", width: 1270, height: 760, alt: "TokenGauge AI API pricing lifecycle" }],
  },
};

export default function PricingChangesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "TokenGauge AI API pricing effective-date ledger",
    description: "Exact effective-from and effective-until boundaries found in TokenGauge's dated official-source API pricing snapshot.",
    url: "https://tokengauge.enby.fish/pricing/changes",
    dateModified: priceSnapshotDate,
    temporalCoverage: transitionCoverage(priceTransitions),
    isBasedOn: [...new Set(priceTransitions.flatMap((transition) => transition.sourceUrls))],
  };

  return (
    <div className="subpage provider-pricing-page pricing-changes-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad pricing-hub-hero">
          <span className="eyebrow eyebrow-lime">AI API PRICE LIFECYCLE</span>
          <h1>Know exactly when a rate card stops matching.</h1>
          <p>TokenGauge keeps scheduled starts and expiries as separate rows. This ledger exposes every exact UTC boundary in the current snapshot so a future discount is never applied early and an expired price is never silently reused.</p>
          <p className="provider-snapshot">Snapshot verified {priceSnapshotDate} · {priceTransitions.length} exact boundaries · source-linked</p>
          <div className="hero-actions"><Link className="button button-lime" href="/pricing">Open all rate cards</Link><Link className="text-link" href="/pricing#calculator">Model a workload <span aria-hidden="true">→</span></Link></div>
        </section>

        <section className="section-pad pricing-change-section" aria-labelledby="changes-title">
          <div className="section-heading split-heading"><div><span className="eyebrow">EFFECTIVE-DATE LEDGER</span><h2 id="changes-title">One timestamp.<br />Two different actions.</h2></div><p>Cards ending at a boundary stop matching calculator requests at that instant. Cards starting there become eligible. If no successor exists in this snapshot, revalidate the official provider page—do not infer a zero price or continued availability.</p></div>
          <ol className="pricing-change-list">
            {priceTransitions.map((transition, index) => <TransitionCard transition={transition} index={index} key={transition.effectiveAt} />)}
          </ol>
        </section>

        <section className="section-pad ledger-service-bridge">
          <div><span className="eyebrow eyebrow-lime">NEED THE COST ATTACHED TO A WORKFLOW?</span><h2>Use the free project ledger before changing a model.</h2><p>Apply the exact active rate card to aggregate usage, preserve project and workflow labels, and compare cost per accepted answer without uploading the entered rows.</p></div>
          <Link className="button button-lime" href="/ledger" data-funnel-event="cta_ledger">Open the free ledger</Link>
        </section>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/pricing">Rates</Link><Link href="/audit">Bill audit</Link><Link href="/ledger">Ledger</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Recheck the linked provider source before a production commitment.</p></footer>
    </div>
  );
}

function TransitionCard({ transition, index }: { transition: PriceTransition; index: number }) {
  const replacement = transition.starts.length > 0 && transition.ends.length > 0;
  const title = replacement
    ? `${transition.providers.join(" / ")} rate cards change`
    : transition.starts.length > 0
      ? `${transition.providers.join(" / ")} rate cards begin`
      : `${transition.providers.join(" / ")} rate cards expire`;

  return (
    <li>
      <div className="pricing-change-time"><span>{String(index + 1).padStart(2, "0")}</span><time dateTime={transition.effectiveAt}>{formatUtc(transition.effectiveAt)}</time></div>
      <div className="pricing-change-body">
        <h3>{title}</h3>
        {transition.ends.length > 0 ? <RateGroup label="Ending at this instant" cards={transition.ends} /> : null}
        {transition.starts.length > 0 ? <RateGroup label="Starting at this instant" cards={transition.starts} /> : <p className="pricing-change-warning"><strong>No successor card is present in this snapshot.</strong> Recheck the official source before using this tier beyond the boundary. Missing means unknown, never free.</p>}
        <div className="pricing-change-sources">{transition.sourceUrls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url}>Official source <span aria-hidden="true">↗</span><span className="sr-only"> in a new tab</span></a>)}</div>
      </div>
    </li>
  );
}

function RateGroup({ label, cards }: { label: string; cards: PriceTransition["starts"] }) {
  return (
    <section className="pricing-change-group" aria-label={label}>
      <h4>{label}</h4>
      <div>{cards.map((card) => <article key={card.id}><span>{card.providerLabel}</span><strong>{card.label}</strong><small>{card.tierLabel}</small><code>input {formatRate(card.inputPerMillionUsd)} · cache {formatRate(card.cachedInputPerMillionUsd)} · output {formatRate(card.outputPerMillionUsd)} / 1M</code></article>)}</div>
    </section>
  );
}

function formatUtc(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(value));
}

function transitionCoverage(transitions: readonly PriceTransition[]): string | undefined {
  if (transitions.length === 0) return undefined;
  return `${transitions[0].effectiveAt}/${transitions.at(-1)!.effectiveAt}`;
}
