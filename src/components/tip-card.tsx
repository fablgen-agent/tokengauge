import type { EvidenceGrade, TokenTip } from "@/lib/catalog";

const evidenceLabels: Record<EvidenceGrade, string> = {
  official: "Official fact",
  derived: "Derived math",
  experiment: "Test protocol",
};

export function TipCard({ tip, compact = false }: { tip: TokenTip; compact?: boolean }) {
  const supportLabel = tip.experimentSupport === "supported" ? "Controlled lab recipe" : tip.experimentSupport === "guided-only" ? "Guided protocol" : "Guide only · no lab adapter";
  return (
    <article className={`tip-card ${compact ? "compact" : ""}`}>
      <div className="tip-meta">
        <span>{tip.category}</span>
        <span className={`evidence evidence-${tip.grade}`}>{evidenceLabels[tip.grade]}</span>
      </div>
      <h3>{tip.title}</h3>
      <p>{tip.summary}</p>
      <p className="tip-providers"><strong>Applies to:</strong> {tip.providers}<br /><strong>Testing:</strong> {supportLabel}</p>
      {!compact ? (
        <div className="tip-details">
          <p><strong>Do:</strong> {tip.action}</p>
          <p><strong>Measure:</strong> {tip.measure}</p>
          <p><strong>Watch:</strong> {tip.caveat}</p>
        </div>
      ) : null}
      <div className="tip-sources">
        {(compact ? tip.sources.slice(0, 1) : tip.sources).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.label} ↗</a>)}
        <span>Checked {tip.lastVerified}</span>
      </div>
    </article>
  );
}
