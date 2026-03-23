import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CrafterView } from './CrafterView';
import type { CrafterData, Item } from '@/lib/schemas';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: ReactNode }) => <a {...props}>{children}</a>,
}));

const items: Record<string, Item> = {
  'item-broadsword': {
    id: 'item-broadsword',
    name: 'Broadsword',
    type: 'Forge',
    category: 'shortSword',
    image: '/images/items/broadsword.png',
    craft: [{ recipeId: 'broadsword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: ['item-iron'] }],
    stats: { atk: 5 },
  },
  'item-claymore': {
    id: 'item-claymore',
    name: 'Claymore',
    type: 'Forge',
    category: 'longSword',
    craft: [{ recipeId: 'claymore#2', stationType: 'Forging', station: 'Long Sword', level: 2, ingredients: ['item-iron'] }],
    stats: { atk: 10 },
  },
  'item-shade-stone': {
    id: 'item-shade-stone',
    name: 'Shade Stone',
    type: 'Material',
    image: '/images/items/shade-stone.png',
    stats: { atk: 1 },
  },
  'item-firewyrm-scale': {
    id: 'item-firewyrm-scale',
    name: 'Firewyrm Scale',
    type: 'Material',
    stats: { str: 10 },
  },
  'item-royal-garter': {
    id: 'item-royal-garter',
    name: 'Royal Garter',
    type: 'Craft',
    category: 'armor',
    craft: [{ recipeId: 'royal-garter#1', stationType: 'Crafting', station: 'Armor', level: 90, ingredients: ['item-iron'] }],
    stats: { def: 100 },
  },
  'item-feathered-hat': {
    id: 'item-feathered-hat',
    name: 'Feathered Hat',
    type: 'Craft',
    category: 'headgear',
    craft: [{ recipeId: 'feathered-hat#1', stationType: 'Crafting', station: 'Headgear', level: 50, ingredients: ['item-iron'] }],
    stats: { def: 20 },
  },
  'item-rune-shield': {
    id: 'item-rune-shield',
    name: 'Rune Shield',
    type: 'Craft',
    category: 'shield',
    craft: [{ recipeId: 'rune-shield#1', stationType: 'Crafting', station: 'Shield', level: 90, ingredients: ['item-iron'] }],
    stats: { def: 80 },
    effects: [{ type: 'resistance', target: 'light', value: 50 }],
  },
  'item-strange-pendant': {
    id: 'item-strange-pendant',
    name: 'Strange Pendant',
    type: 'Craft',
    category: 'accessory',
    craft: [{ recipeId: 'pendant#1', stationType: 'Crafting', station: 'Accessory', level: 80, ingredients: ['item-iron'] }],
    stats: { str: 30 },
  },
  'item-heavy-boots': {
    id: 'item-heavy-boots',
    name: 'Heavy Boots',
    type: 'Craft',
    category: 'shoes',
    craft: [{ recipeId: 'boots#1', stationType: 'Crafting', station: 'Shoes', level: 20, ingredients: ['item-iron'] }],
    stats: { def: 22 },
  },
  'item-glitter-sashimi': {
    id: 'item-glitter-sashimi',
    name: 'Glitter Sashimi',
    type: 'Dish',
    craft: [{ recipeId: 'food#1', stationType: 'Cooking', station: 'Knife', level: 92, ingredients: ['item-iron'] }],
    stats: { hp: 1000 },
  },
  'item-iron': {
    id: 'item-iron',
    name: 'Iron',
    type: 'Mineral',
  },
};

const crafterData: CrafterData = {
  slotConfigs: [
    { key: 'weapon', label: 'Weapon', stationType: 'Forging', stations: ['Short Sword', 'Long Sword'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'armor', label: 'Armor', stationType: 'Crafting', stations: ['Armor'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'headgear', label: 'Headgear', stationType: 'Crafting', stations: ['Headgear'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'shield', label: 'Shield', stationType: 'Crafting', stations: ['Shield'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'accessory', label: 'Accessory', stationType: 'Crafting', stations: ['Accessory'], supportsAppearance: false, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'shoes', label: 'Shoes', stationType: 'Crafting', stations: ['Shoes'], supportsAppearance: false, inheritSlots: 3, upgradeSlots: 9 },
  ],
  defaults: {
    weapon: {
      appearanceId: 'item-broadsword',
      baseId: 'item-broadsword',
      inherits: [{ itemId: 'item-shade-stone', level: 10 }, { level: 10 }, { level: 10 }],
      upgrades: [{ itemId: 'item-firewyrm-scale', level: 10 }, { level: 10 }, { level: 10 }],
    },
    armor: { appearanceId: 'item-royal-garter', baseId: 'item-royal-garter', inherits: [{ level: 10 }, { level: 10 }, { level: 10 }], upgrades: [{ level: 10 }, { level: 10 }, { level: 10 }] },
    headgear: { appearanceId: 'item-feathered-hat', baseId: 'item-feathered-hat', inherits: [{ level: 10 }, { level: 10 }, { level: 10 }], upgrades: [{ level: 10 }, { level: 10 }, { level: 10 }] },
    shield: { appearanceId: 'item-rune-shield', baseId: 'item-rune-shield', inherits: [{ level: 10 }, { level: 10 }, { level: 10 }], upgrades: [{ level: 10 }, { level: 10 }, { level: 10 }] },
    accessory: { baseId: 'item-strange-pendant', inherits: [{ level: 10 }, { level: 10 }, { level: 10 }], upgrades: [{ level: 10 }, { level: 10 }, { level: 10 }] },
    shoes: { baseId: 'item-heavy-boots', inherits: [{ level: 10 }, { level: 10 }, { level: 10 }], upgrades: [{ level: 10 }, { level: 10 }, { level: 10 }] },
    food: { baseId: 'item-glitter-sashimi', ingredients: [{ level: 10 }, { level: 10 }, { level: 10 }, { level: 10 }, { level: 10 }, { level: 10 }] },
  },
  specialMaterialRules: [],
  weaponClassByStation: { 'Short Sword': 'Short Sword', 'Long Sword': 'Long Sword' },
  shieldCoverageByWeaponClass: { 'Short Sword': 'full', 'Long Sword': 'partial' },
  chargeAttackByWeaponClass: { 'Short Sword': 'Rush Slash', 'Long Sword': 'Cyclone' },
  staffChargeByCrystalId: {},
  levelBonusTiers: [],
  rarityBonusTiers: [],
  foodOverrides: {},
};

describe('CrafterView', () => {
  it('renders grouped grids with fixed recipe and upgrade slots plus item icons', () => {
    render(
      <CrafterView
        items={items}
        crafterData={crafterData}
        viewMode="simple"
        onSerializedBuildChange={vi.fn()}
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: /weapon/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /food/i })).toBeInTheDocument();
    expect(screen.getByText(/base & appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/^recipe$/i)).toBeInTheDocument();
    expect(screen.getByText(/^inherit$/i)).toBeInTheDocument();
    expect(screen.getByText(/^upgrades$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade 9/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Broadsword' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img', { name: 'Shade Stone' }).length).toBeGreaterThan(0);
  });

  it('opens a bottom drawer with a combobox when clicking a grid card and updates serialized build', async () => {
    const user = userEvent.setup();
    const onSerializedBuildChange = vi.fn();

    render(
      <CrafterView
        items={items}
        crafterData={crafterData}
        viewMode="simple"
        onSerializedBuildChange={onSerializedBuildChange}
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /appearance/i }));
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText(/edit slot: appearance/i)).toBeInTheDocument();

    await user.click(within(drawer).getByRole('combobox', { name: /appearance item/i }));
    await user.clear(within(drawer).getByRole('combobox', { name: /appearance item/i }));
    await user.type(within(drawer).getByRole('combobox', { name: /appearance item/i }), 'Clay');
    await user.click(await within(drawer).findByRole('option', { name: 'Claymore' }));

    expect(onSerializedBuildChange).toHaveBeenCalled();
    expect(onSerializedBuildChange.mock.lastCall?.[0]).toContain('item-claymore');
  });

  it('switches tabs and renders empty placeholders for unfilled cards', async () => {
    const user = userEvent.setup();

    render(
      <CrafterView
        items={items}
        crafterData={crafterData}
        viewMode="advanced"
        onSerializedBuildChange={vi.fn()}
        onViewModeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /food/i }));

    expect(screen.getByText(/food grid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingredient 6/i })).toBeInTheDocument();
    expect(screen.getAllByText(/empty/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/advanced breakdown/i).length).toBeGreaterThan(0);
  });
});
