"use client";

import { useMemo, useState } from "react";

import { TipCard } from "@/components/tip-card";
import type { TokenTip } from "@/lib/catalog";

export function LibraryBrowser({ tips }: { tips: readonly TokenTip[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(tips.map((tip) => tip.category))).sort(), [tips]);
  const visibleTips = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tips.filter((tip) => {
      if (category !== "all" && tip.category !== category) return false;
      if (!needle) return true;
      return `${tip.title} ${tip.summary} ${tip.action} ${tip.providers ?? ""}`.toLowerCase().includes(needle);
    });
  }, [category, query, tips]);

  return (
    <section className="library-browser section-pad">
      <div className="library-toolbar">
        <label><span>Search methods</span><input type="search" placeholder="Caching, Grok, retries…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <p>{visibleTips.length} of {tips.length} methods</p>
      </div>
      <div className="library-grid">{visibleTips.map((tip) => <TipCard tip={tip} key={tip.id} />)}</div>
      {visibleTips.length === 0 ? <p className="empty-state">No methods match those filters.</p> : null}
    </section>
  );
}
