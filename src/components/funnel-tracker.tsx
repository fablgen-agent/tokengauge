"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import type { FunnelEvent } from "@/lib/funnel-events";

const routeEvents: Array<[string, FunnelEvent]> = [
  ["/pricing/changes", "view_pricing_changes"],
  ["/pricing", "view_pricing"],
  ["/compare", "view_compare"],
  ["/atlas", "view_atlas"],
  ["/library", "view_library"],
  ["/lab", "view_lab"],
  ["/account", "view_account"],
  ["/dashboard", "view_dashboard"],
  ["/settings", "view_settings"],
  ["/audit", "view_audit"],
  ["/ledger", "view_ledger"],
  ["/guides/llm-cost-per-customer-feature", "view_attribution_guide"],
  ["/services/attribution", "view_service_attribution"],
];

function routeEvent(pathname: string): FunnelEvent | undefined {
  if (pathname === "/") return "view_home";
  if (pathname === "/pricing/changes") return "view_pricing_changes";
  if (pathname.startsWith("/pricing/")) return "view_provider_pricing";
  return routeEvents.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function sendFunnelEvent(event: FunnelEvent): void {
  void fetch("/api/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function FunnelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const event = routeEvent(pathname);
    if (!event) return;
    const marker = `tokengauge:funnel:${event}`;
    try {
      if (sessionStorage.getItem(marker)) return;
      sessionStorage.setItem(marker, "1");
    } catch {
      // Storage can be disabled. The aggregate still remains anonymous.
    }
    sendFunnelEvent(event);
  }, [pathname]);

  useEffect(() => {
    function recordClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-funnel-event]") : null;
      const funnelEvent = target?.dataset.funnelEvent as FunnelEvent | undefined;
      if (funnelEvent) sendFunnelEvent(funnelEvent);
    }
    document.addEventListener("click", recordClick);
    return () => document.removeEventListener("click", recordClick);
  }, []);

  return null;
}
