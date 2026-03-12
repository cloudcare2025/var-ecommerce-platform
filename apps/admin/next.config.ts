import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@var/database", "@var/shared", "@var/sync", "@var/ui"],
};

export default nextConfig;
