import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Disable worker threads / jest workers to avoid EPERM issues in certain
  // sandboxed CI environments where `process.kill` is restricted.
  experimental: {
    workerThreads: false,
  },
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = config.resolve.alias ?? {};
    config.resolve.alias["@chroma-core/default-embed"] = path.resolve(
      __dirname,
      "stubs/chroma-default-embed.ts"
    );
    return config;
  },
};

export default nextConfig;
