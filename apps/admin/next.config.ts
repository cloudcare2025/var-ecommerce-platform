import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@var/database", "@var/shared", "@var/ui"],
};

export default nextConfig;
