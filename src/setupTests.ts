import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { resolveItemImage } from '@/lib/itemImages';
import { buildMonsterGroups } from '@/lib/monsterGroups';
import { buildMapRegions } from '@/lib/mapFishingRelations';

async function fetchMockedJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`http://localhost:3000${pathname}`);
  if (!response.ok) {
    throw new Error(`Failed to load mocked data from ${pathname}`);
  }

  return response.json() as Promise<T>;
}

async function fetchMockedJsonOrDefault<T>(pathname: string, fallback: T): Promise<T> {
  try {
    return await fetchMockedJson<T>(pathname);
  } catch {
    return fallback;
  }
}

function enrichItemsWithImages<T extends Record<string, { name?: string; image?: string }>>(items: T) {
  return Object.fromEntries(
    Object.entries(items).map(([key, item]) => [
      key,
      {
        ...item,
        image: resolveItemImage(item.name, item.image),
      },
    ]),
  );
}

// Setup MSW (handlers can still be extended per-test)
export const server = setupServer(
  http.get('http://localhost:3000/api/details/:type/:id', async ({ params }) => {
    const type = String(params.type);
    const id = String(params.id);

    if (type === 'item') {
      const items = enrichItemsWithImages(await fetchMockedJson<Record<string, { name?: string; image?: string }>>('/data/items.json'));
      const item = items[id];
      return item ? HttpResponse.json({ type: 'item', item, items }) : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'character' || type === 'birthday') {
      const [characters, items] = await Promise.all([
        fetchMockedJson<Record<string, unknown>>('/data/characters.json'),
        fetchMockedJsonOrDefault<Record<string, { name?: string; image?: string }>>('/data/items.json', {}),
      ]);
      const character = characters[id];
      return character
        ? HttpResponse.json({ type, character, items: enrichItemsWithImages(items) })
        : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'monster') {
      const [monsters, items] = await Promise.all([
        fetchMockedJson<Record<string, unknown>>('/data/monsters.json'),
        fetchMockedJsonOrDefault<Record<string, { name?: string; image?: string }>>('/data/items.json', {}),
      ]);
      const groups = buildMonsterGroups(Object.values(monsters) as never);
      const group = groups.find((entry) => entry.key === id || entry.representative.id === id);
      return group
        ? HttpResponse.json({ type: 'monster', group, items: enrichItemsWithImages(items) })
        : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'fish') {
      const fish = await fetchMockedJson<Array<Record<string, unknown>>>('/data/fishing.json');
      const fishEntry = fish.find((entry) => entry.id === id);
      return fishEntry ? HttpResponse.json({ type: 'fish', fish: fishEntry }) : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'map') {
      const [chests, fish] = await Promise.all([
        fetchMockedJson<Array<Record<string, unknown>>>('/data/chests.json'),
        fetchMockedJson<Array<Record<string, unknown>>>('/data/fishing.json'),
      ]);
      const regions = buildMapRegions(chests as never, fish as never);
      const region = regions.find((entry) => entry.id === id);
      return region ? HttpResponse.json({ type: 'map', region }) : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'festival') {
      const festivals = await fetchMockedJson<Array<Record<string, unknown>>>('/data/festivals.json');
      const festival = festivals.find((entry) => entry.id === id);
      return festival ? HttpResponse.json({ type: 'festival', festival }) : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    if (type === 'crop') {
      const crops = await fetchMockedJson<{ regularCrops: Array<Record<string, unknown>> }>('/data/crops.json');
      const crop = crops.regularCrops.find((entry) => entry.id === id);
      return crop ? HttpResponse.json({ type: 'crop', crop }) : HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json({ message: 'Unsupported type' }, { status: 404 });
  }),
  http.get('http://localhost:3000/api/crafter/bootstrap', async () => {
    const [items, crafterData] = await Promise.all([
      fetchMockedJsonOrDefault<Record<string, { name?: string; image?: string }>>('/data/items.json', {}),
      fetchMockedJsonOrDefault<Record<string, unknown>>('/data/crafter.json', {}),
    ]);

    return HttpResponse.json({
      items: enrichItemsWithImages(items),
      crafterData,
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());

// Polyfills for missing jsdom features required by Radix UI
if (typeof window !== 'undefined') {
  const PointerEventPolyfill = class PointerEventPolyfill extends Event {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  };

  window.PointerEvent = window.PointerEvent || (PointerEventPolyfill as unknown as typeof window.PointerEvent);
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia for useTheme hook
  window.matchMedia = window.matchMedia || function(query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  };
}
