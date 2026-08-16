import { z } from "zod";

import { requireOwnerAccount } from "@/lib/access";
import { accountPrivacyExport, clearAccountWorkbenchData } from "@/lib/db";
import { getAppUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deletionSchema = z.object({ confirmation: z.literal("DELETE MY WORKBENCH DATA") });

export async function GET(request: Request): Promise<Response> {
  try {
    const account = await requireOwnerAccount(request);
    const body = {
      format: "tokengauge-account-export-v1",
      exportedAt: new Date().toISOString(),
      accountKind: account.kind,
      data: accountPrivacyExport(account.accountId),
      notIncluded: [
        "provider API key plaintext or ciphertext",
        "password hashes, sessions, authenticator secrets, and recovery codes",
        "internal billing identifiers and Stripe object identifiers",
        "prompts and model outputs, because TokenGauge does not retain them",
        "anonymous daily product counters, because they are not linked to an account",
      ],
    };
    return new Response(JSON.stringify(body, null, 2) + "\n", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": "attachment; filename=tokengauge-account-data.json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Your TokenGauge data export could not be created." }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== getAppUrl()) {
      return Response.json({ error: "This deletion must be requested from TokenGauge settings." }, { status: 403 });
    }
    const account = await requireOwnerAccount(request);
    deletionSchema.parse(await request.json());
    return Response.json({
      deleted: clearAccountWorkbenchData(account.accountId),
      retained: [
        "account and authentication security records",
        "ChatGPT account link, if configured",
        "plan entitlement, payment references, and launch-offer position",
      ],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "Type the exact confirmation phrase before deleting workbench data." }, { status: 400 });
    }
    return Response.json({ error: "Your optional workbench data could not be deleted." }, { status: 500 });
  }
}
