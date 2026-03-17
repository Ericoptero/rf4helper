import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Character } from '@/lib/schemas';
import { CharactersList } from './CharactersList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

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

const server = setupServer(
  http.get('http://localhost:3000/data/characters.json', () => {
    return HttpResponse.json(mockCharacters);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('CharactersList Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<CharactersList />, { wrapper });
    expect(screen.getByText(/loading characters.../i)).toBeInTheDocument();
  });

  it('renders characters after successful fetch', async () => {
    render(<CharactersList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading characters.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Forte')).toBeInTheDocument();
    expect(screen.getByText('Bachelorettes')).toBeInTheDocument();
  });
});
