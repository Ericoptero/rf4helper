import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { buildItemRecipeTooltipLookup } from '@/lib/itemRecipeTooltip';
import type { Item } from '@/lib/schemas';
import { ItemsList } from './ItemsList';

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

const mockItemList = Object.values(mockItems);

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
      dropSources: [],
      cropRelations: [],
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('ItemsList Component', () => {
  it('renders items immediately from server-provided props', async () => {
    render(<ItemsList items={mockItemList} />);

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
    render(<ItemsList items={mockItemList} />);

    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '#' })).not.toBeInTheDocument();
  });

  it('shows the compact 3x2 recipe preview when hovering item cells in table view', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(screen.getByRole('button', { name: 'Table' }));
    await user.hover(within(screen.getByRole('table')).getByText('Broadsword'));

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Broadsword')).toBeInTheDocument();
    expect(within(tooltip).getByText(/Forging · Lv\. 1/i)).toBeInTheDocument();
    expect(within(tooltip).getByTestId('recipe-preview-grid')).toBeInTheDocument();
    expect(within(tooltip).getByText('Minerals')).toBeInTheDocument();
  });

  it('uses the global tooltip lookup so filtered table rows still show ingredient images', async () => {
    const user = userEvent.setup();

    render(
      <ItemsList
        items={[mockItems['item-bread']]}
        tooltipItems={buildItemRecipeTooltipLookup(mockItems)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Table' }));
    await user.hover(within(screen.getByRole('table')).getByText('Bread'));

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Bread')).toBeInTheDocument();
    expect(within(tooltip).getByRole('img', { name: 'Flour image' })).toBeInTheDocument();
  });

  it('shows the crafting level column in table view and lets the header reorder results', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(screen.getByRole('button', { name: 'Table' }));

    const table = screen.getByRole('table');
    expect(within(table).getByRole('button', { name: /^Level$/i })).toBeInTheDocument();
    const breadRow = within(table).getAllByText('Bread')[0]?.closest('tr');
    const broadswordRow = within(table).getAllByText('Broadsword')[0]?.closest('tr');
    expect(within(breadRow as HTMLElement).getByText('5')).toBeInTheDocument();
    expect(within(broadswordRow as HTMLElement).getByText('1')).toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: /^Level$/i }));

    expect(screen.getByText(/sorted by Level \(descending\)/i)).toBeInTheDocument();
  });



  it('shows the item image and all meaningful details in the sheet', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click((await screen.findAllByText('Bread'))[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Bread' });

    expect(within(dialog).getByText('Freshly baked bread.')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Bread image' })).toBeInTheDocument();
    expect(within(dialog).getAllByText('Food & Medicine Strings').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('Selphia General Store')).toBeInTheDocument();
    expect(within(dialog).getByText('Buffamoo')).toBeInTheDocument();
    expect(within(dialog).getByText('4 RP')).toBeInTheDocument();
    expect(within(dialog).getByText('Crafted From')).toBeInTheDocument();
    expect(within(dialog).getByText('Cooking')).toBeInTheDocument();
    expect(within(dialog).getByText('Lv. 5')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Flour').length).toBeGreaterThan(0);
    expect(within(dialog).getByRole('img', { name: 'Flour image' })).toBeInTheDocument();

    expect(within(dialog).getByText('HP')).toBeInTheDocument();
    expect(within(dialog).getByText('10')).toBeInTheDocument();
    expect(within(dialog).getByText('RP')).toBeInTheDocument();
    expect(within(dialog).getByText('5')).toBeInTheDocument();
    expect(within(dialog).queryByText('Additional Effects')).not.toBeInTheDocument();

    expect(within(dialog).getAllByText('Toast').length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/Tier/i)).not.toBeInTheDocument();
  });

  it('hides optional detail sections when item data is missing', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

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

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Broadsword'));
    const dialog = await screen.findByRole('dialog', { name: 'Broadsword' });

    expect(within(dialog).getByText('Crafted From')).toBeInTheDocument();
    expect(within(dialog).getByText('Forging')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Minerals').length).toBeGreaterThan(0);
    expect(within(dialog).getByTestId('crafted-from-grid')).toBeInTheDocument();
    expect(within(dialog).getAllByTestId('crafted-from-slot')).toHaveLength(6);
    expect(within(dialog).getAllByText(/empty slot/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows generic recipe reverse links on category items', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Minerals'));
    const dialog = await screen.findByRole('dialog', { name: 'Minerals' });

    expect(within(dialog).getAllByText('Broadsword').length).toBeGreaterThan(0);
  });

  it('renders group members for category items', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Minerals'));
    const dialog = await screen.findByRole('dialog', { name: 'Minerals' });

    expect(within(dialog).getAllByText('Iron').length).toBeGreaterThan(0);
  });

  it('renders non-flat effects alongside normalized stats', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Roundoff'));
    const dialog = await screen.findByRole('dialog', { name: 'Roundoff' });

    expect(within(dialog).getByText('HP')).toBeInTheDocument();
    expect(within(dialog).getByText('300')).toBeInTheDocument();
    expect(within(dialog).getByText(/Cures Seal/i)).toBeInTheDocument();
  });

  it('renders effects without a stats section when the item has no stats', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Fire Resist Charm'));
    const dialog = await screen.findByRole('dialog', { name: 'Fire Resist Charm' });

    expect(within(dialog).getByText(/Fire resistance \+25%/i)).toBeInTheDocument();
    expect(within(dialog).queryByText('Stats')).not.toBeInTheDocument();
  });

  it('renders healing, stat multipliers, and combat details when the item exposes them', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

    await user.click(await screen.findByText('Battle Broth'));
    const dialog = await screen.findByRole('dialog', { name: 'Battle Broth' });

    expect(within(dialog).getByText('HP%')).toBeInTheDocument();
    expect(within(dialog).getByText('+25%')).toBeInTheDocument();
    expect(within(dialog).getByText('RP%')).toBeInTheDocument();
    expect(within(dialog).getByText('+10%')).toBeInTheDocument();
    expect(within(dialog).getByText('STR')).toBeInTheDocument();
    expect(within(dialog).getByText('RP MAX')).toBeInTheDocument();
    expect(within(dialog).getByText('Weapon Class')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Short Sword').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('Element')).toBeInTheDocument();
    expect(within(dialog).getByText('Fire')).toBeInTheDocument();
    expect(within(dialog).getByText('Geometry')).toBeInTheDocument();
    expect(within(dialog).getByText(/Length/i)).toBeInTheDocument();
  });

  it('renders the item drawer full width on mobile with a column hero layout', async () => {
    const user = userEvent.setup();

    render(<ItemsList items={mockItemList} />);

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
