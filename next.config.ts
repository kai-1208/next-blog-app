import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "w1980.blob.core.windows.net" },
      { protocol: "https", hostname: "placehold.jp" },
      { protocol: "https", hostname: "images.microcms-assets.io" },
    ],
  },
};

export default nextConfig;
