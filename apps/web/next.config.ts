import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@excalidraw/excalidraw", "@hr-automation/db"],
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default nextConfig;
