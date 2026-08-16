import type { Metadata } from "next";
import Link from "next/link";

import { BillAudit } from "@/components/bill-audit";
import { SiteHeader } from "@/components/site-header";
import { modelPrices, priceSnapshotDate } from "@/lib/costs";

export const metadata: Metadata = {
  title: "Why is my AI API bill so high? Free usage audit",
  description: "Reconcile aggregate AI API token usage against dated provider rates, cache share, accepted-answer cost, and estimated retry overhead without uploading your data.",
  alternates: { canonical: "/audit" },
  openGraph: {
    title: "AI API bill audit · TokenGauge",
    description: "Find the largest modeled cost bucket and invoice gap from aggregate token usage. Runs locally in your browser.",
    url: "/audit",
  },
};

export default function AuditPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TokenGauge AI API bill audit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://tokengauge.enby.fish/audit",
    description: "A browser-local AI API token-cost reconciliation and quality-adjusted usage audit.",
    isAccessibleForFree: true,
  };
  return <div className="subpage audit-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><SiteHeader /><main><section className="subpage-hero section-pad audit-hero"><div><span className="eyebrow eyebrow-lime">FREE AI API BILL AUDIT</span><h1>Find the cost bucket before changing the model.</h1><p>Bring aggregate token totals and your provider bill. TokenGauge reconciles {modelPrices.length} dated rate cards, cache share, accepted-answer economics, and an explicitly approximate retry burden—entirely in your browser.</p><div className="hero-actions"><Link className="button button-lime" href="#audit">Audit the bill</Link><Link className="text-link" href="/pricing">Check current rates <span aria-hidden="true">→</span></Link></div><p className="provider-snapshot">Rate snapshot verified {priceSnapshotDate} · no login · no usage upload</p></div></section><section id="audit" className="section-pad section-block calculator-section"><div className="section-heading split-heading"><div><span className="eyebrow">BILL RECONCILIATION</span><h2>Separate tokens,<br />quality, and variance.</h2></div><p>Select the exact provider rate card, copy aggregate usage totals, and compare the token model with the reported bill. A remaining gap is a question to investigate—not an automatic overcharge claim.</p></div><BillAudit /></section><section className="section-pad audit-method"><div className="section-heading"><span className="eyebrow">READ THE RESULT CAREFULLY</span><h2>Three numbers. Three different decisions.</h2></div><div className="audit-explainer"><article><span>01</span><h3>Modeled token spend</h3><p>Uses the selected input, cache-read, and output rates. It excludes tools and any billing category you did not enter.</p></article><article><span>02</span><h3>Invoice variance</h3><p>Flags the unexplained gap for investigation. Mixed tiers, media, cache writes, credits, or tax may account for it.</p></article><article><span>03</span><h3>Accepted-answer cost</h3><p>Stops cheap failed attempts from looking efficient. Validate changes against a declared quality bar.</p></article></div></section></main><footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/pricing">Rates</Link><Link href="/library">Methods</Link><Link href="/lab">Lab</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Not affiliated with or endorsed by any listed model provider.</p></footer></div>;
}
