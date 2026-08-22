"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PlanId } from "@/lib/plans";

type AccessState = "checking" | "free" | "launch" | "pro" | "pro_plus" | "ultimate";

const activePlanNames: Partial<Record<PlanId, string>> = {
  pro: "Pro",
  pro_plus: "Pro+",
  ultimate: "Ultimate",
};

export function SiteHeader() {
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/account", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<{ pro?: boolean; accessPlan?: PlanId; launchOffer?: { remaining?: number } }> : undefined)
      .then((account) => setAccess(account?.pro && account.accessPlan && account.accessPlan !== "free" ? account.accessPlan : (account?.launchOffer?.remaining ?? 0) > 0 ? "launch" : "free"))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAccess("free");
      });

    return () => controller.abort();
  }, []);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="TokenGauge home"><span className="brand-mark" aria-hidden="true">T</span>TokenGauge</Link>
      <nav aria-label="Main navigation">
        <Link href="/pricing">Rates</Link>
        <Link href="/pricing#calculator">Calculator</Link>
        <Link href="/ledger">Ledger</Link>
        <Link href="/library">Methods</Link>
        <Link href="/atlas">Atlas</Link>
        <Link href="/lab">Lab</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/account">Account</Link>
        <Link href="/settings">Settings</Link>
        {access in activePlanNames ? (
          <Link className="nav-cta nav-cta-active" href="/account" aria-label={`TokenGauge ${activePlanNames[access as PlanId]} access is active`}>{activePlanNames[access as PlanId]} active</Link>
        ) : access === "launch" ? (
          <Link className="nav-cta" href="/#pricing" data-funnel-event="cta_pricing" aria-label="Get launch Pro access for £5 one time">Get Pro £5</Link>
        ) : access === "free" ? (
          <Link className="nav-cta" href="/#pricing" data-funnel-event="cta_pricing" aria-label="Get Pro access for £9 one time">Get Pro £9</Link>
        ) : (
          <span className="nav-cta nav-cta-pending" aria-label="Checking TokenGauge access">Checking…</span>
        )}
      </nav>
    </header>
  );
}
