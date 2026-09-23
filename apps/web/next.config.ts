import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@propertyhub/contracts", "@propertyhub/sdk"],
};

export default nextConfig;
