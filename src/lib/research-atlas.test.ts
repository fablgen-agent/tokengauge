import { describe, expect, it } from "vitest";

import { allResearchAtlasRecords, atlasSummary, queryResearchAtlas } from "./research-atlas";

describe("research atlas", () => {
  it("keeps the research scale exact and honestly typed", () => {
    const records = allResearchAtlasRecords();
    expect(records).toHaveLength(2_500);
    expect(atlasSummary).toMatchObject({ total: 2_500, atomic: 1_316, configurations: 1_184, publicSample: 12 });
    expect(new Set(records.map((record) => record.id.toLowerCase())).size).toBe(2_500);
    expect(records.every((record) => ["atomic", "configuration"].includes(record.kind))).toBe(true);
    expect(records.every((record) => record.source.url.startsWith("https://"))).toBe(true);
  });

  it("does not send the paid atlas to a free browser", () => {
    const free = queryResearchAtlas({ pro: false, pageSize: 48 });
    expect(free.access).toBe("sample");
    expect(free.items).toHaveLength(12);
    expect(free.locked).toBe(2_488);
    expect(free.total).toBe(12);
  });

  it("filters the complete Pro corpus on the server", () => {
    const result = queryResearchAtlas({ pro: true, query: "AWS Bedrock", kind: "atomic", pageSize: 24 });
    expect(result.access).toBe("pro");
    expect(result.total).toBeGreaterThan(20);
    expect(result.items.every((record) => record.kind === "atomic")).toBe(true);
    expect(result.items.every((record) => `${record.provider} ${record.scope} ${record.summary} ${record.action}`.toLowerCase().includes("aws bedrock"))).toBe(true);
  });
});
