import type { Metadata } from "next";
import { headers } from "next/headers";

import { ChatGPTPanel } from "@/components/chatgpt-panel";
import { LabWorkbench } from "@/components/lab-workbench";
import { SiteHeader } from "@/components/site-header";
import { getChatGPTContext } from "@/lib/access";
import { tokenTips } from "@/lib/catalog";

export const metadata: Metadata = { title: "Controlled A/B lab" };
export const dynamic = "force-dynamic";

export default async function LabPage() {
  const request = new Request("http://tokengauge.internal/lab", { headers: await headers() });
  const account = await getChatGPTContext(request);
  const supportedTips = tokenTips.filter((tip) => tip.experimentSupport === "supported");

  return (
    <div className="subpage">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">PAIRED A/B LAB</span><h1>Test one variable.</h1><p>Connect ChatGPT to compare supported request settings while the task and instructions remain identical.</p></section>
        {account ? (
          <section className="lab-shell section-pad">
            <aside className="lab-note"><h2>{supportedTips.length} controlled recipes</h2><p>Each test makes two model requests against your connected ChatGPT plan. Token counts do not represent an API invoice.</p><p>TokenGauge stores the model, strategy label, and usage totals. It does not store either prompt or either output.</p><p>Other catalogue cards are labeled as guided protocols until they have a real adapter. Judge quality before declaring a winner.</p><ChatGPTPanel compact /></aside>
            <LabWorkbench strategies={supportedTips.map(({ id, title, action }) => ({ id, title, action }))} />
          </section>
        ) : <section className="gate-card"><h2>Connect ChatGPT to run a paired test.</h2><p>{supportedTips.length} controlled request-setting recipes are free. TokenGauge uses your connected ChatGPT plan and stores usage totals—not prompts or outputs.</p><ChatGPTPanel /></section>}
      </main>
    </div>
  );
}
