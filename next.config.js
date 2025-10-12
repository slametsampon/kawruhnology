// next.config.js

const { withContentlayer } = require('next-contentlayer');

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ✅ Penting untuk static export
  output: 'export',

  // ✅ Wajib untuk mendukung routing /about/ dll
  trailingSlash: true,

  // ✅ Wajib agar image Next.js tidak error saat export
  images: {
    unoptimized: true,
  },

  // ✅ Penting untuk GitHub Pages: menyesuaikan basePath
  basePath: isProd ? '/kawruhnology' : '',

  // ✅ Expose basePath agar bisa digunakan di komponen (client)
  env: {
    BASE_PATH: isProd ? '/kawruhnology' : '',
  },

  webpack(config) {
    // 🔥 Tambahkan rule untuk SVGR
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = withContentlayer(nextConfig);
