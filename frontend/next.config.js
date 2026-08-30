/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,
  distDir: isDev ? '.next-dev' : '.next',
  env: {
    // Inlined into the client bundle at build time for the About page.
    // The app version is imported directly from package.json.
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Force polling so HMR works inside git worktrees on Windows
      // (chokidar skips dot-prefixed parent dirs like .worktrees/ by default)
      config.watchOptions = {
        poll: 500,
        aggregateTimeout: 200,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
