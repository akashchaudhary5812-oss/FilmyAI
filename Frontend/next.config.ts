import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable the development-only segment explorer in Next 15.5. It can
    // generate an invalid React client manifest during hot reload.
    devtoolSegmentExplorer: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
