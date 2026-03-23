import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Monster } from '@/lib/schemas';
import { MonstersList } from './MonstersList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockMonsters: Record<string, Monster> = {
  'monster-octopirate': {
    id: 'monster-octopirate',
    name: 'Octopirate',
    variantGroup: 'Octopirate',
    variantSuffix: null,
    image: '/images/monsters/octopirate',
    description: 'A shelled octopus found along the seashore in the summer. Spurts ink.',
    location: 'Field Dungeon (Boss)',
    drops: [
      { id: 'item-ammonite', name: 'Ammonite', dropRates: [0.7, 0.1] },
      { id: 'item-fish-fossil', name: 'Fish Fossil', dropRates: [40] },
    ],
    nickname: ['Octo'],
    resistances: {
      fire: 50,
      water: 50,
      normal: 0,
    },
    stats: { baseLevel: 84, hp: 12960, atk: 380, def: 288, matk: 350, mdef: 200, str: 320, int: 280, vit: 310, exp: 700, bonus: null },
    taming: { tameable: true, isRideable: true, befriend: 1, favorite: [], produce: [], cycle: null },
  },
  'monster-octopirate-2': {
    id: 'monster-octopirate-2',
    name: 'Octopirate 2',
    variantGroup: 'Octopirate',
    variantSuffix: '2',
    image: '/images/monsters/octopirate',
    description: 'A stronger Rune Prana encounter.',
    location: 'Rune Prana F2 (Boss)',
    drops: [
      { id: 'item-ammonite', name: 'Ammonite', dropRates: [70, 20] },
      { id: 'item-fish-fossil', name: 'Fish Fossil', dropRates: [40] },
      { id: 'item-vital-gummi', name: 'Vital Gummi', dropRates: [8] },
    ],
    nickname: [],
    resistances: {
      fire: 200,
      water: 200,
      normal: 0,
    },
    stats: { baseLevel: 249, hp: 42000, atk: 1900, def: 700, matk: 1780, mdef: 980, str: 800, int: 800, vit: 1080, exp: 36000, bonus: null },
    taming: { tameable: true, isRideable: true, befriend: 1, favorite: [], produce: [], cycle: null },
  },
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
  'monster-death-orc': {
    id: 'monster-death-orc',
    name: 'Death Orc',
    image: '/images/monsters/death-orc',
    description: 'A dangerous foe that should not be marked tameable.',
    location: 'Rune Prana F7',
    drops: [{ id: 'item-ancient-orc-cloth', name: 'Ancient Orc Cloth', dropRates: [8] }],
    nickname: [],
    stats: { baseLevel: 279, hp: 50000, atk: 6000, def: 3800, matk: 4000, mdef: 3000, str: 1600, int: 600, vit: 800, exp: 40500, bonus: null },
    taming: {
      tameable: true,
      isRideable: null,
      befriend: 0,
      favorite: [{ id: 'item-onigiri', name: 'Onigiri', favorite: 5 }],
      produce: [{ id: 'item-fur-s', name: 'Fur (S)', level: 1 }],
      cycle: 'Daily',
    },
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
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders monsters after successful fetch', async () => {
    render(<MonstersList />, { wrapper });

    await screen.findByText('Orc');

    expect(screen.getByText('Orc')).toBeInTheDocument();
  });

  it('renders grouped variants as one card with both locations', async () => {
    render(<MonstersList />, { wrapper });

    await screen.findByText('Octopirate');

    expect(screen.getAllByText('Octopirate')).toHaveLength(1);
    expect(screen.getByText(/Field Dungeon \(Boss\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rune Prana F2 \(Boss\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Octopirate 2')).not.toBeInTheDocument();
  });

  it('shows a location-labeled variant switcher and updates details when switching', async () => {
    const user = userEvent.setup();
    render(<MonstersList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Octopirate')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Octopirate'));
    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(screen.getAllByText('Octopirate').length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent('Ammonite');
    expect(dialog).toHaveTextContent('Nicknames');
    expect(screen.getByRole('heading', { name: 'Nicknames' })).toBeInTheDocument();
    expect(screen.getByText('Octo')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Rideable: Yes');
    expect(dialog).toHaveTextContent('Physical 0%');
    expect(screen.getByRole('tab', { name: 'Field Dungeon (Boss)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rune Prana F2 (Boss)' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Rune Prana F2 (Boss)' }));

    expect(dialog).toHaveTextContent('A stronger Rune Prana encounter.');
    expect(dialog).toHaveTextContent('Vital Gummi');
    expect(dialog).toHaveTextContent('42000');
    expect(screen.queryByRole('heading', { name: 'Nicknames' })).not.toBeInTheDocument();
  });

  it('finds grouped cards by suffixed variant names', async () => {
    const user = userEvent.setup();
    render(<MonstersList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Octopirate')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/search/i), 'Octopirate 2');

    expect(screen.getByText('Octopirate')).toBeInTheDocument();
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('does not show tameable badges or taming info for zero-befriend monsters', async () => {
    const user = userEvent.setup();
    render(<MonstersList />, { wrapper });

    await screen.findByText('Death Orc');

    const deathOrcCard = screen.getByText('Death Orc').closest('[class*="cursor-pointer"]');
    expect(deathOrcCard).not.toHaveTextContent(/tameable/i);

    await user.click(screen.getByText('Death Orc'));
    const dialog = await screen.findByRole('dialog', { name: 'Death Orc' });

    expect(screen.getAllByText('Death Orc').length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent('Not Tameable');
    expect(screen.queryByText('Taming Info')).not.toBeInTheDocument();
  });

  it('hides rideable info when rideability is unknown and renders readable resistance labels', async () => {
    const user = userEvent.setup();
    render(<MonstersList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Death Orc')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Octopirate'));
    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(dialog).toHaveTextContent('Physical 0%');
    expect(screen.queryByText('HpDrain')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Field Dungeon (Boss)' }));
    expect(dialog).toHaveTextContent('Rideable: Yes');
  });

  it('hides rideable and nickname sections when data is missing', async () => {
    const user = userEvent.setup();
    render(<MonstersList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Orc')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Orc'));

    expect(screen.queryByText('Rideable:')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nicknames' })).not.toBeInTheDocument();
  });

  it('hydrates the monster drawer from detailValue without loading unrelated domain content', async () => {
    render(<MonstersList detailValue="monster:monster-octopirate" />, { wrapper });

    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(dialog).toHaveTextContent('A shelled octopus found along the seashore in the summer. Spurts ink.');
    expect(dialog).toHaveTextContent('Drops');
    expect(dialog).not.toHaveTextContent('Gift Preferences');
  });
});
