import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.samsung.com",
      },
      {
        protocol: "https",
        hostname: "image-us.samsung.com",
      },
      {
        protocol: "https",
        hostname: "downloadcenter.samsung.com",
      },
    ],
  },
};

export default nextConfig;
