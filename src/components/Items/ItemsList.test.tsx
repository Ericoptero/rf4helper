import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Item } from '@/lib/schemas';
import { ItemsList } from './ItemsList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

type MockEffect =
  | { type: 'cure'; targets: string[] }
  | { type: 'resistance'; target: string; value: number }
  | { type: 'inflict'; target: string; trigger: 'attack' | 'consume'; chance?: number };

type MockItem = Item & {
  groupMembers?: string[];
  effects?: MockEffect[];
};

const mockItems: Record<string, MockItem> = {
  'item-minerals': {
    id: 'item-minerals',
    name: 'Minerals',
    type: 'Category',
    buy: 0,
    sell: 0,
    usedInRecipes: ['item-broadsword'],
    groupMembers: ['item-iron'],
  },
  'item-iron': {
    id: 'item-iron',
    name: 'Iron',
    type: 'Mineral',
    buy: 200,
    sell: 20,
    usedInRecipes: [],
  },
  'item-bread': {
    id: 'item-bread',
    name: 'Bread',
    type: 'Food',
    buy: 200,
    sell: 20,
    description: 'Freshly baked bread.',
    category: 'foodAndMedicineStrings',
    region: 'Selphia General Store',
    shippable: true,
    rarityPoints: 4,
    rarityCategory: 'Food',
    monster: 'Buffamoo',
    usedInRecipes: ['item-toast'],
    craft: [
      {
        ingredients: ['item-flour'],
        stationType: 'Cooking',
        level: 5,
      },
    ],
    stats: {
      hp: 10,
      rp: 5,
    },
  },
  'item-flour': {
    id: 'item-flour',
    name: 'Flour',
    image: 'items/bread.png',
    type: 'Ingredient',
    buy: 80,
    sell: 12,
    usedInRecipes: [],
  },
  'item-toast': {
    id: 'item-toast',
    name: 'Toast',
    image: 'items/bread.png',
    type: 'Food',
    buy: 280,
    sell: 42,
    usedInRecipes: [],
  },
  'item-roundoff': {
    id: 'item-roundoff',
    name: 'Roundoff',
    type: 'Potion',
    buy: 800,
    sell: 60,
    description: 'Medicine that dissolves seals.',
    category: 'medicine',
    usedInRecipes: [],
    stats: {
      hp: 300,
    },
    effects: [{ type: 'cure', targets: ['seal'] }],
  },
  'item-fire-resist-charm': {
    id: 'item-fire-resist-charm',
    name: 'Fire Resist Charm',
    type: 'Accessory',
    buy: 1200,
    sell: 300,
    usedInRecipes: [],
    effects: [{ type: 'resistance', target: 'fire', value: 25 }],
  },
  'item-weapon-bread': {
    id: 'item-weapon-bread',
    name: 'Weapon Bread',
    type: 'Bread',
    buy: 0,
    sell: 100,
    usedInRecipes: [],
  },
  'item-weapon-bread-plus': {
    id: 'item-weapon-bread-plus',
    name: 'Weapon Bread+',
    type: 'Bread',
    buy: 999999,
    sell: 3000,
    usedInRecipes: [],
  },
  'item-ambrosias-thorns': {
    id: 'item-ambrosias-thorns',
    name: "Ambrosia's Thorns",
    type: 'Boss Drop',
    buy: 1000,
    sell: 250,
    usedInRecipes: [],
  },
  'item-apple': {
    id: 'item-apple',
    name: 'Apple',
    type: 'Crop',
    buy: 60,
    sell: 30,
    usedInRecipes: [],
  },
  'item-10-fold-steel': {
    id: 'item-10-fold-steel',
    name: '10-Fold Steel',
    type: 'Material',
    buy: 0,
    sell: 1,
    usedInRecipes: [],
  },
  'item-broadsword': {
    id: 'item-broadsword',
    name: 'Broadsword',
    type: 'Forge',
    buy: 90,
    sell: 23,
    usedInRecipes: [],
    craft: [
      {
        ingredients: ['item-minerals'],
        stationType: 'Forging',
        level: 1,
      },
    ],
  },
  'item-battle-broth': {
    id: 'item-battle-broth',
    name: 'Battle Broth',
    type: 'Dish',
    buy: 1200,
    sell: 300,
    usedInRecipes: [],
    stats: {
      hp: 500,
      atk: 10,
    },
    healing: {
      hpPercent: 25,
      rpPercent: 10,
    },
    statMultipliers: {
      str: 15,
      rpMax: 5,
    },
    combat: {
      weaponClass: 'Short Sword',
      attackType: 'Short Sword',
      element: 'Fire',
      damageType: 'Physical',
      geometry: {
        depth: 1.2,
        length: 2.5,
        width: 0.8,
      },
    },
  },
};

