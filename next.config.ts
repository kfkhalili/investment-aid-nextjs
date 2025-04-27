import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/companies",
        permanent: true, // 308 hard redirect (set false for 307)
      },
    ];
  },
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
