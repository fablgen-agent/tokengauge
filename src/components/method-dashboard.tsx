"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Method = { id: string; title: string; category: string; access: string; status?: string };

const statusLabels: Record<string, string> = {
  none: "Not tracked",
  planned: "Planned",
  testing: "Testing",
  adopted: "Adopted",
  dismissed: "Dismissed",
};

export function MethodDashboard({ methods }: { methods: readonly Method[] }) {
  const [items, setItems] = useState(() => methods.map((method) => ({ ...method, status: method.status || "none" })));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<string>();

  const filtered = useMemo(() => items.filter((method) => {
    const matchesQuery = `${method.title} ${method.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || method.status === filter;
    return matchesQuery && matchesFilter;
  }), [items, query, filter]);

  async function update(methodId: string, status: string) {
    const previous = items;
    setItems((current) => current.map((item) => item.id === methodId ? { ...item, status } : item));
    setBusy(methodId); setError(undefined);
    const response = await fetch("/api/dashboard/methods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ methodId, status }),
    });
    setBusy(undefined);
    if (!response.ok) {
      const result = await response.json() as { error?: string };
      setItems(previous);
      setError(result.error || "Method status could not be saved.");
    }
  }

  return (
    <section className="dashboard-methods">
      <div className="settings-intro"><div><span className="eyebrow">METHOD WORKSPACE</span><h2>Turn the catalogue into a queue.</h2></div><p>Tracking a method is optional. A status is not evidence that it saved money; validate it in your own workload.</p></div>
      <div className="method-dashboard-controls">
        <label>Search methods<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caching, routing, output…" /></label>
        <label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value === "none" ? "none" : value} key={value}>{label}</option>)}<option value="all">All statuses</option></select></label>
        <span>{filtered.length} methods</span>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="method-dashboard-list">
        {filtered.map((method) => <article key={method.id}><div><span>{method.category} · {method.access}</span><h3>{method.title}</h3></div><select aria-label={`Status for ${method.title}`} value={method.status} disabled={busy === method.id} onChange={(event) => void update(method.id, event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></article>)}
      </div>
      <Link className="text-link" href="/library">Open full evidence cards <span>→</span></Link>
    </section>
  );
}
