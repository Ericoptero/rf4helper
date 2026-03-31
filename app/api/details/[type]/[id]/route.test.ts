import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/details/[type]/[id]', () => {
  it('returns a typed payload for known entities', async () => {
    const response = await GET(new Request('http://localhost/api/details/item/item-iron'), {
      params: Promise.resolve({ type: 'item', id: 'item-iron' }),
    });

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.type).toBe('item');
    expect(payload.item.name).toBe('Iron');
  });

  it('returns 404 for unknown entities', async () => {
    const response = await GET(new Request('http://localhost/api/details/item/missing-item'), {
      params: Promise.resolve({ type: 'item', id: 'missing-item' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 404 for unsupported detail types', async () => {
    const response = await GET(new Request('http://localhost/api/details/unknown/example'), {
      params: Promise.resolve({ type: 'unknown', id: 'example' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 400 for malformed ids', async () => {
    const response = await GET(new Request('http://localhost/api/details/item/item:iron'), {
      params: Promise.resolve({ type: 'item', id: 'item:iron' }),
    });

    expect(response.status).toBe(400);
  });

  it('allows spaced and cased ids that exist in the dataset', async () => {
    const mapResponse = await GET(new Request('http://localhost/api/details/map/Selphia%20Plains'), {
      params: Promise.resolve({ type: 'map', id: 'Selphia Plains' }),
    });
    const monsterResponse = await GET(new Request('http://localhost/api/details/monster/Orc'), {
      params: Promise.resolve({ type: 'monster', id: 'Orc' }),
    });

    expect(mapResponse.status).toBe(200);
    expect(monsterResponse.status).toBe(200);
  });
});
