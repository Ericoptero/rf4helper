import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { PlayerView } from './PlayerView';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

const mockOrders = [
  { id: 'order-1', orderName: 'Test Order', category: 'Licenses', requirement: '100 Wood', rpCost: 50 },
];

const mockRequests = {
  repeatableRequests: [
    { id: 'req-rep-1', request: 'Deliver Turnips', howToComplete: 'Ship 1 Turnip', reward: 'Turnip Seeds' }
  ],
  itemrecipeRewards: [
    { id: 'req-item-1', request: 'Defeat Orc', condition: 'Kill 1 Orc', reward: 'Broadsword' }
  ],
  generalStoreSeedRewards: [],
  carnationStoreSeedRewards: []
};

const mockRuneAbilities = {
  'short swords': [
    { id: 'rune-1', name: 'Power Wave', weaponType: 'Short Sword', description: 'Fire a shockwave', sell: 10, buy: 100 }
  ]
};

const mockSkills = [
  { id: 'skill-1', name: 'Swordsmanship', description: 'Skill with a sword', unlocks: { 'Level 10': 'New Recipe' } }
];

const mockTrophies = {
  general: [
    { id: 'trophy-1', name: 'First Steps', description: 'Started the game', requirements: 'None' }
  ]
};

const server = setupServer(
  http.get('http://localhost:3000/data/orders.json', () => HttpResponse.json(mockOrders)),
  http.get('http://localhost:3000/data/requests.json', () => HttpResponse.json(mockRequests)),
  http.get('http://localhost:3000/data/runeAbilities.json', () => HttpResponse.json(mockRuneAbilities)),
  http.get('http://localhost:3000/data/skills.json', () => HttpResponse.json(mockSkills)),
  http.get('http://localhost:3000/data/trophies.json', () => HttpResponse.json(mockTrophies)),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('PlayerView Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<PlayerView />, { wrapper });
    expect(screen.getByText(/loading player data.../i)).toBeInTheDocument();
  });

  it('renders orders tab default and data successfully', async () => {
    render(<PlayerView />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading player data.../i)).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('Player Dashboard')).toBeInTheDocument();

    // Check Default Tab (Orders)
    expect(screen.getByText('Test Order')).toBeInTheDocument();
    expect(screen.getByText('Cost: 50 RP')).toBeInTheDocument();
  });

  it('switches tabs and renders corresponding data', async () => {
    const user = userEvent.setup();
    render(<PlayerView />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading player data.../i)).not.toBeInTheDocument();
    });

    // Test Requests Tab
    await user.click(screen.getByRole('tab', { name: /requests/i }));
    expect(screen.getByText('Deliver Turnips')).toBeInTheDocument();
    expect(screen.getByText('Defeat Orc')).toBeInTheDocument();

    // Test Rune Abilities Tab
    await user.click(screen.getByRole('tab', { name: /rune abilities/i }));
    expect(screen.getByText('Power Wave')).toBeInTheDocument();

    // Test Skills Tab
    await user.click(screen.getByRole('tab', { name: /skills/i }));
    expect(screen.getByText('Swordsmanship')).toBeInTheDocument();

    // Test Trophies Tab
    await user.click(screen.getByRole('tab', { name: /trophies/i }));
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });
});
