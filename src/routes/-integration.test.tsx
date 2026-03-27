import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/lib/test-utils';
import { routeTree } from '../routeTree.gen';
import userEvent from '@testing-library/user-event';

// Mock responses for the integration test
const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => HttpResponse.json({
    'item-iron': { id: 'item-iron', name: 'Iron', type: 'Mineral', category: 'material', region: 'Selphia Plains', buy: 200, sell: 20, usedInRecipes: [] },
    'item-bread': { id: 'item-bread', name: 'Bread', type: 'Food', category: 'food', region: 'Selphia', buy: 120, sell: 30, usedInRecipes: [] },
    'item-apple': { id: 'item-apple', name: 'Apple', type: 'Crop', category: 'crop', region: 'Selphia Plains', buy: 60, sell: 15, usedInRecipes: [] },
    'item-ambrosias-thorns': { id: 'item-ambrosias-thorns', name: "Ambrosia's Thorns", type: 'Boss Drop', category: 'boss-drop', region: 'Autumn Road', buy: 900, sell: 100, usedInRecipes: [] },
    'item-10-fold-steel': { id: 'item-10-fold-steel', name: '10-Fold Steel', type: 'Material', category: 'material', region: 'Leon Karnak', buy: 0, sell: 1, usedInRecipes: [] },
    'item-broadsword': { id: 'item-broadsword', name: 'Broadsword', type: 'Forge', category: 'shortSword', craft: [{ recipeId: 'item-broadsword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: ['item-iron'] }], stats: { atk: 5, diz: 6 }, usedInRecipes: [] },
    'item-claymore': { id: 'item-claymore', name: 'Claymore', type: 'Forge', category: 'longSword', craft: [{ recipeId: 'item-claymore#2', stationType: 'Forging', station: 'Long Sword', level: 2, ingredients: ['item-iron'] }], stats: { atk: 10 }, usedInRecipes: [] },
    'item-royal-garter': { id: 'item-royal-garter', name: 'Royal Garter', type: 'Craft', category: 'armor', craft: [{ recipeId: 'item-royal-garter#90', stationType: 'Crafting', station: 'Armor', level: 90, ingredients: ['item-iron'] }], stats: { def: 100 }, usedInRecipes: [] },
    'item-feathered-hat': { id: 'item-feathered-hat', name: 'Feathered Hat', type: 'Craft', category: 'headgear', craft: [{ recipeId: 'item-feathered-hat#51', stationType: 'Crafting', station: 'Headgear', level: 51, ingredients: ['item-iron'] }], stats: { def: 20 }, usedInRecipes: [] },
    'item-rune-shield': { id: 'item-rune-shield', name: 'Rune Shield', type: 'Craft', category: 'shield', craft: [{ recipeId: 'item-rune-shield#94', stationType: 'Crafting', station: 'Shield', level: 94, ingredients: ['item-iron'] }], stats: { def: 80 }, effects: [{ type: 'resistance', target: 'light', value: 50 }], usedInRecipes: [] },
    'item-strange-pendant': { id: 'item-strange-pendant', name: 'Strange Pendant', type: 'Craft', category: 'accessory', craft: [{ recipeId: 'item-strange-pendant#85', stationType: 'Crafting', station: 'Accessory', level: 85, ingredients: ['item-iron'] }], stats: { str: 30 }, usedInRecipes: [] },
    'item-heavy-boots': { id: 'item-heavy-boots', name: 'Heavy Boots', type: 'Craft', category: 'shoes', craft: [{ recipeId: 'item-heavy-boots#20', stationType: 'Crafting', station: 'Shoes', level: 20, ingredients: ['item-iron'] }], stats: { def: 22 }, usedInRecipes: [] },
    'item-glitter-sashimi': { id: 'item-glitter-sashimi', name: 'Glitter Sashimi', type: 'Dish', craft: [{ recipeId: 'item-glitter-sashimi#92', stationType: 'Cooking', station: 'Knife', level: 92, ingredients: ['item-apple'] }], stats: { hp: 5000, str: 150 }, usedInRecipes: [] },
    'item-object-x': { id: 'item-object-x', name: 'Object X', type: 'Potion', category: 'medicine', usedInRecipes: [] },
    'item-double-steel': { id: 'item-double-steel', name: 'Double Steel', type: 'Material', category: 'material', usedInRecipes: [] },
    'item-light-ore': { id: 'item-light-ore', name: 'Light Ore', type: 'Material', category: 'material', usedInRecipes: [] },
  })),
  http.get('http://localhost:3000/data/characters.json', () => HttpResponse.json({
    'char-forte': {
      id: 'char-forte', name: 'Forte', category: 'Bachelorettes',
      icon: { sm: '/characters/icons/sm/Forte.png', md: '/characters/icons/md/Forte.png' },
      portrait: '/characters/portrait/Forte.png',
      gender: 'Female',
      description: 'A steadfast knight of Selphia.',
      birthday: { season: 'Summer', day: 22 },
      battle: null,
      gifts: {
        love: { items: [], categories: [] }, like: { items: [], categories: [] }, neutral: { items: [], categories: [] }, dislike: { items: [], categories: [] }, hate: { items: [], categories: [] }
      }
    }
  })),
  http.get('http://localhost:3000/data/monsters.json', () => HttpResponse.json({
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
    },
    'monster-octopirate': {
      id: 'monster-octopirate',
      name: 'Octopirate',
      variantGroup: 'Octopirate',
      image: '/images/monsters/octopirate',
      description: 'A seaside boss monster.',
      location: 'Field Dungeon (Boss)',
      drops: [],
      nickname: [],
      stats: { baseLevel: 84, hp: 12960, atk: 380, def: 288, matk: 350, mdef: 200, str: 320, int: 280, vit: 310, exp: 700, bonus: null },
      taming: { tameable: true, isRideable: true, befriend: 1, favorite: [], produce: [], cycle: null },
    },
  })),
  http.get('http://localhost:3000/data/fishing.json', () => HttpResponse.json([
    {
      id: 'fish-masu',
      name: 'Masu Trout',
      sell: 200,
      shadow: 'small',
      locations: [
        { region: 'Selphia Plains', spot: 'Town Pond', seasons: ['Spring'] },
      ],
    },
    {
      id: 'fish-squid',
      name: 'Squid',
      sell: 120,
      shadow: 'medium',
      locations: [
        { region: 'Autumn Road and Silver Arch', spot: 'River Fork', seasons: ['Summer'] },
      ],
    },
  ])),
  http.get('http://localhost:3000/data/chests.json', () => HttpResponse.json([
    { id: 'chest-1', region: 'Selphia Plains', roomCode: 'A1', itemName: 'Bread' },
    { id: 'chest-2', region: 'Autumn Road', roomCode: 'B2', itemName: 'Iron', notes: 'Behind a tree' },
  ])),
  http.get('http://localhost:3000/data/festivals.json', () => HttpResponse.json([])),
  http.get('http://localhost:3000/data/crops.json', () => HttpResponse.json({ regularCrops: [] })),
  http.get('http://localhost:3000/data/crafter.json', () => HttpResponse.json({
    slotConfigs: [
      { key: 'weapon', label: 'Weapon', stationType: 'Forging', stations: ['Short Sword', 'Long Sword'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: null, levelBonusTargets: ['atk', 'matk'], rarityBonusTarget: 'weapon' },
      { key: 'armor', label: 'Armor', stationType: 'Crafting', stations: ['Armor'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: 'item-iron', levelBonusTargets: ['def', 'mdef'], rarityBonusTarget: 'def' },
      { key: 'headgear', label: 'Headgear', stationType: 'Crafting', stations: ['Headgear'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: 'item-iron', levelBonusTargets: ['def', 'mdef'], rarityBonusTarget: 'mdef' },
      { key: 'shield', label: 'Shield', stationType: 'Crafting', stations: ['Shield'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: 'item-iron', levelBonusTargets: ['def', 'mdef'], rarityBonusTarget: 'def' },
      { key: 'accessory', label: 'Accessory', stationType: 'Crafting', stations: ['Accessory'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: 'item-iron', levelBonusTargets: ['def', 'mdef'], rarityBonusTarget: 'mdef' },
      { key: 'shoes', label: 'Shoes', stationType: 'Crafting', stations: ['Shoes'], supportsAppearance: false, supportsBaseSelection: true, recipeSlots: 6, inheritSlots: 3, upgradeSlots: 9, carrierId: 'item-iron', levelBonusTargets: ['def', 'mdef'], rarityBonusTarget: 'def' },
    ],
    defaults: {
      weapon: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      armor: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      headgear: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      shield: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      accessory: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      shoes: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
      food: { baseId: undefined, recipe: [] },
    },
    specialMaterialRules: [
      { itemId: 'item-object-x', behavior: 'invert' },
      { itemId: 'item-double-steel', behavior: 'doublePrevious' },
      { itemId: 'item-10-fold-steel', behavior: 'tenFoldPrevious' },
      { itemId: 'item-light-ore', behavior: 'lightOre' },
    ],
    weaponClassByStation: { 'Short Sword': 'Short Sword', 'Long Sword': 'Long Sword' },
    shieldCoverageByWeaponClass: { 'Short Sword': 'full', 'Long Sword': 'partial' },
    starterWeaponByClass: { 'Short Sword': 'item-broadsword', 'Long Sword': 'item-claymore' },
    chargeAttackByWeaponClass: { 'Short Sword': 'Rush Slash', 'Long Sword': 'Cyclone' },
    staffChargeByCrystalId: {},
    levelBonusTiers: [],
    rarityBonusTiers: [],
    foodOverrides: {},
    recipes: {
      equipment: {
        weapon: {
          'item-broadsword': { itemName: 'Broadsword', station: 'Short Sword', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
          'item-claymore': { itemName: 'Claymore', station: 'Long Sword', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
        armor: {
          'item-royal-garter': { itemName: 'Royal Garter', station: 'Armor', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
        headgear: {
          'item-feathered-hat': { itemName: 'Feathered Hat', station: 'Headgear', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
        shield: {
          'item-rune-shield': { itemName: 'Rune Shield', station: 'Shield', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
        accessory: {
          'item-strange-pendant': { itemName: 'Strange Pendant', station: 'Accessory', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
        shoes: {
          'item-heavy-boots': { itemName: 'Heavy Boots', station: 'Shoes', materials: ['item-iron', null, null, null, null, null], materialNames: ['Iron', null, null, null, null, null], rarity: 1 },
        },
      },
      food: {
        'item-glitter-sashimi': { itemName: 'Glitter Sashimi', station: 'Knife', materials: ['item-apple', null, null, null, null, null], materialNames: ['Apple', null, null, null, null, null], rarity: 1 },
      },
    },
    stats: {
      weapon: {
        'item-broadsword': { itemName: 'Broadsword', stats: { atk: 5 }, weaponClass: 'Short Sword' },
        'item-claymore': { itemName: 'Claymore', stats: { atk: 10 }, weaponClass: 'Long Sword' },
      },
      armor: {
        'item-royal-garter': { itemName: 'Royal Garter', stats: { def: 100 } },
        'item-feathered-hat': { itemName: 'Feathered Hat', stats: { def: 20 } },
        'item-rune-shield': { itemName: 'Rune Shield', stats: { def: 80 }, resistances: { light: 0.5 } },
        'item-strange-pendant': { itemName: 'Strange Pendant', stats: { str: 30 } },
        'item-heavy-boots': { itemName: 'Heavy Boots', stats: { def: 22 } },
      },
    },
    materials: {
      weapon: {
        'item-10-fold-steel': { itemName: '10-Fold Steel', rarity: 1 },
        'item-double-steel': { itemName: 'Double Steel', rarity: 1 },
        'item-light-ore': { itemName: 'Light Ore', rarity: 1 },
      },
      armor: {},
      food: {
        'item-apple': { additive: { hp: 10 } },
      },
    },
    food: {
      baseStats: {
        'item-glitter-sashimi': { additive: { hp: 5000, str: 150 } },
      },
    },
    bonusEffects: {},
    staff: { chargeAttacks: {}, bases: {} },
    fixtures: {},
  })),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Routing Integration', () => {
  const createTestRouter = (initialHistory: string[]) => {
    const memoryHistory = createMemoryHistory({
      initialEntries: initialHistory,
    });
    
    const router = createRouter({
      routeTree,
      history: memoryHistory,
    });

    return router;
  };

  it('navigates to items and displays the list', async () => {
    const router = createTestRouter(['/items']);
    
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Items Database', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();

    expect(screen.getAllByRole('link', { name: /home/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /items/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole('link', { name: /items/i })
        .some((link) => link.getAttribute('data-status') === 'active'),
    ).toBe(true);
    expect(screen.getByRole('complementary')).toHaveClass('lg:fixed');
    expect(screen.getByRole('complementary')).toHaveClass('lg:h-dvh');
    expect(screen.getByRole('main')).toHaveClass('lg:pl-64');
  }, 15000);

  it('opens the mobile navigation drawer and closes it after navigation', async () => {
    const user = userEvent.setup();
    const router = createTestRouter(['/items']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Items Database', {}, { timeout: 10000 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open navigation menu/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Navigation')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('link', { name: /^home$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /rune factory 4 helper/i })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }, 15000);

  it('renders the redesigned home route with category entry points', async () => {
    const router = createTestRouter(['/']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /rune factory 4 helper/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/enchanted codex/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /items/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /monsters/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /characters/i }).length).toBeGreaterThan(0);
  });

  it('ignores the removed letter search param on the items page', async () => {
    const router = createTestRouter(['/items?letter=b']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('10-Fold Steel')).toBeInTheDocument();
  });

  it('ignores the removed non-letter bucket search param on the items page', async () => {
    const router = createTestRouter(['/items?letter=%23']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('10-Fold Steel')).toBeInTheDocument();
    });

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
  });

  it('hydrates the items page from the q search param', async () => {
    const router = createTestRouter(['/items?q=thorn']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('thorn')).toBeInTheDocument();
      expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('applies q search params while ignoring removed letter search params on the items page', async () => {
    const router = createTestRouter(['/items?letter=a&q=am']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
  });

  it('falls back to the default items view when the removed letter search param is invalid', async () => {
    const router = createTestRouter(['/items?letter=invalid']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Iron')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  it('drops the removed letter search param on the next items route interaction', async () => {
    const user = userEvent.setup();
    const router = createTestRouter(['/items?letter=a']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Iron')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'iron');

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ q: 'iron' });
      expect(router.state.location.search).not.toHaveProperty('letter');
      expect(screen.getByText('Iron')).toBeInTheDocument();
    });
  });

  it('updates the items URL when the search input changes', async () => {
    const user = userEvent.setup();
    const router = createTestRouter(['/items']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Iron')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'thorn');

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ q: 'thorn' });
      expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    });
  });

  it('navigates to characters and displays the list', async () => {
    const router = createTestRouter(['/characters']);
    
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Characters' })).toBeInTheDocument();
      expect(screen.getByText('Forte')).toBeInTheDocument();
      expect(screen.getByText('Bachelorettes')).toBeInTheDocument();
    });
  });

  it('hydrates the characters page from URL filters and table mode', async () => {
    const router = createTestRouter(['/characters?category=bachelorettes&gender=female&view=table']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Forte')).toBeInTheDocument();
    });
  });

  it('navigates to monsters and displays the list', async () => {
    const router = createTestRouter(['/monsters']);
    
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Monsters Compendium')).toBeInTheDocument();
      expect(screen.getByText('Orc')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('hydrates the monsters page from the boss filter search param', async () => {
    const router = createTestRouter(['/monsters?boss=yes']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Octopirate')).toBeInTheDocument();
    });

    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
  });

  it('hydrates the characters page detail drawer from the URL', async () => {
    const router = createTestRouter(['/characters?detail=character:char-forte']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    const dialog = await screen.findByRole('dialog', { name: 'Forte' });

    expect(dialog).toHaveTextContent('A steadfast knight of Selphia.');
    expect(dialog).toHaveTextContent('Gift Preferences');
  });

  it('hydrates the monsters page detail drawer from the URL', async () => {
    const router = createTestRouter(['/monsters?detail=monster:monster-octopirate']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(dialog).toHaveTextContent('A seaside boss monster.');
    expect(dialog).toHaveTextContent('Taming Info');
  });

  it('hydrates the fishing page from shadow and view search params', async () => {
    const router = createTestRouter(['/fishing?shadow=small&view=table']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Masu Trout')).toBeInTheDocument();
    });

    expect(screen.queryByText('Squid')).not.toBeInTheDocument();
  });

  it('hydrates the maps page from hasFishing filter and opens detail from the URL', async () => {
    const router = createTestRouter(['/maps?hasFishing=yes&detail=map:Selphia%20Plains']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Selphia Plains').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole('heading', { name: 'Selphia Plains' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/fishing/i).length).toBeGreaterThan(0);
  });

  it('renders the crafter route and hydrates build state from the URL', async () => {
    const build = JSON.stringify({
      weapon: {
        appearanceId: 'item-broadsword',
        recipe: [{ itemId: 'item-claymore', level: 8 }, { itemId: 'item-light-ore', level: 10 }],
        upgrades: [{ itemId: 'item-10-fold-steel', level: 10 }],
      },
      armor: { appearanceId: 'item-royal-garter', recipe: [], inherits: [], upgrades: [] },
      headgear: { appearanceId: 'item-feathered-hat', recipe: [], inherits: [], upgrades: [] },
      shield: { appearanceId: 'item-rune-shield', recipe: [], inherits: [], upgrades: [] },
      accessory: { appearanceId: 'item-strange-pendant', recipe: [], inherits: [], upgrades: [] },
      shoes: { appearanceId: 'item-heavy-boots', recipe: [], inherits: [], upgrades: [] },
      food: { baseId: 'item-glitter-sashimi', recipe: [] },
    });
    const router = createTestRouter([`/crafter?${new URLSearchParams({ build, view: 'advanced' }).toString()}`]);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /interactive crafter/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /final build/i })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('tab', { name: /weapon/i }));
    expect(screen.getByRole('button', { name: /broadsword/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /appearance/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade 9/i })).toBeInTheDocument();
    expect(screen.getAllByText(/broadsword/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/actual base/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/claymore/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /simple/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /advanced/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/craft notes/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^resume$/i)).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /breakdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /final build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /readme/i })).not.toBeInTheDocument();
  });

  it('updates the crafter URL when the build changes', async () => {
    const user = userEvent.setup();
    const router = createTestRouter(['/crafter']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /interactive crafter/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Clay');
    await user.click(await within(dialog).findByRole('button', { name: /claymore/i }));
    await user.click(within(dialog).getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(router.state.location.search).toHaveProperty('build');
      expect(String(router.state.location.search.build)).toContain('item-claymore');
      expect(String(router.state.location.search.build)).toContain('appearanceId');
    });
  });
});
