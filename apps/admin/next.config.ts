import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@var/database", "@var/shared", "@var/sync", "@var/ui"],
  serverExternalPackages: ["ssh2", "ssh2-sftp-client", "basic-ftp", "adm-zip"],
};

export default nextConfig;
