import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@var/database", "@var/shared", "@var/ui"],
};

export default nextConfig;
