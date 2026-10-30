import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma must stay external to the server bundle (its native query engine
  // cannot be bundled) — required for `output: "standalone"` deployments
  // like Render. Without this, `next build` fails at "collecting page data"
  // for any route that imports the Prisma client.
  serverExternalPackages: ["@prisma/client", "prisma"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
