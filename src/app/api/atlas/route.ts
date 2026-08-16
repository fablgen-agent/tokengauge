import { z } from "zod";

import { getAuthContext } from "@/lib/access";
import { atlasSummary, queryResearchAtlas } from "@/lib/research-atlas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().max(100).catch(""),
  kind: z.enum(["all", "atomic", "configuration"]).catch("all"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const input = querySchema.parse({
      q: url.searchParams.get("q") ?? "",
      kind: url.searchParams.get("kind") ?? "all",
      page: url.searchParams.get("page") ?? "1",
    });
    const account = await getAuthContext(request);
    return Response.json({
      summary: atlasSummary,
      ...queryResearchAtlas({ pro: account?.pro ?? false, query: input.q, kind: input.kind, page: input.page }),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "The research atlas could not be loaded." }, { status: 500 });
  }
}
