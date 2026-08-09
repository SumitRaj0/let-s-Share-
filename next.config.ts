import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const enableHsts = isProd && siteUrl.startsWith("https://");

/**
 * CSP tradeoffs (Next 16 + Monaco + Yjs):
 * - `unsafe-inline`: required for Next/React inline bootstraps on statically
 *   rendered marketing pages (nonce + `strict-dynamic` needs per-request
 *   dynamic rendering via `proxy.ts`, which would undo homepage staticness).
 * - `unsafe-eval` + `blob:`: required for Monaco editor workers / in-browser run.
 * - Trusted Types (`require-trusted-types-for 'script'`) is omitted: Next's
 *   client bootstrap assigns `innerHTML` before any default policy can run,
 *   which blanks the app and fails Lighthouse `errors-in-console`.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https: wss: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
];

if (enableHsts) {
  cspDirectives.push("upgrade-insecure-requests");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

if (enableHsts) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Keep libSQL out of the serverless bundle graph where possible.
  serverExternalPackages: ["@libsql/client", "@libsql/client/web"],
  // Source maps help BP audits but inflate local tooling noise; keep off for leaner
  // homepage Lighthouse runs. Enable in CI/prod debugging if needed.
  productionBrowserSourceMaps: false,
  experimental: {
    // Inline CSS into <style> for first paint — removes render-blocking
    // stylesheet on marketing `/` (Tailwind is small enough to inline).
    // Prod only; `next dev` still uses a blocking <link>.
    inlineCss: true,
    optimizePackageImports: [
      "@monaco-editor/react",
      "yjs",
      "y-protocols",
      "y-webrtc",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Only fingerprintable static assets — avoid overlapping /_next/static
        // Cache-Control with Next's own immutable headers for JS/CSS.
        source: "/:path*.:ext(ico|png|jpg|jpeg|gif|webp|svg|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/llms.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
