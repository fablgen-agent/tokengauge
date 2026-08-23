import { describe, expect, it } from "vitest";

import { GET as getRobots } from "./work-robots.txt/route";
import { GET as getSitemap } from "./work-sitemap.xml/route";

describe("work hostname crawler routes", () => {
  it("publishes a work-specific robots file", async () => {
    const response = getRobots();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toContain("Host: https://work.enby.fish");
    expect(body).toContain("Sitemap: https://work.enby.fish/sitemap.xml");
    expect(body).not.toContain("tokengauge.enby.fish");
  });

  it("publishes a single-host work sitemap", async () => {
    const response = getSitemap();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("application/xml; charset=utf-8");
    expect(body).toContain("<loc>https://work.enby.fish/</loc>");
    expect(body).not.toContain("tokengauge.enby.fish");
    expect(body.match(/<url>/g)).toHaveLength(1);
  });
});