const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => {
    return HttpResponse.json(mockItems);
  }),
  http.get('http://localhost:3000/api/details/item/:itemId', ({ params }) => {
    const itemId = params.itemId as string;
    const item = mockItems[itemId];

    if (!item) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      type: 'item',
      item,
      items: mockItems,
    });
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
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders items after successful fetch', async () => {
    render(<ItemsList />, { wrapper });

    await screen.findAllByText('Bread');

    expect(screen.getAllByText('Bread').length).toBeGreaterThan(0);
    expect(screen.getByText('Weapon Bread')).toBeInTheDocument();
    expect(screen.getByText('Weapon Bread+')).toBeInTheDocument();
    expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('10-Fold Steel')).toBeInTheDocument();
    expect(screen.getAllByText('Food').length).toBeGreaterThan(0);
    expect(screen.getByText('Boss Drop')).toBeInTheDocument();
    expect(screen.getAllByText(/Buy:\s*200/).length).toBeGreaterThan(0);
  });

  it('does not render alphabet controls', async () => {
    render(<ItemsList />, { wrapper });

    await screen.findAllByText('Bread');

    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
  });

  it('combines search and drawer type filter', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await screen.findAllByText('Bread');

    await user.type(screen.getByPlaceholderText(/search/i), 'a');
    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    const filterCombobox = within(dialog).getByRole('combobox', { name: 'Type' });
    await user.click(filterCombobox);
    await user.type(filterCombobox, 'Crop');

    const option = await screen.findByRole('option', { name: 'Crop' });
    await user.click(option);
    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText("Ambrosia's Thorns")).not.toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
  });

  it('renders item image on the card when available', async () => {
    render(<ItemsList />, { wrapper });

    const breadImage = await screen.findByRole('img', { name: 'Bread image' });
    expect(breadImage).toHaveAttribute('src');
    expect(await screen.findByRole('img', { name: "Ambrosia's Thorns image" })).toHaveAttribute('src');
  });

  it('supports controlled table mode sorting and server-friendly filter combinations', async () => {
    const { rerender } = render(
      <ItemsList
        items={mockItems}
        viewMode="table"
        sortValue="sell-desc"
      />,
      { wrapper },
    );

    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]!).getAllByRole('cell')[0]).toHaveTextContent('Weapon Bread+');
    expect(within(rows[2]!).getAllByRole('cell')[0]).toHaveTextContent('Fire Resist Charm');

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <ItemsList
          items={mockItems}
          viewMode="table"
          searchTerm="bread"
          filterValues={{
            category: 'foodandmedicinestrings',
            region: 'selphia general store',
            ship: 'yes',
            rarity: 'food',
          }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Bread')).toBeInTheDocument();
    expect(screen.queryByText('Weapon Bread')).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <ItemsList
          items={mockItems}
          viewMode="table"
          filterValues={{
            type: 'bread',
            buyable: 'yes',
            sellable: 'yes',
          }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Weapon Bread+')).toBeInTheDocument();
    expect(screen.queryByText('Weapon Bread')).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <ItemsList
          items={mockItems}
          viewMode="table"
          searchTerm="sword"
          filterValues={{ craft: 'yes' }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Broadsword')).toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <ItemsList
          items={mockItems}
          viewMode="table"
          filterValues={{ effects: 'yes' }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Roundoff')).toBeInTheDocument();
    expect(screen.getByText('Fire Resist Charm')).toBeInTheDocument();
  });

  it('shows the item image and all meaningful details in the sheet', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click((await screen.findAllByText('Bread'))[0]);
    const dialog = await screen.findByRole('dialog');

    expect(await screen.findByText('Freshly baked bread.')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Bread image' })).toBeInTheDocument();
    expect(screen.getAllByText('Food & Medicine Strings').length).toBeGreaterThan(0);
    expect(screen.getByText('Selphia General Store')).toBeInTheDocument();
    expect(screen.getByText('Buffamoo')).toBeInTheDocument();
    expect(screen.getByText('4 RP')).toBeInTheDocument();
    expect(screen.getByText('Crafted From')).toBeInTheDocument();
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.getByText('Lv. 5')).toBeInTheDocument();
    expect(screen.getAllByText('Flour').length).toBeGreaterThan(0);
    expect(within(dialog).getByRole('img', { name: 'Flour image' })).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('RP')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('Additional Effects')).not.toBeInTheDocument();
    expect(screen.getByText('Used In Recipes')).toBeInTheDocument();
    expect(screen.getAllByText('Toast').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Tier/i)).not.toBeInTheDocument();
  });

  it('hides optional detail sections when item data is missing', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText("Ambrosia's Thorns"));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).queryByText('Stats')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Additional Effects')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Crafted From')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Used In Recipes')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Description')).not.toBeInTheDocument();
  });

  it('renders category ingredients in the crafted from section', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Broadsword'));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Crafted From')).toBeInTheDocument();
    expect(within(dialog).getByText('Forging')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Minerals').length).toBeGreaterThan(0);
    expect(within(dialog).getByTestId('crafted-from-grid')).toBeInTheDocument();
    expect(within(dialog).getAllByTestId('crafted-from-slot')).toHaveLength(6);
    expect(within(dialog).getAllByText(/empty slot/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows generic recipe reverse links on category items', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Minerals'));

    expect(await screen.findByText('Used In Recipes')).toBeInTheDocument();
    expect(screen.getAllByText('Broadsword').length).toBeGreaterThan(0);
  });

  it('renders group members for category items', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Minerals'));

    expect(await screen.findByText('Group Members')).toBeInTheDocument();
    expect(screen.getAllByText('Iron').length).toBeGreaterThan(0);
  });

  it('renders non-flat effects alongside normalized stats', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Roundoff'));

    expect(await screen.findByText('Stats')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('Additional Effects')).toBeInTheDocument();
    expect(screen.getByText(/Cures Seal/i)).toBeInTheDocument();
  });

  it('renders effects without a stats section when the item has no stats', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Fire Resist Charm'));

    expect(await screen.findByText('Additional Effects')).toBeInTheDocument();
    expect(screen.getByText(/Fire resistance \+25%/i)).toBeInTheDocument();
    expect(screen.queryByText('Stats')).not.toBeInTheDocument();
  });

  it('renders healing, stat multipliers, and combat details when the item exposes them', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Battle Broth'));

    expect(await screen.findByText('Healing')).toBeInTheDocument();
    expect(screen.getByText('HP%')).toBeInTheDocument();
    expect(screen.getByText('+25%')).toBeInTheDocument();
    expect(screen.getByText('RP%')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();

    expect(screen.getByText('Stat Multipliers')).toBeInTheDocument();
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('RP MAX')).toBeInTheDocument();

    expect(screen.getByText('Combat Profile')).toBeInTheDocument();
    expect(screen.getByText('Weapon Class')).toBeInTheDocument();
    expect(screen.getAllByText('Short Sword').length).toBeGreaterThan(0);
    expect(screen.getByText('Element')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
    expect(screen.getByText(/Length/i)).toBeInTheDocument();
  });

  it('renders the item drawer full width on mobile with a column hero layout', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click((await screen.findAllByText('Bread'))[0]);

    const dialog = await screen.findByRole('dialog', { name: 'Bread' });
    const heroImage = within(dialog).getByAltText('Bread image');
    const hero = heroImage.parentElement;
    const heroTitle = within(dialog).getAllByText('Bread', { selector: 'h2' })[1];

    expect(dialog).toHaveClass('w-full');
    expect(dialog).not.toHaveClass('data-[side=right]:w-3/4');
    expect(hero).toHaveClass('flex-col');
    expect(hero?.className).not.toContain('sm:flex-row');
    expect(heroTitle.closest('div')).toHaveClass('min-w-0');
  });
});
