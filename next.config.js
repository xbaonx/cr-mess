const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async redirects() {
    const portal = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL || 'http://localhost:3100';
    return [
      {
        source: '/admin',
        destination: `${portal}`,
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: `${portal}/:path*`,
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@components': path.resolve(__dirname, 'components'),
      '@utils': path.resolve(__dirname, 'utils'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
