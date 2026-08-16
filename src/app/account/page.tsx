import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";

import { AccountCenter } from "@/components/account-center";
import { SiteHeader } from "@/components/site-header";
import { getOwnerAccountContext } from "@/lib/access";
import { authEmailReady } from "@/lib/auth-email";
import { isPaidPlanId } from "@/lib/plans";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const requestedPlan = (await searchParams).plan;
  const targetPlan = isPaidPlanId(requestedPlan) ? requestedPlan : "pro";
  const request = new Request("http://tokengauge.internal/account", { headers: await headers() });
  const owner = await getOwnerAccountContext(request);
  const chatgptIdentity = owner && owner.kind !== "product"
    ? { name: owner.name, email: owner.email, plan: owner.plan, accessPlan: owner.accessPlan }
    : undefined;
  return <div className="subpage account-page"><SiteHeader /><main><section className="subpage-hero account-hero section-pad"><div><span className="eyebrow eyebrow-lime">YOUR TOKENGAUGE IDENTITY</span><h1>Access belongs to you.</h1><p>Continue with ChatGPT and skip another password, or use a verified-email TokenGauge account when you prefer a separate identity.</p></div><Image src="/images/account-security-workbench.webp" alt="Abstract identity card protected by two verification paths and recovery tiles" width={1313} height={1198} sizes="(max-width: 900px) 100vw, 520px" priority /></section><section className="section-pad"><AccountCenter accountSystemReady={authEmailReady()} chatgptIdentity={chatgptIdentity} targetPlan={targetPlan} /></section></main></div>;
}
