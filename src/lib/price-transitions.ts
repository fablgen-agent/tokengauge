import { modelPrices, type ModelPrice } from "@/lib/costs";

export type PriceTransition = {
  effectiveAt: string;
  starts: readonly ModelPrice[];
  ends: readonly ModelPrice[];
  providers: readonly string[];
  sourceUrls: readonly string[];
};

export function buildPriceTransitions(prices: readonly ModelPrice[]): readonly PriceTransition[] {
  const boundaries = new Map<string, { starts: ModelPrice[]; ends: ModelPrice[] }>();

  for (const price of prices) {
    if (price.effectiveFrom) {
      const boundary = boundaries.get(price.effectiveFrom) ?? { starts: [], ends: [] };
      boundary.starts.push(price);
      boundaries.set(price.effectiveFrom, boundary);
    }
    if (price.effectiveUntil) {
      const boundary = boundaries.get(price.effectiveUntil) ?? { starts: [], ends: [] };
      boundary.ends.push(price);
      boundaries.set(price.effectiveUntil, boundary);
    }
  }

  return [...boundaries.entries()]
    .sort(([left], [right]) => Date.parse(left) - Date.parse(right))
    .map(([effectiveAt, boundary]) => {
      const cards = [...boundary.ends, ...boundary.starts];
      return {
        effectiveAt,
        starts: boundary.starts,
        ends: boundary.ends,
        providers: [...new Set(cards.map((card) => card.providerLabel))],
        sourceUrls: [...new Set(cards.flatMap((card) => card.provenanceUrls ?? [card.sourceUrl]))],
      };
    });
}

export const priceTransitions = buildPriceTransitions(modelPrices);
