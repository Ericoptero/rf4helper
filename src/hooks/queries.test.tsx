import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { CrafterData, Item, Character, Monster } from '../lib/schemas';
import { useItems, useCharacters, useMonsters, useCrafterData } from './queries';
import { createTestQueryClient } from '../lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockItems: Record<string, Item> = {
  'item-bread': {
    id: 'item-bread',
    name: 'Bread',
    image: 'items/bread.png',
    type: 'Food',
    buy: 200,
    sell: 20,
    usedInRecipes: []
  },
  'item-masu-trout': {
    id: 'item-masu-trout',
    name: 'Masu Trout',
    image: 'fish/masu-trout.png',
    type: 'Fish',
    buy: 360,
    sell: 60,
    usedInRecipes: []
  },
  'item-power-wave': {
    id: 'item-power-wave',
    name: 'Power Wave',
    image: 'rune-abilities/rune-power-wave.png',
    type: 'Rune Ability',
    buy: 0,
    sell: 0,
    usedInRecipes: []
  },
  'item-ambrosias-thorns': {
    id: 'item-ambrosias-thorns',
    name: "Ambrosia's Thorns",
    image: 'items/ambrosias-thorns.png',
    type: 'Boss Drop',
    buy: 7000,
    sell: 400,
    usedInRecipes: []
  }
};

const mockCharacters: Record<string, Character> = {
  'char-forte': {
    id: 'char-forte',
    name: 'Forte',
    category: 'Bachelorettes',
    icon: {
      sm: '/characters/icons/sm/Forte.png',
      md: '/characters/icons/md/Forte.png',
    },
    portrait: '/characters/portrait/Forte.png',
    gender: 'Female',
    description: 'A steadfast knight of Selphia.',
    birthday: { season: 'Summer', day: 22 },
    battle: {
      description: 'A defensive frontline fighter.',
      stats: {
        level: 50,
        hp: 1200,
        atk: 300,
        def: 450,
        matk: 120,
        mdef: 280,
        str: 260,
        vit: 400,
        int: 100,
      },
      elementalResistances: { fire: 0, water: 10 },
      skills: ['Rush Attack'],
      weapon: 'Steel Sword',
      weaponType: 'Long Sword',
    },
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

const mockCrafterData: CrafterData = {
  slotConfigs: [
    { key: 'weapon', label: 'Weapon', stationType: 'Forging', stations: ['Short Sword'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
  ],
  defaults: {
    weapon: {
      appearanceId: 'item-bread',
      baseId: 'item-bread',
      inherits: [],
      upgrades: [],
    },
    armor: { baseId: '', appearanceId: '', inherits: [], upgrades: [] },
    headgear: { baseId: '', appearanceId: '', inherits: [], upgrades: [] },
    shield: { baseId: '', appearanceId: '', inherits: [], upgrades: [] },
    accessory: { baseId: '', inherits: [], upgrades: [] },
    shoes: { baseId: '', inherits: [], upgrades: [] },
    food: { baseId: '', ingredients: [] },
  },
  specialMaterialRules: [],
  weaponClassByStation: { 'Short Sword': 'Short Sword' },
  shieldCoverageByWeaponClass: { 'Short Sword': 'full' },
  chargeAttackByWeaponClass: { 'Short Sword': 'Rush Slash' },
  staffChargeByCrystalId: {},
  levelBonusTiers: [],
  rarityBonusTiers: [],
  foodOverrides: {},
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
  }),
  http.get('http://localhost:3000/data/crafter.json', () => {
    return HttpResponse.json(mockCrafterData);
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
    
    expect(result.current.data?.['item-bread'].name).toBe('Bread');
    expect(result.current.data?.['item-bread'].image).toBeTruthy();
    expect(result.current.data?.['item-masu-trout'].image).toBeTruthy();
    expect(result.current.data?.['item-power-wave'].image).toBeTruthy();
    expect(result.current.data?.['item-ambrosias-thorns'].image).toBeTruthy();
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
    expect(result.current.data?.['char-forte'].icon.md).toBe('/characters/icons/md/Forte.png');
    expect(result.current.data?.['char-forte'].birthday?.day).toBe(22);
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

  it('useCrafterData returns validated data', async () => {
    const { result } = renderHook(() => useCrafterData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.slotConfigs[0]?.key).toBe('weapon');
    expect(result.current.data?.defaults.weapon.baseId).toBe('item-bread');
  });
});
