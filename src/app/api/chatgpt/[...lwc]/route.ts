import { getChatGPTHandler } from "@/lib/chatgpt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return getChatGPTHandler().handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return getChatGPTHandler().handler(request);
}
