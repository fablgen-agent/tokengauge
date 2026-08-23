import Link from "next/link";

import { recordedMeasurement } from "@/lib/recorded-measurement";

export function RecordedMeasurementAudit() {
  return (
    <section className="recorded-audit section-pad" aria-labelledby="recorded-audit-title">
      <div className="recorded-audit-heading">
        <div>
          <span className="eyebrow eyebrow-lime">NO-ACCOUNT RECORDED MEASUREMENT AUDIT</span>
          <h2 id="recorded-audit-title">Review the measurement before connecting a model.</h2>
          <p>Inspect the public 2026-08-16 demonstration context and its published token metrics. This is an audit of the recorded numbers, not a replay: the original output text was intentionally not retained, so no output is invented and no winner is declared.</p>
          <Link className="text-link recorded-audit-live-link" href="#live-lab">Run a live paired test <span aria-hidden="true">→</span></Link>
        </div>
        <aside className="recorded-audit-boundary" role="note">
          <strong>Recorded-demo boundary</strong>
          <p>Not customer evidence. Not an API invoice. Token reduction is not a quality verdict or guaranteed saving.</p>
        </aside>
      </div>

      <section className="recorded-audit-panel recorded-audit-metrics" aria-labelledby="recorded-audit-metrics-title">
        <div className="recorded-audit-section-heading">
          <div><span className="eyebrow">PUBLISHED TOKEN METRICS</span><h3 id="recorded-audit-metrics-title">The two recorded metric rows</h3></div>
          <p>{recordedMeasurement.model} · {recordedMeasurement.date}. These are the public demonstration&apos;s reported numbers, shown separately from the unavailable output text.</p>
        </div>
        <div className="recorded-audit-metric-grid">
          {recordedMeasurement.metrics.map((metric) => (
            <article className="recorded-audit-metric" key={metric.id}>
              <div><h4>Recorded arm {metric.id.toUpperCase()}</h4><span>{metric.publishedSetting}</span></div>
              <dl>
                <div><dt>Input</dt><dd>{metric.usage.input}</dd></div>
                <div><dt>Output</dt><dd>{metric.usage.output}</dd></div>
                <div><dt>Reasoning</dt><dd>{metric.usage.reasoning}</dd></div>
                <div><dt>Total</dt><dd>{metric.usage.total}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <div className="recorded-audit-evidence-boundary">
        <div>
          <span className="eyebrow">OUTPUT EVIDENCE BOUNDARY</span>
          <h3>Metrics are inspectable. Quality is not.</h3>
          <p>The public record says both outputs contained the requested three bullets, but the output text was intentionally not retained. A reviewer cannot independently judge their quality from this record, so TokenGauge does not declare a winner.</p>
        </div>
        <p><strong>A valid live comparison:</strong> define a passing rubric first, judge both outputs before revealing usage, and count regressions or retries against any token reduction.</p>
      </div>

      <details className="recorded-audit-details">
        <summary>Inspect the current lab fixture and provenance</summary>
        <div className="recorded-audit-context">
          <article className="recorded-audit-panel">
            <span className="eyebrow">SHARED TASK · CONTEXT ONLY</span>
            <h3>Current starter wording</h3>
            <pre>{recordedMeasurement.task}</pre>
          </article>
          <article className="recorded-audit-panel">
            <span className="eyebrow">SHARED INSTRUCTIONS · CONTEXT ONLY</span>
            <h3>Current starter wording</h3>
            <pre>{recordedMeasurement.instructions}</pre>
          </article>
        </div>
        <p className="recorded-audit-provenance">{recordedMeasurement.taskProvenance}</p>
      </details>
    </section>
  );
}
