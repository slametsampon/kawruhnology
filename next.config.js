// next.config.js

const { withContentlayer } = require('next-contentlayer');
const nextMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  trailingSlash: true,

  images: {
    unoptimized: false,
  },

  // ⬅️ WAJIB agar page.mdx dikenali App Router
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = withContentlayer(nextMDX(nextConfig));
