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
});
