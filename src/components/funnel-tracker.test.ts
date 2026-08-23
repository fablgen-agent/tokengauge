import { describe, expect, it } from "vitest";

import { routeEvent } from "./funnel-tracker";

describe("routeEvent", () => {
  it("classifies the work hostname root as a work request view", () => {
    expect(routeEvent("/", "work.enby.fish")).toBe("view_work_request");
  });

  it("keeps the TokenGauge root classified as a home view", () => {
    expect(routeEvent("/", "tokengauge.enby.fish")).toBe("view_home");
  });

  it("continues to classify the internal work route", () => {
    expect(routeEvent("/work", "tokengauge.enby.fish")).toBe("view_work_request");
  });
});
