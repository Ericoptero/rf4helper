import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/lib/test-utils';
import { routeTree } from '../routeTree.gen';

// Mock responses for the integration test
const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => HttpResponse.json({
    'item-iron': { id: 'item-iron', name: 'Iron', type: 'Mineral', buy: 200, sell: 20, usedInRecipes: [] }
  })),
  http.get('http://localhost:3000/data/characters.json', () => HttpResponse.json({
    'char-forte': {
      id: 'char-forte', name: 'Forte', category: 'Bachelorettes', gifts: {
        love: { items: [], categories: [] }, like: { items: [], categories: [] }, neutral: { items: [], categories: [] }, dislike: { items: [], categories: [] }, hate: { items: [], categories: [] }
      }
    }
  })),
  http.get('http://localhost:3000/data/monsters.json', () => HttpResponse.json({
    'monster-orc': {
      id: 'monster-orc', name: 'Orc', drops: [], stats: { hp: 100, atk: 10, def: 5, matk: 0, mdef: 0, str: 10, int: 0, vit: 5, spd: 5, exp: 10, gold: 5 }
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

    // Wait for data to load and verifying table content appears
    await waitFor(() => {
      expect(screen.getByText('Iron')).toBeInTheDocument();
      expect(screen.getByText('Mineral')).toBeInTheDocument();
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
      expect(screen.getByText('Characters Directory')).toBeInTheDocument();
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
      expect(screen.getByText('Bestiary')).toBeInTheDocument();
      expect(screen.getByText('Orc')).toBeInTheDocument();
      expect(screen.getByText('HP: 100')).toBeInTheDocument();
    });
  });
});
