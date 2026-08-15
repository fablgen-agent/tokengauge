import { requireChatGPT, requireProductAccount } from "@/lib/access";
import { linkChatGPTAccount } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const [product, chatgpt] = await Promise.all([
      requireProductAccount(request),
      requireChatGPT(request),
    ]);
    const result = linkChatGPTAccount({
      chatgptAccountId: chatgpt.accountId,
      productAccountId: product.accountId,
    });
    return Response.json(result, { status: result.linked ? 200 : 409 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Unable to link TokenGauge and ChatGPT accounts.");
    return Response.json({ error: "The accounts could not be linked." }, { status: 500 });
  }
}
