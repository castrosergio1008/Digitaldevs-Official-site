import type { NextConfig } from "next";

// Security headers applied to every route.
// CSP allows inline scripts/styles on purpose: the theme script and the
// JSON-LD blocks are rendered inline and Tailwind v4 injects styles inline.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // themeScript + JSON-LD blocks are inline; Next hydration scripts too.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind v4 injects inline styles; next/font + webpack emit inline <style>.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      // next/font is self-hosted at build time; data: covers inline font faces.
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;