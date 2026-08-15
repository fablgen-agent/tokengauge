import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { LabWorkbench } from "@/components/lab-workbench";
import { SiteHeader } from "@/components/site-header";
import { getAuthContext } from "@/lib/access";

export const metadata: Metadata = { title: "Private A/B lab" };
export const dynamic = "force-dynamic";

export default async function LabPage() {
  const request = new Request("http://tokengauge.internal/lab", { headers: await headers() });
  const account = await getAuthContext(request);

  return (
    <div className="subpage">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">PRIVATE A/B LAB</span><h1>Test the claim.</h1><p>Run the same task through baseline and candidate instructions in randomized order. Compare token totals without retaining prompts or outputs.</p></section>
        {account?.pro ? (
          <section className="lab-shell section-pad">
            <aside className="lab-note"><h2>Before you run</h2><p>Each test makes two model requests against your connected ChatGPT plan. Token counts do not represent an API invoice.</p><p>TokenGauge stores the model, strategy label, and usage totals. It does not store either prompt or either output.</p><p>Judge quality before declaring a winner. A smaller answer is not a saving when it fails the task.</p><AccountPanel compact /></aside>
            <LabWorkbench />
          </section>
        ) : <section className="gate-card"><h2>Pro access required.</h2><p>Connect ChatGPT, then unlock the lab and full evidence library with one payment.</p><AccountPanel /></section>}
      </main>
    </div>
  );
}
