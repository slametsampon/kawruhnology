// next.config.js

const { withContentlayer } = require('next-contentlayer');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ✅ Tetap trailing slash agar URL tetap konsisten (misal: /about/)
  trailingSlash: true,

  // ✅ Aktifkan image optimization bawaan Vercel
  images: {
    unoptimized: false,
  },

  // ✅ SVGR support tetap dipertahankan (bagus!)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = withContentlayer(nextConfig);
