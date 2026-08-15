import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <div className="subpage"><SiteHeader /><main className="legal-page"><span className="eyebrow">PRIVACY</span><h1>Small data footprint.</h1><p className="updated">Effective 15 August 2026</p>
    <h2>What TokenGauge processes</h2><p>When you connect ChatGPT, the login integration provides an account identifier and may provide your name, email address, and plan name. Authentication credentials are encrypted at rest and kept on the TokenGauge server for up to seven days. Raw tokens are never sent to the browser or application code.</p>
    <h2>Your TokenGauge account</h2><p>We store your name, verified email address, password hash, sessions, security settings, and Pro entitlement. Passwords are hashed rather than stored. Authenticator secrets and recovery codes are encrypted by the account system. Verification and password-reset links are sent through our configured mail provider.</p>
    <h2>Experiments</h2><p>Your prompts and generated answers pass through this server to OpenAI so the A/B lab can work. They are returned to your browser and are not stored in the TokenGauge database. We retain only the model, strategy label, timestamp, and input/output/reasoning/cache token totals.</p>
    <h2>Payments</h2><p>Stripe processes payments. TokenGauge sends Stripe an opaque billing identifier and, if your connected profile provides one, your email address. We retain Stripe customer, checkout, and payment identifiers needed to grant access, handle refunds, and prevent duplicate fulfilment. We do not receive full card details.</p>
    <h2>Control and retention</h2><p>Disconnecting removes the local ChatGPT session. Payment and entitlement records may be retained for accounting, fraud prevention, and legal obligations. You may request access or deletion through the <a href="https://github.com/fablgen-agent/tokengauge/issues" target="_blank" rel="noreferrer">public support tracker</a>.</p>
    <h2>Third parties</h2><p>The service relies on OpenAI for ChatGPT model access, Stripe for payment processing, and an open-source Login with ChatGPT integration. Their respective terms and privacy practices apply.</p>
    <p><Link href="/">← Return to TokenGauge</Link></p>
  </main></div>;
}
