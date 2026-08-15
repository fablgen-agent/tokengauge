import { evidenceLabels, type TokenTip } from "@/lib/catalog";

export function TipCard({ tip, compact = false }: { tip: TokenTip; compact?: boolean }) {
  return (
    <article className={`tip-card ${compact ? "compact" : ""}`}>
      <div className="tip-meta">
        <span>{tip.category}</span>
        <span className={`evidence evidence-${tip.grade}`}>{evidenceLabels[tip.grade]}</span>
      </div>
      <h3>{tip.title}</h3>
      <p>{tip.summary}</p>
      {!compact ? (
        <div className="tip-details">
          <p><strong>Do:</strong> {tip.action}</p>
          <p><strong>Measure:</strong> {tip.measure}</p>
          <p><strong>Watch:</strong> {tip.caveat}</p>
        </div>
      ) : null}
      <a href={tip.source.url} target="_blank" rel="noreferrer">{tip.source.label} ↗</a>
    </article>
  );
}
