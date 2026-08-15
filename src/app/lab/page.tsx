import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { ChatGPTPanel } from "@/components/chatgpt-panel";
import { LabWorkbench } from "@/components/lab-workbench";
import { SiteHeader } from "@/components/site-header";
import { getChatGPTContext, getProductAccountContext } from "@/lib/access";
import { tokenTips } from "@/lib/catalog";
import { listProviderCredentials } from "@/lib/provider-vault";
import { providerDefinitions } from "@/lib/providers";
import { planAtLeast } from "@/lib/plans";

export const metadata: Metadata = { title: "Controlled A/B lab" };
export const dynamic = "force-dynamic";

export default async function LabPage() {
  const request = new Request("http://tokengauge.internal/lab", { headers: await headers() });
  const [chatgpt, product] = await Promise.all([getChatGPTContext(request), getProductAccountContext(request)]);
  const supportedTips = tokenTips.filter((tip) => tip.experimentSupport === "supported");
  const connectedIds = new Set(product ? listProviderCredentials(product.accountId).map((item) => item.providerId) : []);
  const sources = [
    ...(chatgpt ? [{ id: "chatgpt", label: `ChatGPT${chatgpt.plan ? ` · ${chatgpt.plan}` : ""}` }] : []),
    ...providerDefinitions
      .filter((provider) => product && connectedIds.has(provider.id) && planAtLeast(product.accessPlan, provider.minimumPlan))
      .map((provider) => ({ id: provider.id, label: provider.label })),
  ];

  return (
    <div className="subpage">
      <SiteHeader />
      <main>
        <section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">PAIRED A/B LAB</span><h1>Test one variable.</h1><p>Use ChatGPT or an encrypted provider connection to compare request settings while the task and instructions remain identical.</p></section>
        {sources.length ? (
          <section className="lab-shell section-pad">
            <aside className="lab-note"><h2>{supportedTips.length} controlled recipes</h2><p>Each test makes two requests using the selected connection. Provider API requests are billed by that provider; ChatGPT requests count against its plan limits.</p><p>TokenGauge stores the provider, model, strategy label, and usage totals. It does not store either prompt, output, or plaintext API key.</p><p>Other catalogue cards remain guided protocols until they have a real adapter. Judge quality before declaring a winner.</p><ChatGPTPanel compact /><Link className="text-link" href="/settings">Manage API connections <span>→</span></Link></aside>
            <LabWorkbench sources={sources} strategies={supportedTips.map(({ id, title, action }) => ({ id, title, action }))} />
          </section>
        ) : <section className="gate-card"><h2>Connect a model source to run a paired test.</h2><p>{supportedTips.length} controlled request-setting recipes are available. Use ChatGPT for the starter lab, or connect any supported provider API key from Settings with Pro.</p><ChatGPTPanel /><Link className="button button-dark" href="/settings">Open provider settings</Link></section>}
      </main>
    </div>
  );
}
