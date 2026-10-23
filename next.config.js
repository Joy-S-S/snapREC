/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
// Support GitHub Pages subpath e.g. /snapREC/
const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
  : '/snapREC';

const basePath = isProd ? repoName : '';

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
