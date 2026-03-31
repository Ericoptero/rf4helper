import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/crafter/bootstrap', () => {
  it('returns crafter bootstrap payload', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600, stale-while-revalidate=86400');

    const payload = await response.json();
    expect(payload.items['item-iron'].name).toBe('Iron');
    expect(payload.items['item-iron'].buy).toBeUndefined();
    expect(payload.items['item-iron'].sell).toBeUndefined();
    expect(payload.crafterData.specialMaterialRules.length).toBeGreaterThan(0);
  });
});
