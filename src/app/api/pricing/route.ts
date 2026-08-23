import {
  pricingCompatibilityPayload,
  pricingFeedCacheControl,
} from "@/lib/pricing-feed";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return Response.json(pricingCompatibilityPayload(), {
    headers: { "Cache-Control": pricingFeedCacheControl },
  });
}
