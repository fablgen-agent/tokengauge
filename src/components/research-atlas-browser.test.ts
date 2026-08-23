import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResearchAtlasBrowser } from "@/components/research-atlas-browser";

describe("research atlas access handoff", () => {
  it("routes a free reader directly to authoritative Pro account pricing", () => {
    const markup = renderToStaticMarkup(createElement(ResearchAtlasBrowser, { pro: false }));

    expect(markup).toContain('href="/account?plan=pro"');
    expect(markup).toContain('data-funnel-event="cta_account"');
    expect(markup).toContain("Review Pro access");
    expect(markup).not.toContain("Get launch Pro for £5");
  });

  it("does not show the access gate to a Pro reader", () => {
    const markup = renderToStaticMarkup(createElement(ResearchAtlasBrowser, { pro: true }));

    expect(markup).not.toContain("PRO RESEARCH ACCESS");
    expect(markup).not.toContain('href="/account?plan=pro"');
  });
});
