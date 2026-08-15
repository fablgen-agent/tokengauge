import type { Metadata } from "next";
import Image from "next/image";

import { AccountCenter } from "@/components/account-center";
import { SiteHeader } from "@/components/site-header";
import { authEmailReady } from "@/lib/auth-email";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default function AccountPage() {
  return <div className="subpage account-page"><SiteHeader /><main><section className="subpage-hero account-hero section-pad"><div><span className="eyebrow eyebrow-lime">YOUR TOKENGAUGE IDENTITY</span><h1>Access belongs to you.</h1><p>Use a verified TokenGauge account for Pro ownership and billing. Connect ChatGPT separately only when you want to run lab requests.</p></div><Image src="/images/account-security-workbench.webp" alt="Abstract identity card protected by two verification paths and recovery tiles" width={1313} height={1198} sizes="(max-width: 900px) 100vw, 520px" priority /></section><section className="section-pad"><AccountCenter accountSystemReady={authEmailReady()} /></section></main></div>;
}
