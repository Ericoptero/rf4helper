import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Monster } from '@/lib/schemas';
import { MonstersList } from './MonstersList';
import { buildMonsterGroups } from '@/lib/monsterGroups';

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
  http.get('/data/monsters.json', () => {
    return HttpResponse.json(mockMonsters);
  }),
  http.get('/api/details/:type/:id', ({ params }) => {
    if (params.type !== 'monster') {
      return HttpResponse.json({ message: 'Unsupported type' }, { status: 404 });
    }

    const groups = buildMonsterGroups(Object.values(mockMonsters));
    const id = String(params.id);
    const group = groups.find((entry) => entry.key === id || entry.representative.id === id);

    return group
      ? HttpResponse.json({ type: 'monster', group, items: {} })
      : HttpResponse.json({ message: 'Not found' }, { status: 404 });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

const mockMonsterGroups = buildMonsterGroups(Object.values(mockMonsters));

describe('MonstersList Component', () => {
  it('renders monsters from server-provided groups', async () => {
    render(<MonstersList monsters={mockMonsterGroups} />);

    expect(screen.getByText('Orc')).toBeInTheDocument();
  });

  it('renders grouped variants as one card with both locations', async () => {
    render(<MonstersList monsters={mockMonsterGroups} />);

    expect(screen.getAllByText('Octopirate')).toHaveLength(1);
    expect(screen.getByText(/Field Dungeon \(Boss\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rune Prana F2 \(Boss\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Octopirate 2')).not.toBeInTheDocument();
  });

  it('supports controlled table mode sorting and server-driven filter combinations', async () => {
    const { rerender } = render(
      <MonstersList
        monsters={mockMonsterGroups}
        viewMode="table"
        sortValue="level-desc"
      />,
    );

    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]!).getAllByRole('cell')[0]).toHaveTextContent('Death Orc');
    expect(within(rows[2]!).getAllByRole('cell')[0]).toHaveTextContent('Octopirate');

    rerender(
      <MonstersList
        monsters={mockMonsterGroups}
        viewMode="table"
        searchTerm="octo"
        filterValues={{
          tameable: 'yes',
          boss: 'yes',
          rideable: 'yes',
          location: 'field dungeon (boss)',
          drops: 'yes',
        }}
      />,
    );

    expect(await screen.findByText('Octopirate')).toBeInTheDocument();
    expect(screen.queryByText('Death Orc')).not.toBeInTheDocument();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);
  });

  it('renders drops as a quick toggle instead of a combobox filter', async () => {
    const user = userEvent.setup();

    render(<MonstersList monsters={mockMonsterGroups} />);

    await screen.findByText('Orc');
    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Quick Toggles')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /has drops/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: /drops/i })).not.toBeInTheDocument();
  });

  it('shows a location-labeled variant switcher and updates details when switching', async () => {
    const user = userEvent.setup();
    render(<MonstersList monsters={mockMonsterGroups} />);

    await user.click(screen.getByText('Octopirate'));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Ammonite', {}, { timeout: 5000 });

    expect(within(dialog).getAllByText('Octopirate').length).toBeGreaterThan(0);
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
    render(<MonstersList monsters={mockMonsterGroups} />);

    await user.type(screen.getByPlaceholderText(/search/i), 'Octopirate 2');

    expect(screen.getByText('Octopirate')).toBeInTheDocument();
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('does not show tameable badges or taming info for zero-befriend monsters', async () => {
    const user = userEvent.setup();
    render(<MonstersList monsters={mockMonsterGroups} />);

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
    render(<MonstersList monsters={mockMonsterGroups} />);

    await user.click(screen.getByText('Octopirate'));
    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(dialog).toHaveTextContent('Physical 0%');
    expect(screen.queryByText('HpDrain')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Field Dungeon (Boss)' }));
    expect(dialog).toHaveTextContent('Rideable: Yes');
  });

  it('hides rideable and nickname sections when data is missing', async () => {
    const user = userEvent.setup();
    render(<MonstersList monsters={mockMonsterGroups} />);

    await user.click(screen.getByText('Orc'));

    expect(screen.queryByText('Rideable:')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nicknames' })).not.toBeInTheDocument();
  });

  it('hydrates the monster drawer from a detail reference without loading unrelated domain content', async () => {
    render(
      <MonstersList
        monsters={mockMonsterGroups}
        detailReference={{ type: 'monster', id: 'monster-octopirate' }}
      />,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });

    expect(dialog).toHaveTextContent('A shelled octopus found along the seashore in the summer. Spurts ink.');
    expect(dialog).toHaveTextContent('Drops');
    expect(dialog).not.toHaveTextContent('Gift Preferences');
  });

  it('renders the monster drawer full width on mobile with a column hero layout', async () => {
    const user = userEvent.setup();

    render(<MonstersList monsters={mockMonsterGroups} />);

    await screen.findByText('Octopirate');
    await user.click(screen.getByText('Octopirate'));

    const dialog = await screen.findByRole('dialog', { name: 'Octopirate' });
    const heroImage = within(dialog).getByAltText('Octopirate');
    const hero = heroImage.closest('div')?.parentElement;
    const heroTitle = within(dialog).getAllByText('Octopirate', { selector: 'h2' })[1];

    expect(dialog).toHaveClass('w-full');
    expect(dialog).not.toHaveClass('data-[side=right]:w-3/4');
    expect(hero).toHaveClass('flex-col');
    expect(hero?.className).not.toContain('sm:flex-row');
    expect(heroTitle.closest('div')).toHaveClass('min-w-0');
  });
});
