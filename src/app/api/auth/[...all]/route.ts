import { toNextJsHandler } from "better-auth/next-js";

import { getProductAuth } from "@/lib/product-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getProductAuth()).GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getProductAuth()).POST(request);
}
