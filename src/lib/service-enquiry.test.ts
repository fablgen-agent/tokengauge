import { describe, expect, it } from "vitest";

import { parseServiceEnquiry, portfolioServiceOptions } from "./service-enquiry";

const now = 1_800_000_000_000;
const valid = {
  service: "attribution",
  email: "buyer@example.com",
  publicUrl: "https://github.com/example/project",
  stack: "TypeScript",
  provider: "OpenAI",
  summary: "Attribute model usage to each workflow and accepted answer.",
  timing: "This month",
  website: "",
  startedAt: now - 5_000,
  measurementOff: false,
};

describe("service enquiry validation", () => {
  it("accepts a bounded public-scope request", () => {
    expect(parseServiceEnquiry(valid, now)).toEqual({ success: true, data: valid });
  });

  it("rejects honeypot, instant, private-scheme, and short submissions", () => {
    expect(parseServiceEnquiry({ ...valid, website: "spam" }, now).success).toBe(false);
    expect(parseServiceEnquiry({ ...valid, startedAt: now }, now).success).toBe(false);
    expect(parseServiceEnquiry({ ...valid, publicUrl: "file:///private/repo" }, now).success).toBe(false);
    expect(parseServiceEnquiry({ ...valid, summary: "Fix it" }, now).success).toBe(false);
  });

  it("rejects oversized and control-character fields", () => {
    expect(parseServiceEnquiry({ ...valid, stack: "x".repeat(121) }, now).success).toBe(false);
    expect(parseServiceEnquiry({ ...valid, provider: "OpenAI\u0000bcc" }, now).success).toBe(false);
  });

  it("accepts only an explicit measurement opt-out", () => {
    expect(parseServiceEnquiry({ ...valid, measurementOff: true }, now)).toMatchObject({ success: true, data: { measurementOff: true } });
    expect(parseServiceEnquiry({ ...valid, measurementOff: "true" }, now)).toMatchObject({ success: true, data: { measurementOff: false } });
  });

  it("requires acceptance checks for portfolio requests", () => {
    const portfolio = { ...valid, service: "static_form", acceptanceChecks: "A tagged test message reaches the owner-controlled inbox." };
    expect(parseServiceEnquiry(portfolio, now)).toMatchObject({ success: true, data: { service: "static_form" } });
    expect(parseServiceEnquiry({ ...portfolio, acceptanceChecks: "looks fine" }, now)).toMatchObject({ success: false });
  });

  it("accepts the bounded booking-selection scope and publishes its fixed price", () => {
    const booking = {
      ...valid,
      service: "booking_selection",
      stack: "WordPress with an existing booking plugin",
      provider: "The page says booking is unavailable while controls remain interactive.",
      summary: "Restore one public availability and booking-selection step up to the existing checkout handoff.",
      acceptanceChecks: "Valid dates progress; invalid dates stop honestly; no order or payment is placed.",
    };
    expect(parseServiceEnquiry(booking, now)).toMatchObject({ success: true, data: { service: "booking_selection" } });
    expect(portfolioServiceOptions).toContainEqual({
      id: "booking_selection",
      label: "Booking availability / selection repair",
      price: "£75 fixed",
    });
  });
});
