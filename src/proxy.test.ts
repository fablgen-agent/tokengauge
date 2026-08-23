import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("work hostname routing", () => {
  it("rewrites the work hostname root to the work desk", () => {
    const response = proxy(new NextRequest("https://work.enby.fish/?service=publii_plugin"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://work.enby.fish/work?service=publii_plugin",
    );
  });

  it("redirects the duplicate work path to its canonical root", () => {
    const response = proxy(new NextRequest("https://work.enby.fish/work?service=static_form"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://work.enby.fish/?service=static_form",
    );
  });

  it("does not alter TokenGauge routes", () => {
    const response = proxy(new NextRequest("https://tokengauge.enby.fish/"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
