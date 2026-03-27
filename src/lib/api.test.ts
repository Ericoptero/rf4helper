import path from 'node:path';
import { readFileSync } from 'node:fs';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCharacters,
  fetchChests,
  fetchCrafterData,
  fetchCrops,
  fetchFestivals,
  fetchFish,
  fetchItems,
  fetchMonsters,
  fetchOrders,
  fetchRequests,
  fetchRuneAbilities,
  fetchSkills,
  fetchTrophies,
} from './api';

function readPublicJson<T>(fileName: string): T {
  const filePath = path.resolve(process.cwd(), 'public', 'data', fileName);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

const successCases = [
  ['items', fetchItems, 'items.json'],
  ['characters', fetchCharacters, 'characters.json'],
  ['monsters', fetchMonsters, 'monsters.json'],
  ['chests', fetchChests, 'chests.json'],
  ['festivals', fetchFestivals, 'festivals.json'],
  ['crops', fetchCrops, 'crops.json'],
  ['fishing', fetchFish, 'fishing.json'],
  ['orders', fetchOrders, 'orders.json'],
  ['requests', fetchRequests, 'requests.json'],
  ['rune abilities', fetchRuneAbilities, 'runeAbilities.json'],
  ['skills', fetchSkills, 'skills.json'],
  ['trophies', fetchTrophies, 'trophies.json'],
  ['crafter', fetchCrafterData, 'crafter.json'],
] as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('typed API fetchers', () => {
  it.each(successCases)('parses %s data successfully', async (_label, fetcher, fileName) => {
    const payload = readPublicJson(fileName);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetcher();

    expect(result).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(`/data/${fileName}`);
  });

  it('enriches item images during the items fetch flow', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bread: {
          id: 'bread',
          name: 'Bread',
          type: 'Food',
          buy: 100,
          sell: 50,
          usedInRecipes: [],
        },
      }),
    }));

    const result = await fetchItems();

    expect(result.bread?.image).toBe('/images/items/bread.png');
  });

  it('keeps only the valid request sections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => readPublicJson('requests.json'),
    }));

    const result = await fetchRequests();

    expect(Object.keys(result)).toEqual([
      'itemrecipeRewards',
      'generalStoreSeedRewards',
      'carnationStoreSeedRewards',
      'repeatableRequests',
    ]);
  });

  it.each(successCases)('throws when %s fetching fails', async (_label, fetcher, fileName) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));

    await expect(fetcher()).rejects.toThrow(`/data/${fileName}`);
  });
});
