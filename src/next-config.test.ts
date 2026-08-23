import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("work hostname routing", () => {
  it("rewrites only the work hostname root to the work desk", async () => {
    await expect(nextConfig.rewrites?.()).resolves.toMatchObject({
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "work.enby.fish" }],
          destination: "/work",
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
