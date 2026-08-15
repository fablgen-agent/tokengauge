import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { AccountSettings } from "@/components/account-settings";
import { ProviderSettings } from "@/components/provider-settings";
import { SiteHeader } from "@/components/site-header";
import { getProductAccountContext } from "@/lib/access";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const request = new Request("http://tokengauge.internal/settings", { headers: await headers() });
  const account = await getProductAccountContext(request);
  return <div className="subpage settings-page"><SiteHeader /><main><section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">SETTINGS</span><h1>Control your account and connections.</h1><p>Provider keys stay separate from billing and from the optional ChatGPT connection.</p></section>{account ? <div className="section-pad settings-page-body"><AccountSettings currentName={account.name || "TokenGauge user"} /><ProviderSettings /></div> : <section className="gate-card"><h2>Sign in to manage settings.</h2><p>A verified TokenGauge account is required before provider credentials can be stored.</p><AccountPanel /></section>}</main></div>;
}
