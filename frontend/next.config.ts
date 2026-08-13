import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone", // standalone mode keeps the Docker image small
  experimental: {
    externalDir: true,
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "sprofile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Landing page captures, served from R2.
      {
        protocol: "https",
        hostname: "assets.synqer.club",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
