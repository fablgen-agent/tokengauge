import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { ResearchAtlasBrowser } from "@/components/research-atlas-browser";
import { SiteHeader } from "@/components/site-header";
import { getAuthContext } from "@/lib/access";
import { atlasSummary } from "@/lib/research-atlas";

export const metadata: Metadata = {
  title: "Research atlas",
  description: "Search 2,500 honestly labelled LLM cost-optimization candidates and compound test configurations.",
};
export const dynamic = "force-dynamic";

export default async function AtlasPage() {
  const request = new Request("http://tokengauge.internal/atlas", { headers: await headers() });
  const account = await getAuthContext(request);
  const pro = account?.pro ?? false;
  return (
    <div className="subpage atlas-page">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad atlas-hero">
          <div><span className="eyebrow eyebrow-lime">RESEARCH ATLAS · 2026-08-15</span><h1>2,500 paths to test. Zero invented guarantees.</h1><p>This is the larger research layer behind the curated library: candidates and compound configurations, not 2,500 distinct methods, adapters, or proven savings.</p><div className="hero-actions"><Link className="button button-lime" href="/library">Open 120 curated cards</Link><Link className="text-link" href="/lab">Run a supported test <span>→</span></Link></div></div>
          <dl className="atlas-summary"><div><dt>Atomic candidates</dt><dd>{atlasSummary.atomic.toLocaleString()}</dd></div><div><dt>Configurations</dt><dd>{atlasSummary.configurations.toLocaleString()}</dd></div><div><dt>Supported lab recipes</dt><dd>3</dd></div></dl>
        </section>
        <section className="atlas-trust section-pad"><strong>How to read the count</strong><p>One atomic candidate changes one intervention boundary. A configuration combines compatible atoms with a provider profile and workload fixture. Every release decision still needs a matched quality gate, current capability check, and actual usage or invoice data.</p></section>
        <ResearchAtlasBrowser pro={pro} />
      </main>
    </div>
  );
}
