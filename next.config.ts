import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["artisanatcases.fr", "localhost:3000"] },
  },
};

export default nextConfig;
