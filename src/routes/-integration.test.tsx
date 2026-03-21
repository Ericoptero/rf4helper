import { render, screen, waitFor } from '@testing-library/react';
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
    'item-iron': { id: 'item-iron', name: 'Iron', type: 'Mineral', buy: 200, sell: 20, usedInRecipes: [] },
    'item-bread': { id: 'item-bread', name: 'Bread', type: 'Food', buy: 120, sell: 30, usedInRecipes: [] },
    'item-apple': { id: 'item-apple', name: 'Apple', type: 'Crop', buy: 60, sell: 15, usedInRecipes: [] },
    'item-ambrosias-thorns': { id: 'item-ambrosias-thorns', name: "Ambrosia's Thorns", type: 'Boss Drop', buy: 900, sell: 100, usedInRecipes: [] },
    'item-10-fold-steel': { id: 'item-10-fold-steel', name: '10-Fold Steel', type: 'Material', buy: 0, sell: 1, usedInRecipes: [] },
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
    }
  }))
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

    // Initial loading or immediate render check
    await waitFor(() => {
      expect(screen.getByText('Items Database')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Iron')).toBeInTheDocument();
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  it('hydrates the items page from the letter search param', async () => {
    const router = createTestRouter(['/items?letter=b']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Iron')).not.toBeInTheDocument();
    expect(screen.queryByText('10-Fold Steel')).not.toBeInTheDocument();
  });

  it('hydrates the items page from the non-letter bucket search param', async () => {
    const router = createTestRouter(['/items?letter=%23']);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('10-Fold Steel')).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
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

  it('combines letter and q search params on the items page', async () => {
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

  it('falls back to the default items view when the letter search param is invalid', async () => {
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

  it('updates the items URL when the alphabet filter is changed', async () => {
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

    await user.click(screen.getByRole('button', { name: 'A' }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ letter: 'a' });
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
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
});
