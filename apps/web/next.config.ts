import type { NextConfig } from "next";
import path from "path";

// Fail the build loudly if required env vars are missing in Vercel production.
// VERCEL_ENV is set automatically by Vercel: 'production' | 'preview' | 'development'.
// We skip this check in preview builds, CI runners, and local dev — only enforce in prod.
if (process.env.VERCEL_ENV === "production") {
  const required = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_WS_URL"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Build blocked: missing required environment variables: ${missing.join(", ")}. ` +
        `Set them in the Vercel dashboard or CI secrets.`
    );
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  env: {
    NEXT_PUBLIC_BUILD_VERSION: process.env.BUILD_VERSION || "dev",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
