import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.financialmodelingprep.com",
        pathname: "/symbol/**", // wildcard path
      },
    ],
  },
};

export default nextConfig;
