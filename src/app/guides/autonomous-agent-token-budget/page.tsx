import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const canonicalUrl = "https://tokengauge.enby.fish/guides/autonomous-agent-token-budget";

export const metadata: Metadata = {
  title: "How to cap an autonomous AI agent's token usage",
  description: "A practical pre-call token-budget pattern for stopping runaway autonomous LLM loops, reporting cumulative usage, and degrading without one final over-budget model call.",
  alternates: { canonical: "/guides/autonomous-agent-token-budget" },
  openGraph: {
    type: "article",
    title: "How to cap an autonomous AI agent's token usage",
    description: "Estimate the next request, reserve its output allowance, stop before provider dispatch, and report the accounting limits honestly.",
    url: "/guides/autonomous-agent-token-budget",
  },
};

const guardChecks = [
  ["Reset once", "Create a fresh counter at the start of each autonomous run, not once per process or Agent instance."],
  ["Count the real request", "Estimate the serialized history and active tool schemas that will actually be sent, not only the newest user message."],
  ["Check before dispatch", "Subtract the estimated request from the remaining budget before the provider adapter is invoked."],
  ["Bound the response", "Pass the remaining allowance as the smallest output ceiling supported by that provider path."],
  ["Account before awaiting", "Increment the request and call counters before dispatch because an accepted request may still fail locally afterward."],
  ["Stop without another call", "Return a deterministic summary when exhausted. An LLM-generated budget-exhaustion summary spends the budget it is meant to protect."],
] as const;

const faq = [
  {
    question: "Does a local token estimate guarantee my provider invoice cannot exceed the limit?",
    answer: "No. Tokenizers, hidden reasoning, tools, images, audio, cache writes, storage, regional uplifts, taxes, and provider-specific billing can differ. Use provider-reported usage for reconciliation and describe the local guard as an application control, not an invoice guarantee.",
  },
  {
    question: "Why not rely only on a maximum loop count?",
    answer: "A loop count bounds calls but not prompt growth. Re-sending a growing history can make later calls far more expensive than early calls, so keep a call ceiling and a cumulative token or spend boundary.",
  },
  {
    question: "Should the exhausted summary call the model?",
    answer: "No. Build it from known task, subtask, status, call-count, and usage fields. The exhaustion path must work when no output allowance remains.",
  },
];

