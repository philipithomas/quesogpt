import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable worker threads / jest workers to avoid EPERM issues in certain
  // sandboxed CI environments where `process.kill` is restricted.
  experimental: {
    workerThreads: false,
  },
};

export default nextConfig;
