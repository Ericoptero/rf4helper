import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
  ...(process.env.NODE_ENV === 'development' ? { allowedDevOrigins: process.env.DEV_ORIGIN ? [process.env.DEV_ORIGIN] : [] } : {}),
};

export default nextConfig;
