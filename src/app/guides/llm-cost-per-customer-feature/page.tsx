import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { priceSnapshotDate } from "@/lib/costs";

const canonicalUrl = "https://tokengauge.enby.fish/guides/llm-cost-per-customer-feature";

export const metadata: Metadata = {
  title: "How to calculate LLM cost per customer and feature",
  description: "A practical, privacy-conscious schema for attributing AI API token cost to customers, features, retries, and accepted answers, then reconciling it to provider billing.",
  alternates: { canonical: "/guides/llm-cost-per-customer-feature" },
  openGraph: {
    type: "article",
    title: "How to calculate LLM cost per customer and feature",
    description: "Instrument model calls, price the right token buckets, expose retry waste, and reconcile the estimate to the provider bill.",
    url: "/guides/llm-cost-per-customer-feature",
  },
};

const eventFields = [
  ["tenant_label", "A stable, opaque customer or workspace label. Do not use an email address."],
  ["project + workflow", "The product area and feature that caused the call."],
  ["provider + model", "The actual returned model where the provider exposes it, not only the requested alias."],
  ["input + cache buckets", "Keep cache reads and provider-reported cache writes separate because each can have a different rate."],
  ["output tokens", "Record the provider-returned total for the call; reasoning may already be included."],
  ["attempt + accepted", "Count every paid attempt, and mark whether its result became the accepted answer."],
  ["request ID + time", "A deduplication and reconciliation key. Keep it in the event log, not the public CSV."],
] as const;

const faq = [
  {
    question: "Is the token-rate calculation the same as my provider invoice?",
    answer: "No. It is a modeled direct token cost. Credits, taxes, commitments, tools, storage, regional pricing, and other provider charges can make the invoice differ, so reconcile the model to the provider billing export.",
  },
  {
    question: "Do I need to store prompts or model outputs?",
    answer: "No. Cost attribution can use opaque customer labels, workflow labels, rate-card identity, aggregate token buckets, attempts, and accepted-answer counts without storing prompt or output content.",
  },
  {
    question: "How should retries be counted?",
    answer: "Count each provider request as an attempt, including failed or discarded attempts that consumed billable tokens. Count an accepted answer only when the application actually uses that result.",
  },
];

export default function LlmCostAttributionGuidePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to calculate LLM cost per customer and feature",
      description: metadata.description,
      url: canonicalUrl,
      datePublished: "2026-08-16",
      dateModified: "2026-08-16",
      author: { "@type": "Organization", name: "TokenGauge" },
      publisher: { "@type": "Organization", name: "TokenGauge" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <div className="subpage guide-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        <article>
          <header className="subpage-hero section-pad guide-hero">
            <div>
              <span className="eyebrow eyebrow-lime">PRACTICAL GUIDE · 12 MIN READ</span>
              <h1>Calculate LLM cost per customer and feature.</h1>
              <p>Turn provider token totals into an application ledger that shows which customer, workflow, retry loop, or accepted answer moved the bill—without logging prompts or personal data.</p>
              <div className="hero-actions">
                <Link className="button button-lime" href="/ledger" data-funnel-event="cta_ledger">Use the free ledger</Link>
                <Link className="text-link" href="/services/attribution" data-funnel-event="cta_service_attribution">Get it implemented for £75 <span aria-hidden="true">→</span></Link>
              </div>
              <p className="provider-snapshot">Rate snapshot verified {priceSnapshotDate} · modeled cost is not an invoice</p>
            </div>
            <aside className="guide-equation" aria-label="Core attribution formula">
              <span>THE CORE EQUATION</span>
              <strong>Cost per accepted answer</strong>
              <code>Σ cost of every attempt ÷ accepted answers</code>
              <p>Group the numerator by an opaque customer label and workflow. A cheap request is not cheap if retries or discarded answers multiply it.</p>
            </aside>
          </header>

          <nav className="guide-toc section-pad" aria-label="Guide contents">
            <span>CONTENTS</span>
            <a href="#model">1. Accounting model</a>
            <a href="#fields">2. Event fields</a>
            <a href="#export">3. Ledger export</a>
            <a href="#reconcile">4. Reconciliation</a>
            <a href="#mistakes">5. Common mistakes</a>
          </nav>

          <section id="model" className="section-pad guide-section">
            <div className="guide-section-label"><span>01</span><p>ACCOUNTING MODEL</p></div>
            <div className="guide-prose">
              <h2>Keep two ledgers, then make them agree.</h2>
              <p>Your provider knows billable usage, but it usually does not know that a request belonged to customer <code>tenant_7f42</code> or the <code>support_reply</code> feature. Your application knows that context. Reliable attribution joins the two views instead of treating either as complete.</p>
              <div className="guide-dual-ledger">
                <article><span>PROVIDER LEDGER</span><h3>What was billed?</h3><p>Requests, model and service tier, token buckets, cache use, batch status, credits, and provider-specific charges.</p></article>
                <article><span>APPLICATION LEDGER</span><h3>Why did it happen?</h3><p>Opaque tenant, project, feature, attempt, accepted result, and the application request ID that connects the call to a useful outcome.</p></article>
              </div>
              <p className="guide-callout"><strong>Privacy boundary:</strong> cost accounting does not require prompt text, output text, email addresses, or customer names. Use stable pseudonymous identifiers and protect the mapping in your existing application database.</p>
            </div>
          </section>

          <section id="fields" className="section-pad guide-section guide-section-alt">
            <div className="guide-section-label"><span>02</span><p>EVENT FIELDS</p></div>
            <div className="guide-prose">
              <h2>Capture one small event after every model call.</h2>
              <p>Record the provider response&apos;s usage values when available. Do not estimate tokens from characters after the fact unless the provider returns no usage data, and label any fallback estimate clearly.</p>
              <div className="guide-field-list" role="list">
                {eventFields.map(([field, reason]) => <div key={field} role="listitem"><code>{field}</code><p>{reason}</p></div>)}
              </div>
              <div className="guide-source-note">
                <p><strong>Provider details differ.</strong> OpenAI&apos;s organization Usage API exposes model, project, user, API-key, batch, service-tier, input, cached-input, and output dimensions. Anthropic separately reports uncached input, cache creation, cache reads, and output. OpenTelemetry&apos;s GenAI conventions provide portable model, operation, workflow, cache-read, reasoning, and token attributes, but the conventions are still evolving.</p>
                <div><a href="https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage" target="_blank" rel="noreferrer">OpenAI Usage API ↗</a><a href="https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_messages" target="_blank" rel="noreferrer">Anthropic usage report ↗</a><a href="https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/" target="_blank" rel="noreferrer">OpenTelemetry GenAI attributes ↗</a></div>
              </div>
            </div>
          </section>

          <section id="export" className="section-pad guide-section">
            <div className="guide-section-label"><span>03</span><p>LEDGER EXPORT</p></div>
            <div className="guide-prose">
              <h2>Aggregate events into a reviewable CSV.</h2>
              <p>For the free TokenGauge ledger, use <code>project</code> as the opaque customer or workspace grouping and <code>workflow</code> as the feature. Aggregate rows over one stated time window and preserve the event-level request IDs in your own system for deduplication.</p>
              <div className="guide-code-block" aria-label="TokenGauge CSV example">
                <div><span>tokengauge-ledger.csv</span><span>canonical schema</span></div>
                <pre><code>{`project,workflow,rate_card_id,input_tokens,cached_input_tokens,output_tokens,attempts,accepted_answers
tenant_7f42,support_reply,openai:gpt-5.6-terra:standard:short,820000,410000,96000,125,103
tenant_a19c,document_extract,openai:gpt-5.6-luna:standard:short,360000,0,28000,84,79`}</code></pre>
              </div>
              <div className="guide-metric-grid">
                <article><span>LEDGER-MODELED TOKEN COST</span><p><code>((uncached input × input rate) + (cached input × cache-read rate) + (output × output rate)) ÷ 1,000,000</code> Add explicit cache-write, storage, and tool charges to the explained residual.</p></article>
                <article><span>NON-ACCEPTED ATTEMPT COST</span><p>Allocate the row cost by the share of attempts that did not become accepted answers. Treat this as a diagnostic estimate when attempts vary materially in size.</p></article>
                <article><span>CUSTOMER GROSS MARGIN INPUT</span><p>Attributed model cost is one direct-cost input, not complete cost of goods sold. Add tools, storage, search, hosting, support, and payment costs separately.</p></article>
              </div>
              <Link className="button button-dark" href="/ledger" data-funnel-event="cta_ledger">Open the browser-local ledger</Link>
            </div>
          </section>

          <section id="reconcile" className="section-pad guide-section guide-section-dark">
            <div className="guide-section-label"><span>04</span><p>RECONCILIATION</p></div>
            <div className="guide-prose">
              <h2>Prove the estimate against the bill.</h2>
              <ol className="guide-steps">
                <li><span>1</span><div><h3>Freeze the window</h3><p>Use the same UTC start and end time in the application export and provider report. Late-arriving usage should go into the next reconciliation run or an explicit adjustment.</p></div></li>
                <li><span>2</span><div><h3>Separate every rate dimension</h3><p>Do not merge models, long-context tiers, service tiers, regions, batch jobs, or cache modes until after pricing. Map each group to the rate effective when the request ran.</p></div></li>
                <li><span>3</span><div><h3>Compare counts before money</h3><p>Reconcile request counts and token buckets first. A money mismatch is much easier to diagnose after duplicate requests, missing streams, and retry events are removed.</p></div></li>
                <li><span>4</span><div><h3>Explain the residual</h3><p>Record credits, taxes, commitments, non-token tools, rounding, and unsupported charge types. Never force the modeled token total to equal the invoice by hiding the difference.</p></div></li>
              </ol>
              <p className="guide-dark-note">A good control is explicit: <strong>provider total = attributed token estimate + explained residual</strong>. Keep the residual visible even when it is zero.</p>
            </div>
          </section>

          <section id="mistakes" className="section-pad guide-section">
            <div className="guide-section-label"><span>05</span><p>COMMON MISTAKES</p></div>
            <div className="guide-prose">
              <h2>Five ways attribution quietly lies.</h2>
              <div className="guide-mistakes">
                <article><span>01</span><h3>Pricing the requested alias</h3><p>Record the model actually returned where possible. Aliases and routed models can move.</p></article>
                <article><span>02</span><h3>Ignoring cache buckets</h3><p>Cached input may have a different rate; cache creation can be another rate again.</p></article>
                <article><span>03</span><h3>Counting only successes</h3><p>Discarded, failed, and retried calls can still consume billable tokens.</p></article>
                <article><span>04</span><h3>Calling an estimate an invoice</h3><p>Published token rates do not capture every credit, commitment, tax, tool, or storage charge.</p></article>
                <article><span>05</span><h3>Using personal data as labels</h3><p>A stable opaque ID is enough. Keep names, emails, prompts, and outputs out of the cost ledger.</p></article>
              </div>
            </div>
          </section>

          <section className="section-pad guide-faq">
            <div><span className="eyebrow">QUICK ANSWERS</span><h2>Before you instrument.</h2></div>
            <div>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
          </section>

          <section className="section-pad guide-final-cta">
            <div><span className="eyebrow eyebrow-lime">ONE CODEBASE · ONE PROVIDER · TESTED EXPORT</span><h2>Want the ledger path installed?</h2><p>The fixed £75 service adds project/workflow attribution, retry-aware usage fields, a canonical CSV export, focused tests, and one revision after a written scope.</p></div>
            <Link className="button button-lime" href="/services/attribution" data-funnel-event="cta_service_attribution">See the exact £75 scope</Link>
          </section>
        </article>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/ledger">Free ledger</Link><Link href="/audit">Bill audit</Link><Link href="/pricing">Rates</Link><Link href="/services/attribution">Attribution service</Link></nav><p>Independent software. Published rate calculations are estimates; reconcile them to your provider&apos;s billing records.</p></footer>
    </div>
  );
}
