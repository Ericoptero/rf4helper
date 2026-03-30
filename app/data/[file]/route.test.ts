import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /data/[file]', () => {
  it('returns the raw JSON payload for a known dataset file', async () => {
    const response = await GET(new Request('http://localhost/data/items.json'), {
      params: Promise.resolve({ file: 'items.json' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');

    const payload = await response.json();
    expect(payload['item-iron'].name).toBe('Iron');
  });

  it('returns crafter config as raw JSON', async () => {
    const response = await GET(new Request('http://localhost/data/crafter.json'), {
      params: Promise.resolve({ file: 'crafter.json' }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.slotConfigs ?? payload.defaults ?? payload.specialRules ?? payload.fixtures).toBeTruthy();
  });

  it('returns 404 for unknown files', async () => {
    const response = await GET(new Request('http://localhost/data/unknown.json'), {
      params: Promise.resolve({ file: 'unknown.json' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 404 for traversal-like filenames', async () => {
    const response = await GET(new Request('http://localhost/data/../items.json'), {
      params: Promise.resolve({ file: '../items.json' }),
    });

    expect(response.status).toBe(404);
  });
});
