import { NextResponse, type NextRequest } from 'next/server';

const FIXED_SECURITY_HEADERS = {
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), browsing-topics=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

export function buildContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function applyFixedSecurityHeaders(headers: Headers) {
  for (const [key, value] of Object.entries(FIXED_SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  applyFixedSecurityHeaders(response.headers);

  if (process.env.ENABLE_CSP_REPORT_ONLY === 'true') {
    response.headers.set('Content-Security-Policy-Report-Only', contentSecurityPolicy);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
