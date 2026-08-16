import type { Metadata } from "next";
import { headers } from "next/headers";

import { AccountPanel } from "@/components/account-panel";
import { AccountSettings } from "@/components/account-settings";
import { ProviderSettings } from "@/components/provider-settings";
import { PrivacyControls } from "@/components/privacy-controls";
import { SiteHeader } from "@/components/site-header";
import { getOwnerAccountContext } from "@/lib/access";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const request = new Request("http://tokengauge.internal/settings", { headers: await headers() });
  const account = await getOwnerAccountContext(request);
  return <div className="subpage settings-page"><SiteHeader /><main><section className="subpage-hero section-pad"><span className="eyebrow eyebrow-lime">SETTINGS</span><h1>Control your account and connections.</h1><p>Use ChatGPT as your TokenGauge identity or keep a separate verified-email login. Provider keys and Stripe billing remain separate.</p></section>{account ? <div className="section-pad settings-page-body">{account.kind === "product" ? <AccountSettings currentName={account.name || "TokenGauge user"} /> : <section className="settings-card"><span className="eyebrow">CHATGPT SIGN-IN</span><h3>Identity managed by ChatGPT.</h3><p>You are signed in as {account.name || account.email || "a ChatGPT user"}. Password, email, and authenticator settings remain with ChatGPT; TokenGauge stores only its own access, provider connections, and experiment metadata.</p></section>}<ProviderSettings /><PrivacyControls /></div> : <section className="gate-card"><h2>Sign in to manage settings.</h2><p>Continue with ChatGPT or use a verified-email TokenGauge account before storing provider credentials.</p><AccountPanel /></section>}</main></div>;
}
