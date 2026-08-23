const workOrigin = "https://work.enby.fish";

export function GET(): Response {
  return new Response(
    [
      "User-Agent: *",
      "Allow: /",
      "Disallow: /api/",
      `Host: ${workOrigin}`,
      `Sitemap: ${workOrigin}/sitemap.xml`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
