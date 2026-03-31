import { afterEach, describe, expect, it, vi } from 'vitest';

async function importNextConfig() {
  const imported = await import('./next.config');
  return imported.default;
}

describe('next.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('emits an enforced CSP header by default', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');

    const nextConfig = await importNextConfig();
    const headers = await nextConfig.headers?.();
    const rootHeaders = headers?.[0]?.headers ?? [];
    const cspHeader = rootHeaders.find((header) => header.key === 'Content-Security-Policy');

    expect(cspHeader).toBeDefined();
    expect(cspHeader?.value).toContain("script-src 'self' 'unsafe-inline'");
    expect(rootHeaders.find((header) => header.key === 'Content-Security-Policy-Report-Only')).toBeUndefined();
    expect(nextConfig.allowedDevOrigins).toBeUndefined();
  });

  it('limits allowedDevOrigins to development mode', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');

    const nextConfig = await importNextConfig();

    expect(nextConfig.allowedDevOrigins).toEqual(['192.168.100.57']);
  });

  it('adds a report-only mirror only when explicitly enabled', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_CSP_REPORT_ONLY', 'true');

    const nextConfig = await importNextConfig();
    const headers = await nextConfig.headers?.();
    const rootHeaders = headers?.[0]?.headers ?? [];

    expect(rootHeaders.find((header) => header.key === 'Content-Security-Policy')).toBeDefined();
    expect(rootHeaders.find((header) => header.key === 'Content-Security-Policy-Report-Only')).toBeDefined();
  });
});
