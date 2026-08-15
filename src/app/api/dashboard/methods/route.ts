import { z } from "zod";

import { requireOwnerAccount } from "@/lib/access";
import { tokenTips } from "@/lib/catalog";
import { setMethodProgress } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  methodId: z.string().min(1).max(120),
  status: z.enum(["planned", "testing", "adopted", "dismissed", "none"]),
});

export async function PATCH(request: Request): Promise<Response> {
  try {
    const account = await requireOwnerAccount(request);
    const input = inputSchema.parse(await request.json());
    if (!tokenTips.some((tip) => tip.id === input.methodId)) {
      return Response.json({ error: "Unknown method." }, { status: 404 });
    }
    setMethodProgress(account.accountId, input.methodId, input.status);
    return Response.json({ saved: true });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Check the method status." }, { status: 400 });
    }
    return Response.json({ error: "Method status could not be saved." }, { status: 500 });
  }
}
