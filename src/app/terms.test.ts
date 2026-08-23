import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TermsPage from "./terms/page";

describe("terms support routes", () => {
  it("keeps refund requests private and public issues non-sensitive", () => {
    const html = renderToStaticMarkup(TermsPage());
    const refundSection = html.match(/<h2>Refunds<\/h2><p>(.*?)<\/p>/)?.[1];

    expect(refundSection).toContain("mailto:accounts@enby.fish?subject=TokenGauge%20refund%20request");
    expect(refundSection).toContain("private email");
    expect(refundSection).not.toContain("github.com");
    expect(html).toContain("Effective 23 August 2026");
    expect(html).toContain("public issue tracker");
    expect(html).toContain("only for non-sensitive product bugs or documentation");
  });
});
