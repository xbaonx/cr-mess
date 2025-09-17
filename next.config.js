const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    '@ant-design/colors',
    'rc-util',
    'rc-table',
    'rc-tree',
    'rc-select',
    'rc-pagination',
    'rc-picker',
    'rc-input',
    'rc-input-number',
    'rc-checkbox',
    'rc-dropdown',
    'rc-menu',
    'rc-tabs',
    'rc-collapse',
    'rc-dialog',
    'rc-tooltip',
    'rc-motion',
    'rc-trigger',
    'rc-overflow',
    'rc-image',
    'rc-notification',
    'rc-upload',
    'rc-progress',
    'rc-segmented',
    'rc-drawer',
    'rc-textarea',
    'rc-switch',
    'rc-virtual-list',
  ],
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
