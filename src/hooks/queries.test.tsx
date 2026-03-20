import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Item, Character, Monster } from '../lib/schemas';
import { useItems, useCharacters, useMonsters } from './queries';
import { createTestQueryClient } from '../lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockItems: Record<string, Item> = {
  'item-iron': { id: 'item-iron', name: 'Iron', type: 'Mineral', buy: 200, sell: 20, usedInRecipes: [] }
};

const mockCharacters: Record<string, Character> = {
  'char-forte': {
    id: 'char-forte',
    name: 'Forte',
    category: 'Bachelorettes',
    gifts: {
      love: { items: [], categories: [] },
      like: { items: [], categories: [] },
      neutral: { items: [], categories: [] },
      dislike: { items: [], categories: [] },
      hate: { items: [], categories: [] },
    }
  }
};

const mockMonsters: Record<string, Monster> = {
  'monster-orc': {
    id: 'monster-orc',
    name: 'Orc',
    image: '/images/monsters/orc',
    description: 'A brutish monster.',
    location: 'Selphia Plain',
    drops: [],
    nickname: [],
    stats: { baseLevel: 3, hp: 100, atk: 10, def: 5, matk: 0, mdef: 0, str: 10, int: 0, vit: 5, exp: 10, bonus: null },
    taming: { tameable: false, isRideable: null, befriend: null, favorite: [], produce: [], cycle: null },
  }
};

const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => {
    return HttpResponse.json(mockItems);
  }),
  http.get('http://localhost:3000/data/characters.json', () => {
    return HttpResponse.json(mockCharacters);
  }),
  http.get('http://localhost:3000/data/monsters.json', () => {
    return HttpResponse.json(mockMonsters);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('Data Fetching Hooks', () => {
  it('useItems returns validated data', async () => {
    const { result } = renderHook(() => useItems(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      if (result.current.isError) {
        console.error(result.current.error);
      }
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data?.['item-iron'].name).toBe('Iron');
  });

  it('useCharacters returns validated data', async () => {
    const { result } = renderHook(() => useCharacters(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      if (result.current.isError) {
        console.error(result.current.error);
      }
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data?.['char-forte'].name).toBe('Forte');
  });

  it('useMonsters returns validated data', async () => {
    const { result } = renderHook(() => useMonsters(), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      if (result.current.isError) {
        console.error(result.current.error);
      }
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data?.['monster-orc'].name).toBe('Orc');
  });
});
