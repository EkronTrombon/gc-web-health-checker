import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint errors during  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
