import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@var/ui", "@var/shared", "@var/database"],
};

export default nextConfig;
