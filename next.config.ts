// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // Warn instead of failing on type errors during dev builds
    ignoreBuildErrors: false,
  },
  experimental: {
    // Enable the new app directory if you’re using Next 13+
    appDir: true,
  },
  // Optional: configure base path or asset prefix if needed
  // basePath: '',
  // assetPrefix: '',
}

module.exports = nextConfig;
