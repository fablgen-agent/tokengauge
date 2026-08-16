import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { WorkflowLedger } from "@/components/workflow-ledger";
import { priceSnapshotDate } from "@/lib/costs";

export const metadata: Metadata = {
  title: "Free AI API cost ledger by project and workflow",
  description: "Attribute aggregate LLM token spend, cache use, retries, and accepted-answer cost to projects and workflows with a browser-local CSV ledger.",
  alternates: { canonical: "/ledger" },
  openGraph: {
    title: "AI API workflow cost ledger · TokenGauge",
    description: "Find which project or workflow drives modeled AI API spend without uploading usage data.",
    url: "/ledger",
  },
};

export default function LedgerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TokenGauge AI API workflow cost ledger",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://tokengauge.enby.fish/ledger",
    description: "A browser-local project and workflow cost-attribution ledger for aggregate AI API token usage.",
    isAccessibleForFree: true,
  };
  return <div className="subpage ledger-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><SiteHeader /><main><section className="subpage-hero section-pad ledger-hero"><div><span className="eyebrow eyebrow-lime">FREE WORKFLOW COST LEDGER</span><h1>See which workflow moved the AI bill.</h1><p>Attribute aggregate token usage to projects and features, apply the exact provider rate card, and compare cost per accepted answer. Import or export a transparent canonical CSV; everything runs locally in your browser.</p><div className="hero-actions"><Link className="button button-lime" href="#workflow-ledger">Build the ledger</Link><Link className="text-link" href="/audit">Reconcile one provider bill <span aria-hidden="true">→</span></Link></div><p className="provider-snapshot">Rate snapshot verified {priceSnapshotDate} · no login · no usage upload</p></div></section><section id="workflow-ledger" className="section-pad ledger-section"><div className="section-heading split-heading"><div><span className="eyebrow">PROJECT / WORKFLOW ATTRIBUTION</span><h2>Replace one total<br />with accountable rows.</h2></div><p>Provider reports group usage differently and do not know your application&apos;s feature names. Add project and workflow labels when you log requests, aggregate the token fields, then map each row to the exact rate band here.</p></div><WorkflowLedger /></section><section className="section-pad ledger-service-bridge"><div><span className="eyebrow eyebrow-lime">NEED THE ROWS GENERATED AUTOMATICALLY?</span><h2>Fixed £75 attribution setup for one workflow.</h2><p>I can instrument one authorized Node.js/TypeScript or Python codebase, add project/workflow and retry-aware usage fields, export this ledger schema, and verify it with focused tests.</p></div><Link className="button button-lime" href="/services/attribution" data-funnel-event="cta_service_attribution">See the exact scope</Link></section><section className="section-pad ledger-source-section"><div className="section-heading"><span className="eyebrow">WHY THE SCHEMA IS EXPLICIT</span><h2>Portable does not mean provider-blind.</h2></div><div className="audit-explainer"><article><span>01</span><h3>OpenAI grouping</h3><p>The organization Usage API can group completions by project, user, API key, model, batch, and service tier. Its Costs endpoint is the financial reconciliation source.</p><a href="https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage" target="_blank" rel="noreferrer">Official Usage API ↗</a></article><article><span>02</span><h3>Anthropic grouping</h3><p>The Messages Usage Report separates uncached input, cache creation, cache reads, and output, with workspace, API-key, model, tier, and context dimensions.</p><a href="https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_messages" target="_blank" rel="noreferrer">Official usage report ↗</a></article><article><span>03</span><h3>Application attribution</h3><p>OpenTelemetry defines provider, model, workflow, input, output, cache-read, and reasoning attributes, but cost and retry metrics remain an active standardization problem.</p><a href="https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/" target="_blank" rel="noreferrer">Official GenAI attributes ↗</a></article></div></section></main><footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/audit">Bill audit</Link><Link href="/pricing">Rates</Link><Link href="/library">Methods</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Not affiliated with or endorsed by any listed model provider.</p></footer></div>;
}
