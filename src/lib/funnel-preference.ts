export const funnelMeasurementPreferenceKey = "tokengauge:funnel:disabled";
const funnelMeasurementPreferenceEvent = "tokengauge:funnel-preference";

export type FunnelMeasurementPreference = {
  disabled: boolean;
  persist: "disabled" | "enabled" | null;
};

export function resolveFunnelMeasurementPreference(
  queryValue: string | null,
  storedValue: string | null,
): FunnelMeasurementPreference {
  if (queryValue === "off") return { disabled: true, persist: "disabled" };
  if (queryValue === "on") return { disabled: false, persist: "enabled" };
  return { disabled: storedValue === "1", persist: null };
}

export function funnelMeasurementDisabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parameters = new URLSearchParams(window.location.search);
    const resolved = resolveFunnelMeasurementPreference(
      parameters.get("measurement"),
      window.localStorage.getItem(funnelMeasurementPreferenceKey),
    );
    if (resolved.persist === "disabled") setFunnelMeasurementDisabled(true);
    else if (resolved.persist === "enabled") setFunnelMeasurementDisabled(false);
    return resolved.disabled;
  } catch {
    return false;
  }
}

export function storedFunnelMeasurementDisabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(funnelMeasurementPreferenceKey) === "1";
  } catch {
    return false;
  }
}

export function subscribeToFunnelMeasurementPreference(notify: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === funnelMeasurementPreferenceKey) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(funnelMeasurementPreferenceEvent, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(funnelMeasurementPreferenceEvent, notify);
  };
}

export function setFunnelMeasurementDisabled(disabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (disabled) window.localStorage.setItem(funnelMeasurementPreferenceKey, "1");
    else window.localStorage.removeItem(funnelMeasurementPreferenceKey);
    window.dispatchEvent(new Event(funnelMeasurementPreferenceEvent));
  } catch {
    // A blocked storage API leaves the existing identifier-free aggregate behavior unchanged.
  }
}
