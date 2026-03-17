import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Item } from '@/lib/schemas';
import { ItemsList } from './ItemsList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockItems: Record<string, Item> = {
  'item-iron': { id: 'item-iron', name: 'Iron', type: 'Mineral', buy: 200, sell: 20, usedInRecipes: [] },
  'item-gold': { id: 'item-gold', name: 'Gold', type: 'Mineral', buy: 1000, sell: 250, usedInRecipes: [] }
};

const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => {
    return HttpResponse.json(mockItems);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('ItemsList Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<ItemsList />, { wrapper });
    expect(screen.getByText(/loading items.../i)).toBeInTheDocument();
  });

  it('renders items after successful fetch', async () => {
    render(<ItemsList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading items.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getAllByText('Mineral')).toHaveLength(2);
    expect(screen.getByText('200')).toBeInTheDocument();
  });
});
