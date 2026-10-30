import path from "node:path";
import type { NextConfig } from "next";

// The repo root: npm workspaces hoist dependencies there, and @fyt/domain
// lives in packages/domain, outside this app. Turbopack only resolves files
// under its root, so point it (and file tracing) at the monorepo root.
const repoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // @fyt/domain (packages/domain) ships TypeScript source shared with the app
  // and Cloud Functions; Next compiles it like local code.
  transpilePackages: ["@fyt/domain"],
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  experimental: {
    // The repo lives on an external SSD where writing Turbopack's dev cache
    // costs more than it saves. Re-enable on a fast local disk.
    turbopackFileSystemCacheForDev: false,
    serverActions: {
      // Image uploads (media-actions.ts) accept files up to 5 MB; the rest is
      // multipart overhead. The action re-checks the real size itself.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
