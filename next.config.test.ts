import { afterEach, describe, expect, it, vi } from 'vitest';

async function importNextConfig() {
  const imported = await import('./next.config');
  return imported.default;
}

describe('next.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not emit static CSP headers because proxy.ts owns request security headers', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');

    const nextConfig = await importNextConfig();

    expect(nextConfig.headers).toBeUndefined();
    expect(nextConfig.allowedDevOrigins).toBeUndefined();
  });

  it('limits allowedDevOrigins to development mode', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DEV_ORIGIN', '192.168.100.57');

    const nextConfig = await importNextConfig();

    expect(nextConfig.allowedDevOrigins).toEqual(['192.168.100.57']);
  });

  it('uses an empty allowedDevOrigins array when DEV_ORIGIN is not set', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'development');

    const nextConfig = await importNextConfig();

    expect(nextConfig.allowedDevOrigins).toEqual([]);
  });

  it('does not reintroduce static CSP headers when report-only mode is enabled', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ENABLE_CSP_REPORT_ONLY', 'true');

    const nextConfig = await importNextConfig();

    expect(nextConfig.headers).toBeUndefined();
  });
});
