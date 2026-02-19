import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.lumacdn.com" },
      { protocol: "https", hostname: "img.evbuc.com" },
      { protocol: "https", hostname: "cdn.lu.ma" },
    ],
  },
};

export default nextConfig;
