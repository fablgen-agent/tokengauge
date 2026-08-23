"use client";

import { useSyncExternalStore } from "react";

import {
  setFunnelMeasurementDisabled,
  storedFunnelMeasurementDisabled,
  subscribeToFunnelMeasurementPreference,
} from "@/lib/funnel-preference";

export function FunnelPreference() {
  const disabled = useSyncExternalStore(
    subscribeToFunnelMeasurementPreference,
    storedFunnelMeasurementDisabled,
    () => false,
  );

  function update(nextDisabled: boolean) {
    setFunnelMeasurementDisabled(nextDisabled);
  }

  return (
    <section className="measurement-preference" aria-labelledby="measurement-preference-title">
      <div>
        <span className="eyebrow eyebrow-lime">BROWSER-LOCAL CHOICE</span>
        <h2 id="measurement-preference-title">Anonymous product counting</h2>
        <p>Turn off future aggregate page and action counts in this browser. The choice stays in local storage and is never sent to TokenGauge. It does not affect account security records, payments, or requests you deliberately run.</p>
      </div>
      <div className="measurement-control">
        <button type="button" role="switch" aria-checked={!disabled} className={!disabled ? "is-active" : ""} onClick={() => update(!disabled)}>
          <span aria-hidden="true"><i /></span>
          {disabled ? "Anonymous counting is off" : "Anonymous counting is on"}
        </button>
        <small>{disabled ? "No future funnel events will be sent from this browser." : "Only daily aggregate event totals are sent; no visitor identifier is attached."}</small>
      </div>
    </section>
  );
}
