import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'development' ? { allowedDevOrigins: process.env.DEV_ORIGIN ? [process.env.DEV_ORIGIN] : [] } : {}),
};

export default nextConfig;
