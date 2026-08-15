import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { LibraryBrowser } from "@/components/library-browser";
import { SiteHeader } from "@/components/site-header";
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
          <h1>{pro ? "The complete field guide." : "Twelve methods, fully open."}</h1>
          <p>{pro ? "Every card includes an action, a measurement plan, a caveat, and a primary source." : "Read the free evidence cards below. Pro access unlocks the complete set without sending paid content to your browser first."}</p>
        </section>
        <LibraryBrowser tips={visibleTips} />
        {!pro ? <section className="gate-card"><h2>The remaining {tokenTips.length - publicTips.length} cards are locked.</h2><p>Sign in to purchase one-time Pro access. The purchase does not include API credits; supported lab recipes remain free and use your own ChatGPT plan.</p><AccountPanel compact /></section> : null}
      </main>
    </div>
  );
}
