import { requireProductAccount } from "@/lib/access";
import { fulfilCheckoutSession } from "@/lib/stripe";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({ sessionId: z.string().regex(/^cs_(test_|live_)?[A-Za-z0-9]+$/) });

export async function POST(request: Request): Promise<Response> {
  try {
    const account = await requireProductAccount(request);
    const input = inputSchema.parse(await request.json());
    const result = await fulfilCheckoutSession(input.sessionId, account.billingUserId);
    return Response.json(result, { status: result.fulfilled ? 200 : 409 });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid checkout session." }, { status: 400 });
    }
    console.error("Unable to verify checkout", error);
    return Response.json({ error: "Checkout verification failed." }, { status: 500 });
  }
}
