import { getAuthContext } from "@/lib/access";
import { getPublicRuntimeStatus } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const context = await getAuthContext(request);
  const runtimeStatus = getPublicRuntimeStatus();

  return Response.json(
    {
      authenticated: Boolean(context),
      user: context
        ? {
            name: context.name,
            plan: context.plan,
          }
        : undefined,
      pro: context?.pro ?? false,
      ...runtimeStatus,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