export default function AutonomousAgentTokenBudgetGuidePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to cap an autonomous AI agent's token usage",
      description: metadata.description,
      url: canonicalUrl,
      datePublished: "2026-08-22",
      dateModified: "2026-08-22",
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
              <span className="eyebrow eyebrow-lime">PRACTICAL GUIDE · 9 MIN READ</span>
              <h1>Cap an autonomous agent before the next model call.</h1>
              <p>A growing full-history loop can turn a reasonable call limit into an unpredictable bill. Put the budget check directly in front of every provider request, then stop with a summary that does not call the model again.</p>
              <div className="hero-actions">
                <Link className="button button-lime" href="/services/budget-guard" data-funnel-event="cta_budget_guide_service">Get one path implemented for £75</Link>
                <Link className="text-link" href="/ledger" data-funnel-event="cta_ledger">Measure workflow cost first <span aria-hidden="true">→</span></Link>
              </div>
              <p className="provider-snapshot">Application control · provider billing remains authoritative · no guaranteed saving</p>
            </div>
            <aside className="guide-equation" aria-label="Pre-call budget invariant">
              <span>THE PRE-CALL INVARIANT</span>
              <strong>Next call must fit.</strong>
              <code>request estimate + output allowance ≤ remaining run budget</code>
              <p>If the request itself cannot fit, do not invoke the provider. Return the last known state and the accounting report.</p>
            </aside>
          </header>

          <nav className="guide-toc section-pad" aria-label="Guide contents">
            <span>CONTENTS</span>
            <a href="#failure">1. Failure mode</a>
            <a href="#guard">2. Guard sequence</a>
            <a href="#example">3. Reference pattern</a>
            <a href="#accounting">4. Honest accounting</a>
            <a href="#evidence">5. Public implementation</a>
          </nav>

          <section id="failure" className="section-pad guide-section">
            <div className="guide-section-label"><span>01</span><p>FAILURE MODE</p></div>
            <div className="guide-prose">
              <h2>Loop ceilings do not bound a growing prompt.</h2>
              <p>An autonomous planner commonly serializes its whole conversation before each call. Tool results, retries, failed plans, and subtask notes make that request larger on every iteration. A limit of 100 outer iterations and 20 calls per subtask can still permit thousands of calls, while the last calls carry the largest histories.</p>
              <div className="guide-dual-ledger">
                <article><span>CALL CEILING</span><h3>How many times?</h3><p>Keep explicit outer-loop and per-subtask limits as constructor settings. They are safety controls and should not require editing module constants.</p></article>
                <article><span>RUN BUDGET</span><h3>How much text?</h3><p>Track the cumulative request and response allowance across the entire run. Check it at the single provider-call seam shared by planning, execution, and final summary.</p></article>
              </div>
              <p className="guide-callout"><strong>Critical edge:</strong> the final summary is another model call unless you deliberately make budget exhaustion deterministic. Route normal summaries through the guard and reserve a non-LLM fallback.</p>
            </div>
          </section>

          <section id="guard" className="section-pad guide-section guide-section-alt">
            <div className="guide-section-label"><span>02</span><p>GUARD SEQUENCE</p></div>
            <div className="guide-prose">
              <h2>Put one wrapper around every autonomous call.</h2>
              <p>The safest seam is the method immediately before the provider adapter. Planning, subtask execution, retries that call the model, and final summarization must all pass through it.</p>
              <div className="guide-field-list" role="list">
                {guardChecks.map(([check, reason]) => <div key={check} role="listitem"><code>{check}</code><p>{reason}</p></div>)}
              </div>
            </div>
          </section>

          <section id="example" className="section-pad guide-section">
            <div className="guide-section-label"><span>03</span><p>REFERENCE PATTERN</p></div>
            <div className="guide-prose">
              <h2>Reserve the next request, then reconcile the response.</h2>
              <p>This deliberately generic pattern shows the control flow. Production code should use the active model&apos;s tokenizer where possible and the provider&apos;s returned usage fields after the call.</p>
              <div className="guide-code-block" aria-label="Autonomous token budget pseudocode">
                <div><span>bounded-model-call.ts</span><span>pseudocode</span></div>
                <pre><code>{`const requestTokens = estimate(serializedHistory, toolSchemas)
const remaining = maxRunTokens - runTokens
const outputAllowance = remaining - requestTokens

if (outputAllowance < 1) {
  return deterministicBudgetSummary(state, runTokens, callCount)
}

runTokens += requestTokens
callCount += 1

const response = await provider.call({
  messages,
  tools,
  max_tokens: Math.min(requestedMax, outputAllowance),
})

runTokens += reportedOrEstimatedOutputTokens(response)`}</code></pre>
              </div>
              <p>For concurrent users or processes, reserve modeled monetary exposure atomically in the application&apos;s shared store before dispatch. A process-local counter is only honest for an explicitly single-instance boundary.</p>
            </div>
          </section>

          <section id="accounting" className="section-pad guide-section guide-section-dark">
            <div className="guide-section-label"><span>04</span><p>HONEST ACCOUNTING</p></div>
            <div className="guide-prose">
              <h2>Report what the guard measured—and what it did not.</h2>
              <ol className="guide-steps">
                <li><span>1</span><div><h3>Calls completed</h3><p>Increment before dispatch. A provider may accept and bill a request even when response parsing or local persistence later fails.</p></div></li>
                <li><span>2</span><div><h3>Estimated request text</h3><p>Include serialized history and active tool schemas. Label local tokenizer counts as estimates when the provider does not return prompt usage.</p></div></li>
                <li><span>3</span><div><h3>Provider-returned usage</h3><p>Prefer the response&apos;s input, cache, output, and reasoning fields for reconciliation. Preserve missing fields instead of silently treating them as zero.</p></div></li>
                <li><span>4</span><div><h3>Excluded charges</h3><p>State whether images, audio, tools, cache writes, cache storage, hidden reasoning, regional tiers, taxes, and credits are outside the local estimate.</p></div></li>
              </ol>
              <p className="guide-dark-note">A token guard can bound one declared request path. It is not an absolute invoice cap when other callers, unbounded tools, parallel agents, or provider-specific charges remain outside that boundary.</p>
            </div>
          </section>

          <section id="evidence" className="section-pad guide-section">
            <div className="guide-section-label"><span>05</span><p>PUBLIC IMPLEMENTATION</p></div>
            <div className="guide-prose">
              <h2>A current high-priority issue exposes the same failure mode.</h2>
              <p>On 22 August 2026, the Swarms repository owner opened a high-priority issue describing an autonomous loop with iteration ceilings, growing full-history requests, and no token or cost boundary. Fablgen Agent submitted a focused implementation that adds a pre-call run budget, configurable loop limits, cumulative reporting, and a no-extra-call exhaustion summary.</p>
              <p>The contribution is public and review-ready, but it is still an unmerged pull request. It is evidence of the implementation pattern and tests—not Swarms endorsement, adoption, a customer, or a paid engagement.</p>
              <div className="guide-source-note">
                <p><strong>Inspect the exact scope.</strong> The issue states the requested failure boundary. The pull request shows the proposed patch, tests, local-estimation caveats, and review status.</p>
                <div><a href="https://github.com/kyegomez/swarms/issues/1976" target="_blank" rel="noreferrer">Swarms issue 1976 ↗</a><a href="https://github.com/kyegomez/swarms/pull/1987" target="_blank" rel="noreferrer">Proposed implementation PR 1987 ↗</a></div>
              </div>
            </div>
          </section>

          <section className="section-pad guide-faq">
            <div><span className="eyebrow">QUICK ANSWERS</span><h2>Before you call it a cap.</h2></div>
            <div>{faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
          </section>

          <section className="section-pad guide-final-cta">
            <div><span className="eyebrow eyebrow-lime">ONE CODEBASE · ONE PROVIDER PATH · TESTED REFUSAL</span><h2>Want the guard installed?</h2><p>The fixed £75 scope adds one pre-call exposure reservation, post-call usage reconciliation, an agreed non-AI fallback, focused no-call tests, and one revision. Written scope comes before payment.</p></div>
            <Link className="button button-lime" href="/services/budget-guard" data-funnel-event="cta_budget_guide_service">See the exact £75 scope</Link>
          </section>
        </article>
      </main>
      <footer className="site-footer section-pad"><div><Link className="brand" href="/"><span className="brand-mark">T</span>TokenGauge</Link><p>Measure the cost. Preserve the answer.</p></div><nav aria-label="Footer navigation"><Link href="/services/budget-guard">Budget guard</Link><Link href="/ledger">Free ledger</Link><Link href="/audit">Bill audit</Link><Link href="/privacy">Privacy</Link></nav><p>Independent software. Provider billing records remain authoritative.</p></footer>
    </div>
  );
}
