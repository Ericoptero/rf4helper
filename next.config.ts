import type { NextConfig } from 'next';

const contentSecurityPolicyValue = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicyValue,
  },
  ...(process.env.ENABLE_CSP_REPORT_ONLY === 'true'
    ? [
        {
          key: 'Content-Security-Policy-Report-Only',
          value: contentSecurityPolicyValue,
        },
      ]
    : []),
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(), browsing-topics=()',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'development' ? { allowedDevOrigins: ['192.168.100.57'] } : {}),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
