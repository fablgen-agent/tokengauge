import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("work hostname routing", () => {
  it("rewrites the work hostname root and crawler files to work-specific routes", async () => {
    await expect(nextConfig.rewrites?.()).resolves.toMatchObject({
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "work.enby.fish" }],
          destination: "/work",
        },
        {
          source: "/robots.txt",
          has: [{ type: "host", value: "work.enby.fish" }],
          destination: "/work-robots.txt",
        },
        {
          source: "/sitemap.xml",
          has: [{ type: "host", value: "work.enby.fish" }],
          destination: "/work-sitemap.xml",
        },
      ],
    });
  });

  it("redirects the duplicate work path to its canonical root", async () => {
    await expect(nextConfig.redirects?.()).resolves.toContainEqual({
      source: "/work",
      has: [{ type: "host", value: "work.enby.fish" }],
      destination: "https://work.enby.fish/",
      permanent: true,
    });
  });
});
