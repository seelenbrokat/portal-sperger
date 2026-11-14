/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@sperger/shared'],
};

module.exports = nextConfig;
