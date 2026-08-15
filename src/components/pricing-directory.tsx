"use client";

import { useMemo, useState } from "react";

import {
  formatRate,
  modelPrices,
  priceProviders,
  priceSnapshotDate,
  type ProviderId,
} from "@/lib/costs";

type ProviderFilter = "all" | ProviderId;
type SortKey = "provider" | "input" | "cache" | "output";

export function PricingDirectory({ initialProvider = "all" }: { initialProvider?: ProviderFilter } = {}) {
  const [provider, setProvider] = useState<ProviderFilter>(initialProvider);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("provider");

  const visibleModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = modelPrices.filter((model) => {
      if (provider !== "all" && model.provider !== provider) return false;
      if (!normalizedQuery) return true;
      return `${model.providerLabel} ${model.label} ${model.modelId} ${model.tierLabel} ${model.region}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return [...filtered].sort((left, right) => {
      if (sort === "provider") return `${left.providerLabel} ${left.label} ${left.tierLabel}`.localeCompare(`${right.providerLabel} ${right.label} ${right.tierLabel}`);
      const leftRate = sort === "input" ? left.inputPerMillionUsd : sort === "cache" ? left.cachedInputPerMillionUsd : left.outputPerMillionUsd;
      const rightRate = sort === "input" ? right.inputPerMillionUsd : sort === "cache" ? right.cachedInputPerMillionUsd : right.outputPerMillionUsd;
      if (leftRate === null) return 1;
      if (rightRate === null) return -1;
      return leftRate - rightRate;
    });
  }, [provider, query, sort]);

  return (
    <div className="pricing-directory">
      <div className="directory-toolbar">
        <label className="directory-search">
          <span>Search models and tiers</span>
          <input
            type="search"
            placeholder="Try Kimi, Gemini, Grok, Qwen…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="directory-sort">
          <span>Sort rate cards</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="provider">Provider and model</option>
            <option value="input">Lowest input price</option>
            <option value="cache">Lowest cache-read price</option>
            <option value="output">Lowest output price</option>
          </select>
        </label>
        <div className="provider-filters" aria-label="Filter by provider">
          <button aria-pressed={provider === "all"} className={provider === "all" ? "active" : ""} type="button" onClick={() => setProvider("all")}>All <span>{modelPrices.length}</span></button>
          {priceProviders.map((candidate) => (
            <button aria-pressed={provider === candidate.id} className={provider === candidate.id ? "active" : ""} type="button" key={candidate.id} onClick={() => setProvider(candidate.id)}>
              {candidate.label} <span>{modelPrices.filter((model) => model.provider === candidate.id).length}</span>
            </button>
          ))}
        </div>
        <p className="directory-count" aria-live="polite">Showing {visibleModels.length} of {modelPrices.length} rate cards</p>
      </div>

      <div className="rate-table-wrap" role="region" tabIndex={0} aria-label="Scrollable API pricing table">
        <table className="rate-table">
          <caption>Official provider API rate cards, USD per one million tokens</caption>
          <thead>
            <tr>
              <th scope="col">Provider / model</th>
              <th scope="col">Price scope</th>
              <th scope="col">Input<br />USD / 1M</th>
              <th scope="col">Cache read<br />USD / 1M</th>
              <th scope="col">Output<br />USD / 1M</th>
              <th scope="col">Context</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {visibleModels.map((model) => (
              <tr key={model.id}>
                <td><span className="provider-name">{model.providerLabel}</span><strong>{model.label}</strong><code>{model.modelId}</code></td>
                <td><strong>{model.tierLabel}</strong><small>{model.region}</small>{model.effectiveFrom ? <small>From {formatDate(model.effectiveFrom)}</small> : null}{model.effectiveUntil ? <small>Through {formatDate(model.effectiveUntil)}</small> : null}</td>
                <td>{formatRate(model.inputPerMillionUsd)}</td>
                <td>{formatRate(model.cachedInputPerMillionUsd)}</td>
                <td>{formatRate(model.outputPerMillionUsd)}</td>
                <td>{model.contextWindowTokens ? formatTokens(model.contextWindowTokens) : "—"}</td>
                <td><a href={model.sourceUrl} target="_blank" rel="noreferrer">Official ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleModels.length === 0 ? <p className="empty-state">No rate cards match that search.</p> : null}
      </div>
      <div className="mobile-rate-list" aria-label="API pricing cards">
        <p className="mobile-rate-unit">Rates in USD per 1M tokens</p>
        {visibleModels.map((model) => (
          <article className="mobile-rate-card" key={model.id}>
            <div><span>{model.providerLabel}</span><h3>{model.label}</h3><code>{model.modelId}</code></div>
            <p>{model.tierLabel}<small>{model.region}</small></p>
            <dl>
              <div><dt>Input</dt><dd>{formatRate(model.inputPerMillionUsd)}</dd></div>
              <div><dt>Cache read</dt><dd>{formatRate(model.cachedInputPerMillionUsd)}</dd></div>
              <div><dt>Output</dt><dd>{formatRate(model.outputPerMillionUsd)}</dd></div>
              <div><dt>Context</dt><dd>{model.contextWindowTokens ? formatTokens(model.contextWindowTokens) : "—"}</dd></div>
            </dl>
            {model.effectiveFrom || model.effectiveUntil ? <small className="effective-date">{formatEffective(model.effectiveFrom, model.effectiveUntil)}</small> : null}
            <a href={model.sourceUrl} target="_blank" rel="noreferrer">Open official source <span aria-hidden="true">↗</span><span className="sr-only"> in a new tab</span></a>
          </article>
        ))}
        {visibleModels.length === 0 ? <p className="empty-state">No rate cards match that search.</p> : null}
      </div>
      <div className="directory-footnote">
        <p><strong>USD per 1M tokens.</strong> Snapshot verified {priceSnapshotDate}. Cache writes, cache storage, tools, regions, and provider-specific thresholds may be billed separately.</p>
        <p>A missing cache rate is shown as “—”, never treated as free. Consumer chat-plan quotas are not API prices.</p>
      </div>
    </div>
  );
}

function formatEffective(from?: string, until?: string): string {
  if (from && until) return `${formatDate(from)}–${formatDate(until)}`;
  if (from) return `Effective from ${formatDate(from)}`;
  return `Effective through ${formatDate(until!)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${Number((tokens / 1_000_000).toFixed(2))}M`;
  return `${Math.round(tokens / 1_000)}K`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}
