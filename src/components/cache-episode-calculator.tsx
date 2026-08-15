"use client";

import { useMemo, useState } from "react";

import {
  calculateCacheEpisodeCosts,
  calculateSavings,
  formatRate,
  formatUsd,
  getSelectableModelPrices,
  resolvePriceForInput,
  type CacheTtl,
  type ProviderId,
} from "@/lib/costs";

export function CacheEpisodeCalculator({ providerId }: { providerId: ProviderId }) {
  const models = useMemo(() => getSelectableModelPrices().filter((model) =>
    model.provider === providerId &&
    model.cachedInputPerMillionUsd !== null &&
    model.cacheWritePerMillionUsd !== undefined
  ), [providerId]);
  const [priceId, setPriceId] = useState(models[0]?.id ?? "");
  const [episodes, setEpisodes] = useState(100);
  const [readsPerWrite, setReadsPerWrite] = useState(5);
  const [totalInputTokens, setTotalInputTokens] = useState(20_000);
  const [prefixTokens, setPrefixTokens] = useState(15_000);
  const [ttl, setTtl] = useState<CacheTtl>("5m");

  if (!models.length) return null;
  const selected = models.find((model) => model.id === priceId) ?? models[0];
  const resolved = resolvePriceForInput(selected, totalInputTokens);
  const effectiveTtl: CacheTtl = ttl === "1h" && resolved?.cacheWriteOneHourPerMillionUsd === undefined ? "5m" : ttl;
  let result: ReturnType<typeof calculateCacheEpisodeCosts> | undefined;
  let error: string | undefined;
  try {
    if (!resolved) throw new RangeError("The entered request does not fit this model's published context or price bands.");
    if (prefixTokens > totalInputTokens) throw new RangeError("Reusable prefix tokens cannot exceed total input tokens.");
    result = calculateCacheEpisodeCosts(resolved, {
      totalInputTokens,
      reusablePrefixTokens: prefixTokens,
      writes: episodes,
      readsPerWrite,
      ttl: effectiveTtl,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "This cache episode cannot be priced.";
  }
  const savings = result ? calculateSavings(result.baselineUsd, result.cachedUsd) : undefined;

  return (
    <div className="calculator-shell cache-calculator-shell">
      <div className="calculator-controls">
        <label>
          Model tier
          <select value={priceId} onChange={(event) => { setPriceId(event.target.value); setTtl("5m"); }}>
            {models.map((model) => <option key={model.id} value={model.id}>{model.label} · {model.tierLabel}</option>)}
          </select>
        </label>
        <NumberField label="Cache episodes / month" value={episodes} min={1} onChange={setEpisodes} />
        <NumberField label="Cache reads after each write" value={readsPerWrite} min={0} onChange={setReadsPerWrite} />
        <NumberField label="Total input tokens / request" value={totalInputTokens} min={1} onChange={setTotalInputTokens} />
        <NumberField label="Reusable prefix tokens" value={prefixTokens} min={0} onChange={setPrefixTokens} />
        <label>
          Cache lifetime
          <select value={effectiveTtl} onChange={(event) => setTtl(event.target.value as CacheTtl)}>
            <option value="5m">5 minutes</option>
            {selected.cacheWriteOneHourPerMillionUsd !== undefined ? <option value="1h">1 hour</option> : null}
          </select>
        </label>
      </div>
      <div className="calculator-result" aria-live="polite">
        <span className="eyebrow">CACHE EPISODE ECONOMICS</span>
        <div className="selected-rate">
          <strong>{resolved?.label ?? selected.label}</strong>
          <span>{formatRate(resolved?.inputPerMillionUsd)} ordinary input · {formatRate(effectiveTtl === "1h" ? resolved?.cacheWriteOneHourPerMillionUsd : resolved?.cacheWritePerMillionUsd)} cache write · {formatRate(resolved?.cachedInputPerMillionUsd)} cache read / 1M</span>
          <small>{effectiveTtl} TTL · output tokens excluded because they are identical in both arms</small>
        </div>
        {error || !result || !savings ? <p className="form-error" role="alert">{error}</p> : <>
          <div className="cost-comparison">
            <div><small>Without caching</small><strong>{formatUsd(result.baselineUsd)}</strong></div>
            <span aria-hidden="true">→</span>
            <div><small>With caching</small><strong>{formatUsd(result.cachedUsd)}</strong></div>
          </div>
          <div className={`savings-pill ${savings.amountUsd < 0 ? "negative" : ""}`}>
            {savings.amountUsd >= 0 ? "Estimated reduction" : "Estimated increase"}: {formatUsd(Math.abs(savings.amountUsd))} ({Math.abs(savings.percentage).toFixed(1)}%)
          </div>
          <div className="accepted-economics cache-economics-summary">
            <span className="eyebrow">BREAK-EVEN</span>
            <strong>{Number.isFinite(result.breakEvenReads) ? `${result.breakEvenReads} cache read${result.breakEvenReads === 1 ? "" : "s"} per write` : "No published break-even"}</strong>
            <p>{result.totalRequests.toLocaleString("en-US")} modeled requests across {episodes.toLocaleString("en-US")} cache episodes.</p>
          </div>
        </>}
        <p>This is an input-cost counterfactual, not realized savings. It assumes the prefix stays byte-stable and every planned read hits within the selected TTL. Verify provider usage fields and accepted-answer quality.</p>
        <a className="rate-source" href={resolved?.sourceUrl ?? selected.sourceUrl} target="_blank" rel="noreferrer">{resolved?.sourceLabel ?? selected.sourceLabel} ↗</a>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min={min} step="1" value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} /></label>;
}
