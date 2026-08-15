import {
  modelPrices,
  priceProviders,
  priceSnapshotObservedAt,
} from "@/lib/costs";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  return Response.json(
    {
      observedAt: priceSnapshotObservedAt,
      currency: "USD",
      unitTokens: 1_000_000,
      providers: priceProviders,
      models: modelPrices,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
