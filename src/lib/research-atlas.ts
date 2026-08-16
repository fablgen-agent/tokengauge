import "server-only";

import researchAtlasData from "@/data/research-atlas.json";

export type AtlasKind = "atomic" | "configuration";
export type AtlasRecord = {
  id: string;
  kind: AtlasKind;
  title: string;
  category: string;
  provider: string;
  scope: string;
  summary: string;
  action: string;
  measurement: string;
  caveat: string;
  grade: "official" | "derived" | "experiment";
  support: string;
  source: { label: string; url: string };
  provenance: string;
  lastVerified: string;
};

const researchAtlas = researchAtlasData as readonly AtlasRecord[];
const publicSampleIds = new Set([
  "luna-001",
  "luna-028",
  "luna-074",
  "luna-121",
  "luna2-001",
  "luna2-164",
  "LPS-OA-01",
  "LPS-AN-01",
  "LPE-BD-01",
  "R001",
  "R061",
  "tg2-F01-P01-W01-ea29322810f4",
]);
const publicSample = researchAtlas.filter((record) => publicSampleIds.has(record.id));

export const atlasSummary = Object.freeze({
  total: researchAtlas.length,
  atomic: researchAtlas.filter((record) => record.kind === "atomic").length,
  configurations: researchAtlas.filter((record) => record.kind === "configuration").length,
  publicSample: publicSample.length,
  lastVerified: "2026-08-15",
});

export function queryResearchAtlas(input: {
  pro: boolean;
  query?: string;
  kind?: AtlasKind | "all";
  page?: number;
  pageSize?: number;
}) {
  const source = input.pro ? researchAtlas : publicSample;
  const query = input.query?.trim().toLowerCase() ?? "";
  const kind = input.kind ?? "all";
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 24, 48));
  const filtered = source.filter((record) => {
    if (kind !== "all" && record.kind !== kind) return false;
    if (!query) return true;
    return `${record.id} ${record.title} ${record.category} ${record.provider} ${record.scope} ${record.summary} ${record.action}`.toLowerCase().includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.max(1, Math.min(input.page ?? 1, pageCount));
  return {
    access: input.pro ? "pro" as const : "sample" as const,
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageCount,
    pageSize,
    locked: input.pro ? 0 : researchAtlas.length - publicSample.length,
  };
}

export function allResearchAtlasRecords(): readonly AtlasRecord[] {
  return researchAtlas;
}
