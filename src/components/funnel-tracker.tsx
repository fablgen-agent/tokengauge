"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import type { FunnelEvent } from "@/lib/funnel-events";
import { funnelMeasurementDisabled } from "@/lib/funnel-preference";

const routeEvents: Array<[string, FunnelEvent]> = [
  ["/pricing/changes", "view_pricing_changes"],
  ["/pricing/media", "view_pricing_media"],
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
  ["/guides/autonomous-agent-token-budget", "view_budget_guide"],
  ["/services/attribution", "view_service_attribution"],
  ["/services/budget-guard", "view_service_budget_guard"],
  ["/work", "view_work_request"],
];

export function routeEvent(pathname: string, hostname = ""): FunnelEvent | undefined {
  if (hostname === "work.enby.fish" && pathname === "/") return "view_work_request";
  if (pathname === "/") return "view_home";
  if (pathname === "/pricing/changes") return "view_pricing_changes";
  if (pathname === "/pricing/media") return "view_pricing_media";
  if (pathname.startsWith("/pricing/")) return "view_provider_pricing";
  return routeEvents.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function sendFunnelEvent(event: FunnelEvent): void {
  if (funnelMeasurementDisabled()) return;
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
    // Apply an explicit browser preference even on routes that have no view counter.
    funnelMeasurementDisabled();
  }, [pathname]);

  useEffect(() => {
    const event = routeEvent(pathname, window.location.hostname);
    if (!event) return;
    if (funnelMeasurementDisabled()) return;
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
