import { requireAuth } from "@/lib/access";
import { getChatGPTHandler } from "@/lib/chatgpt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAuth(request);
    const models = (await getChatGPTHandler().getModels(request)) ?? [];
    return Response.json({ models }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Models could not be loaded." }, { status: 500 });
  }
}
