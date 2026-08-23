import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return {
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
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/work",
        has: [{ type: "host", value: "work.enby.fish" }],
        destination: "https://work.enby.fish/",
        permanent: true,
      },
    ];
  },
  async headers() {
    const publicDataHeaders = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "connect-src 'self'",
              "font-src 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "img-src 'self' data:",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
      { source: "/pricing.json", headers: publicDataHeaders },
      { source: "/schemas/:path*", headers: publicDataHeaders },
      { source: "/fixtures/:path*", headers: publicDataHeaders },
    ];
  },
};

export default nextConfig;
