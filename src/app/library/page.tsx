import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { SiteHeader } from "@/components/site-header";
import { TipCard } from "@/components/tip-card";
import { getAuthContext } from "@/lib/access";
import { publicTips, tokenTips } from "@/lib/catalog";

export const metadata: Metadata = { title: "Strategy library" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const request = new Request("http://tokengauge.internal/library", { headers: await headers() });
  const account = await getAuthContext(request);
  const pro = account?.pro ?? false;
  const visibleTips = pro ? tokenTips : publicTips;

  return (
    <div className="subpage">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad">
          <span className="eyebrow eyebrow-lime">STRATEGY LIBRARY</span>
          <h1>{pro ? "The complete field guide." : "Six strategies, fully open."}</h1>
          <p>{pro ? "Every card includes an action, a measurement plan, a caveat, and a primary source." : "Read the free evidence cards below. Founding access unlocks the complete set without sending paid content to your browser first."}</p>
        </section>
        <section className="library-grid section-pad">{visibleTips.map((tip) => <TipCard tip={tip} key={tip.id} />)}</section>
        {!pro ? <section className="gate-card"><h2>The remaining {tokenTips.length - publicTips.length} cards are locked.</h2><p>Sign in to purchase one-time founding access. The purchase does not include API credits and the A/B lab uses your own ChatGPT plan.</p><AccountPanel compact /></section> : null}
      </main>
    </div>
  );
}
