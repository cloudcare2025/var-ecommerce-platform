import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@var/ui", "@var/shared", "@var/database"],
};

export default nextConfig;
