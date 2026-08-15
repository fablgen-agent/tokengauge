import { describe, expect, it } from "vitest";

import { priceProviders } from "./costs";
import {
  providerPageProfile,
  providerPageProfiles,
  providerRateCards,
  providerSourceUrls,
  uniqueProviderModels,
} from "./provider-pages";

describe("provider pricing pages", () => {
  it("covers every priced provider exactly once", () => {
    expect(providerPageProfiles.map((profile) => profile.id)).toEqual(priceProviders.map((provider) => provider.id));
    expect(new Set(providerPageProfiles.map((profile) => profile.id)).size).toBe(providerPageProfiles.length);
  });

  it("backs every page with rate cards, models, and first-party sources", () => {
    for (const profile of providerPageProfiles) {
      expect(providerPageProfile(profile.id)).toEqual(profile);
      expect(providerRateCards(profile.id).length).toBeGreaterThan(0);
      expect(uniqueProviderModels(profile.id)).toBeGreaterThan(0);
      expect(providerSourceUrls(profile.id).length).toBeGreaterThan(0);
      expect(providerSourceUrls(profile.id).every((url) => url.startsWith("https://"))).toBe(true);
    }
  });
});
