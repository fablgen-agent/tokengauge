import { describe, expect, it } from "vitest";

import { parseServiceEnquiry } from "./service-enquiry";

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
});
