import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Monster } from '@/lib/schemas';
import { MonstersList } from './MonstersList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockMonsters: Record<string, Monster> = {
  'monster-orc': {
    id: 'monster-orc',
    name: 'Orc',
    drops: [],
    stats: { hp: 100, atk: 10, def: 5, matk: 0, mdef: 0, str: 10, int: 0, vit: 5, spd: 5, exp: 10, gold: 5 }
  }
};

const server = setupServer(
  http.get('http://localhost:3000/data/monsters.json', () => {
    return HttpResponse.json(mockMonsters);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('MonstersList Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<MonstersList />, { wrapper });
    expect(screen.getByText(/loading monsters.../i)).toBeInTheDocument();
  });

  it('renders monsters after successful fetch', async () => {
    render(<MonstersList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading monsters.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('HP: 100')).toBeInTheDocument();
  });
});
