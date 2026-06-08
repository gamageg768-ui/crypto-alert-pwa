/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'crypto-api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 30 },
      },
    },
    {
      urlPattern: /^https:\/\/query\.yahoofinance\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'stock-api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 30 },
      },
    },
  ],
});

const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  experimental: { serverComponentsExternalPackages: ['@prisma/client'] },
};

module.exports = withPWA(nextConfig);
