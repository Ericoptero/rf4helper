import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { buildContentSecurityPolicy, proxy } from './proxy';

describe('proxy', () => {
  beforeEach(() => {
    delete process.env.ENABLE_CSP_REPORT_ONLY;
  });

  it('builds a strict nonce-based content security policy', () => {
    const result = buildContentSecurityPolicy('test-nonce');

    expect(result).toContain("default-src 'self'");
    expect(result).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(result).toContain("style-src 'self' 'unsafe-inline'");
    expect(result).not.toContain(`script-src 'self' 'nonce-test-nonce' 'strict-dynamic' 'unsafe-inline'`);
  });

  it('adds CSP, nonce, and fixed security headers to responses', () => {
    const response = proxy(new NextRequest('http://localhost/items'));
    const contentSecurityPolicy = response.headers.get('content-security-policy');
    const nonceMatch = contentSecurityPolicy?.match(/'nonce-([A-Za-z0-9+/=]+)'/);
    const nonce = nonceMatch?.[1];

    expect(contentSecurityPolicy).toContain("script-src 'self' 'nonce-");
    expect(contentSecurityPolicy).toContain("'strict-dynamic'");
    expect(nonce).toBeTruthy();
    expect(contentSecurityPolicy).toContain(`'nonce-${nonce}'`);
    expect(response.headers.get('x-nonce')).toBeNull();
    expect(response.headers.get('strict-transport-security')).toBe('max-age=31536000; includeSubDomains');
    expect(response.headers.get('permissions-policy')).toBe('camera=(), geolocation=(), microphone=(), browsing-topics=()');
  });

  it('preserves the report-only header toggle', () => {
    process.env.ENABLE_CSP_REPORT_ONLY = 'true';

    const response = proxy(new NextRequest('http://localhost/items'));

    expect(response.headers.get('content-security-policy-report-only')).toBe(
      response.headers.get('content-security-policy'),
    );
  });
});
