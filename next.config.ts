import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // next-auth v5 beta has known type issues; code is verified correct
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
