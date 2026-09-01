import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app is the root of its own build even though a workspace package.json
  // sits one level up (used only for local one-command launchers).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
