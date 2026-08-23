import { describe, expect, it } from "vitest";

import { resolveFunnelMeasurementPreference } from "./funnel-preference";

describe("anonymous funnel measurement preference", () => {
  it("defaults to enabled without a stored choice", () => {
    expect(resolveFunnelMeasurementPreference(null, null)).toEqual({ disabled: false, persist: null });
  });

  it("honors a stored browser-local opt-out", () => {
    expect(resolveFunnelMeasurementPreference(null, "1")).toEqual({ disabled: true, persist: null });
  });

  it("lets an explicit URL choice disable and persist measurement", () => {
    expect(resolveFunnelMeasurementPreference("off", null)).toEqual({ disabled: true, persist: "disabled" });
  });

  it("lets an explicit URL choice restore measurement", () => {
    expect(resolveFunnelMeasurementPreference("on", "1")).toEqual({ disabled: false, persist: "enabled" });
  });

  it("ignores unknown URL values", () => {
    expect(resolveFunnelMeasurementPreference("disabled", "1")).toEqual({ disabled: true, persist: null });
  });
});
