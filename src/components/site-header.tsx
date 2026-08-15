"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AccessState = "checking" | "free" | "pro";

export function SiteHeader() {
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/account", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<{ pro?: boolean }> : undefined)
      .then((account) => setAccess(account?.pro ? "pro" : "free"))
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
        <Link href="/#rates">Rates</Link>
        <Link href="/#calculator">Calculator</Link>
        <Link href="/library">Methods</Link>
        <Link href="/lab">Lab</Link>
        <Link href="/account">Account</Link>
        {access === "pro" ? (
          <Link className="nav-cta nav-cta-active" href="/account" aria-label="TokenGauge Pro access is active">Pro active</Link>
        ) : access === "free" ? (
          <Link className="nav-cta" href="/#pricing" aria-label="Get Pro access for £9 one time">Get Pro £9</Link>
        ) : (
          <span className="nav-cta nav-cta-pending" aria-label="Checking TokenGauge access">Checking…</span>
        )}
      </nav>
    </header>
  );
}
