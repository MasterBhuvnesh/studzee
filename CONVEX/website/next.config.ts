import type { NextConfig } from 'next';

// A stray package.json in a parent dir otherwise makes Turbopack infer the wrong
// workspace root and break module resolution. Pin it to this app. npm scripts run
// with cwd = the package dir, so process.cwd() is this app's folder.
const projectRoot =
  typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
