"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { accountPlanCallbackUrl } from "@/lib/account-plan";
import type { AtlasKind, AtlasRecord } from "@/lib/research-atlas";

type AtlasResponse = {
  access: "pro" | "sample";
  items: AtlasRecord[];
  total: number;
  page: number;
  pageCount: number;
  locked: number;
  error?: string;
};

const supportLabels: Record<string, string> = {
  "research-candidate": "Atomic candidate",
  "provider-profile-candidate": "Provider-scoped candidate",
  "guided-protocol": "Guided compound protocol",
  "research-protocol": "Research compound protocol",
  "research-configuration": "Materialized research configuration",
};

export function ResearchAtlasBrowser({ pro }: { pro: boolean }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AtlasKind | "all">("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AtlasResponse>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const parameters = new URLSearchParams({ q: query, kind, page: String(page) });
      fetch(`/api/atlas?${parameters}`, { cache: "no-store", credentials: "same-origin", signal: controller.signal })
        .then(async (response) => {
          const body = await response.json() as AtlasResponse;
          if (!response.ok) throw new Error(body.error || "The atlas could not be loaded.");
          setResult(body); setError(undefined);
        })
        .catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          setError(reason instanceof Error ? reason.message : "The atlas could not be loaded.");
        });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [kind, page, query]);

  function changeQuery(value: string) { setQuery(value); setPage(1); }
  function changeKind(value: AtlasKind | "all") { setKind(value); setPage(1); }

  return (
    <section className="atlas-browser section-pad">
      <div className="atlas-toolbar">
        <label><span>Search research</span><input type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Cache, Bedrock, retries, RAG…" /></label>
        <label><span>Record type</span><select value={kind} onChange={(event) => changeKind(event.target.value as AtlasKind | "all")}><option value="all">All records</option><option value="atomic">Atomic candidates</option><option value="configuration">Compound configurations</option></select></label>
        <p>{result ? `${result.total.toLocaleString()} result${result.total === 1 ? "" : "s"}` : "Loading…"}</p>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="atlas-grid">
        {result?.items.map((record) => (
          <article className="atlas-card" key={record.id}>
            <div className="atlas-card-meta"><code>{record.id}</code><span>{supportLabels[record.support] ?? record.support}</span></div>
            <h2>{record.title}</h2>
            <p>{record.summary}</p>
            <dl><div><dt>Scope</dt><dd>{record.provider} · {record.scope}</dd></div><div><dt>Try</dt><dd>{record.action}</dd></div><div><dt>Measure</dt><dd>{record.measurement}</dd></div><div><dt>Guardrail</dt><dd>{record.caveat}</dd></div></dl>
            <div className="atlas-card-foot"><span>{record.grade} evidence · checked {record.lastVerified}</span><a href={record.source.url} target="_blank" rel="noreferrer">{record.source.label} ↗</a></div>
          </article>
        ))}
      </div>
      {result && result.items.length === 0 ? <p className="empty-state">No research records match those filters.</p> : null}
      {result && result.pageCount > 1 ? <nav className="atlas-pagination" aria-label="Research atlas pages"><button type="button" disabled={result.page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {result.page} of {result.pageCount}</span><button type="button" disabled={result.page >= result.pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></nav> : null}
      {!pro ? <div className="atlas-inline-gate"><div><span className="eyebrow">PRO RESEARCH ACCESS</span><h2>{result?.locked.toLocaleString() ?? "2,488"} additional rows stay server-side.</h2><p>The sample is open. Pro unlocks server-filtered access to all 2,500 rows; it does not turn candidates into proven savings or claim that configurations are distinct methods.</p></div><Link className="button button-dark" href={accountPlanCallbackUrl("pro")} data-funnel-event="cta_account">Review Pro access</Link></div> : null}
    </section>
  );
}
