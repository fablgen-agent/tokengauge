import {
  pricingFeedHeaders,
  pricingFeedPayload,
} from "@/lib/pricing-feed";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return Response.json(pricingFeedPayload(), { headers: pricingFeedHeaders() });
}

export async function HEAD(): Promise<Response> {
  return new Response(null, {
    headers: {
      ...pricingFeedHeaders(),
      "Content-Type": "application/json",
    },
  });
}
