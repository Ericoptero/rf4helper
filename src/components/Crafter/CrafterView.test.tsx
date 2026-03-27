import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { CrafterView } from './CrafterView';
import type { CrafterData, CrafterSlotConfig, Item } from '@/lib/schemas';

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
    rarityPoints: 15,
    craft: [{ recipeId: 'broadsword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: ['item-iron'] }],
    stats: { atk: 5 },
  },
  'item-claymore': {
    id: 'item-claymore',
    name: 'Claymore',
    type: 'Forge',
    category: 'longSword',
    image: '/images/items/claymore.png',
    rarityPoints: 11,
    craft: [{ recipeId: 'claymore#2', stationType: 'Forging', station: 'Long Sword', level: 2, ingredients: ['item-iron'] }],
    stats: { atk: 10 },
  },
  'item-cutlass': {
    id: 'item-cutlass',
    name: 'Cutlass',
    type: 'Forge',
    category: 'shortSword',
    image: '/images/items/cutlass.png',
    rarityPoints: 8,
    craft: [{ recipeId: 'cutlass#3', stationType: 'Forging', station: 'Short Sword', level: 6, ingredients: ['item-iron'] }],
    stats: { atk: 8 },
  },
  'item-heaven-asunder': {
    id: 'item-heaven-asunder',
    name: 'Heaven Asunder',
    type: 'Forge',
    category: 'longSword',
    image: '/images/items/heaven-asunder.png',
    rarityPoints: 66,
    craft: [{ recipeId: 'heaven-asunder#92', stationType: 'Forging', station: 'Long Sword', level: 92, ingredients: ['item-silver', 'item-iron'] }],
    stats: { atk: 12000, matk: 9000, diz: 12, crit: 10 },
    effects: [{ type: 'inflict', target: 'faint', trigger: 'attack', chance: 50 }],
  },
  'item-shade-stone': {
    id: 'item-shade-stone',
    name: 'Shade Stone',
    type: 'Material',
    image: '/images/items/shade-stone.png',
    rarityPoints: 3,
    stats: { atk: 1 },
  },
  'item-firewyrm-scale': {
    id: 'item-firewyrm-scale',
    name: 'Firewyrm Scale',
    type: 'Material',
    image: '/images/items/firewyrm-scale.png',
    rarityPoints: 9,
    stats: { str: 10 },
  },
  'item-royal-garter': {
    id: 'item-royal-garter',
    name: 'Royal Garter',
    type: 'Craft',
    category: 'armor',
    image: '/images/items/royal-garter.png',
    craft: [{ recipeId: 'royal-garter#1', stationType: 'Crafting', station: 'Armor', level: 90, ingredients: ['item-iron'] }],
    stats: { def: 100 },
  },
  'item-feathered-hat': {
    id: 'item-feathered-hat',
    name: 'Feathered Hat',
    type: 'Craft',
    category: 'headgear',
    image: '/images/items/feathered-hat.png',
    craft: [{ recipeId: 'feathered-hat#1', stationType: 'Crafting', station: 'Headgear', level: 50, ingredients: ['item-iron'] }],
    stats: { def: 20 },
  },
  'item-rune-shield': {
    id: 'item-rune-shield',
    name: 'Rune Shield',
    type: 'Craft',
    category: 'shield',
    image: '/images/items/rune-shield.png',
    craft: [{ recipeId: 'rune-shield#1', stationType: 'Crafting', station: 'Shield', level: 90, ingredients: ['item-iron'] }],
    stats: { def: 80 },
    effects: [{ type: 'resistance', target: 'light', value: 50 }],
  },
  'item-strange-pendant': {
    id: 'item-strange-pendant',
    name: 'Strange Pendant',
    type: 'Craft',
    category: 'accessory',
    image: '/images/items/strange-pendant.png',
    craft: [{ recipeId: 'pendant#1', stationType: 'Crafting', station: 'Accessory', level: 80, ingredients: ['item-iron'] }],
    stats: { str: 30 },
  },
  'item-heavy-boots': {
    id: 'item-heavy-boots',
    name: 'Heavy Boots',
    type: 'Craft',
    category: 'shoes',
    image: '/images/items/heavy-boots.png',
    craft: [{ recipeId: 'boots#1', stationType: 'Crafting', station: 'Shoes', level: 20, ingredients: ['item-iron'] }],
    stats: { def: 22 },
  },
  'item-glitter-sashimi': {
    id: 'item-glitter-sashimi',
    name: 'Glitter Sashimi',
    type: 'Dish',
    image: '/images/items/glitter-sashimi.png',
    craft: [{ recipeId: 'food#1', stationType: 'Cooking', station: 'Knife', level: 92, ingredients: ['item-iron'] }],
    stats: { hp: 1000 },
  },
  'item-iron': {
    id: 'item-iron',
    name: 'Iron',
    type: 'Mineral',
    image: '/images/items/iron.png',
    rarityPoints: 1,
    stats: {},
  },
  'item-silver': {
    id: 'item-silver',
    name: 'Silver',
    type: 'Mineral',
    image: '/images/items/silver.png',
    rarityPoints: 2,
    stats: {},
  },
  'item-light-ore': {
    id: 'item-light-ore',
    name: 'Light Ore',
    type: 'Material',
    image: '/images/items/light-ore.png',
    rarityPoints: 13,
    stats: {},
  },
  'item-turnip-heaven': {
    id: 'item-turnip-heaven',
    name: 'Turnip Heaven',
    type: 'Dish',
    image: '/images/items/turnip-heaven.png',
    craft: [{ recipeId: 'turnip-heaven#96', stationType: 'Cooking', station: 'No Tool', level: 96, ingredients: ['item-turnip'] }],
    stats: { hp: 5000, rp: 1000, str: 90, vit: 80, int: 50 },
  },
};

function slotConfig(
  key: CrafterSlotConfig['key'],
  label: string,
  stationType: CrafterSlotConfig['stationType'],
  stations: string[],
  options: Partial<CrafterSlotConfig> = {},
): CrafterSlotConfig {
  return {
    key,
    label,
    stationType,
    stations,
    supportsAppearance: false,
    supportsBaseSelection: true,
    recipeSlots: 6,
    inheritSlots: 3,
    upgradeSlots: 9,
    carrierId: options.carrierId ?? null,
    levelBonusTargets: key === 'weapon' ? ['atk', 'matk'] : ['def', 'mdef'],
    rarityBonusTarget: key === 'weapon' ? 'weapon' : key === 'headgear' || key === 'accessory' ? 'mdef' : 'def',
    ...options,
  };
}

function equipmentPayload(
  overrides: Partial<CrafterData['stats']['weapon'][string]> = {},
): CrafterData['stats']['weapon'][string] {
  return {
    itemName: overrides.itemName,
    weaponClass: overrides.weaponClass,
    stats: overrides.stats ?? {},
    resistances: overrides.resistances ?? {},
    statusAttacks: overrides.statusAttacks ?? {},
    geometry: overrides.geometry ?? {},
    attackType: overrides.attackType,
    element: overrides.element,
    damageType: overrides.damageType,
    rarity: overrides.rarity ?? 0,
    bonusType: overrides.bonusType,
    bonusType2: overrides.bonusType2,
  };
}

function foodPayload(
  overrides: Partial<CrafterData['food']['baseStats'][string]> = {},
): CrafterData['food']['baseStats'][string] {
  return {
    itemName: overrides.itemName,
    additive: overrides.additive ?? {},
    multipliers: overrides.multipliers ?? {},
    resistances: overrides.resistances ?? {},
    statusAttacks: overrides.statusAttacks ?? {},
    status: overrides.status,
    lightRes: overrides.lightRes,
  };
}

const crafterData: CrafterData = {
  schemaVersion: 1,
  slotConfigs: [
    slotConfig('weapon', 'Weapon', 'Forging', ['Short Sword', 'Long Sword']),
    slotConfig('armor', 'Armor', 'Crafting', ['Armor'], { carrierId: 'item-iron' }),
    slotConfig('headgear', 'Headgear', 'Crafting', ['Headgear'], { carrierId: 'item-iron' }),
    slotConfig('shield', 'Shield', 'Crafting', ['Shield'], { carrierId: 'item-iron' }),
    slotConfig('accessory', 'Accessory', 'Crafting', ['Accessory'], { carrierId: 'item-iron' }),
    slotConfig('shoes', 'Shoes', 'Crafting', ['Shoes'], { carrierId: 'item-iron' }),
  ],
  defaults: {
    weapon: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    armor: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    headgear: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    shield: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    accessory: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    shoes: { appearanceId: undefined, baseId: undefined, recipe: [], inherits: [], upgrades: [] },
    food: { baseId: undefined, recipe: [] },
  },
  specialMaterialRules: [{ itemId: 'item-light-ore', behavior: 'lightOre' }],
  weaponClassByStation: { 'Short Sword': 'Short Sword', 'Long Sword': 'Long Sword' },
  shieldCoverageByWeaponClass: { 'Short Sword': 'full', 'Long Sword': 'partial' },
  starterWeaponByClass: { 'Short Sword': 'item-broadsword', 'Long Sword': 'item-claymore' },
  chargeAttackByWeaponClass: { 'Short Sword': 'Rush Slash', 'Long Sword': 'Cyclone' },
  staffChargeByCrystalId: {},
  levelBonusTiers: [
    { threshold: 0, tier: 0, label: '', stats: {} },
    { threshold: 30, tier: 1, label: 'Good quality', stats: { atk: 10, matk: 5, def: 6, mdef: 5 } },
    { threshold: 60, tier: 2, label: 'Great quality', stats: { atk: 25, matk: 10, def: 15, mdef: 12 } },
  ],
  rarityBonusTiers: [
    { threshold: 0, tier: 0, label: '', stats: {} },
    { threshold: 25, tier: 1, label: 'Unusual materials', stats: { atk: 10, matk: 5, def: 3, mdef: 3 } },
    { threshold: 50, tier: 2, label: 'Rare materials', stats: { atk: 40, matk: 15, def: 10, mdef: 10 } },
  ],
  foodOverrides: {},
  recipes: {
    equipment: {
      weapon: {
        'item-broadsword': {
          itemName: 'Broadsword',
          station: 'Short Sword',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
        'item-claymore': {
          itemName: 'Claymore',
          station: 'Long Sword',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
        'item-cutlass': {
          itemName: 'Cutlass',
          station: 'Short Sword',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
        'item-heaven-asunder': {
          itemName: 'Heaven Asunder',
          station: 'Long Sword',
          materials: ['item-silver', 'item-iron', null, null, null, null],
          materialNames: ['Silver', 'Iron', null, null, null, null],
          rarity: 66,
        },
      },
      armor: {
        'item-royal-garter': {
          itemName: 'Royal Garter',
          station: 'Armor',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
      },
      headgear: {
        'item-feathered-hat': {
          itemName: 'Feathered Hat',
          station: 'Headgear',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
      },
      shield: {
        'item-rune-shield': {
          itemName: 'Rune Shield',
          station: 'Shield',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
      },
      accessory: {
        'item-strange-pendant': {
          itemName: 'Strange Pendant',
          station: 'Accessory',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
      },
      shoes: {
        'item-heavy-boots': {
          itemName: 'Heavy Boots',
          station: 'Shoes',
          materials: ['item-iron', null, null, null, null, null],
          materialNames: ['Iron', null, null, null, null, null],
          rarity: 1,
        },
      },
    },
    food: {
      'item-glitter-sashimi': {
        itemName: 'Glitter Sashimi',
        station: 'Knife',
        materials: ['item-iron', null, null, null, null, null],
        materialNames: ['Iron', null, null, null, null, null],
        rarity: 1,
      },
    },
  },
  stats: {
    weapon: {
      'item-broadsword': equipmentPayload({
        itemName: 'Broadsword',
        stats: { atk: 5, matk: 2, def: 1, mdef: 1, str: 3, int: 2, vit: 1, diz: 4, crit: 5, knock: 2, stun: 1 },
        resistances: { fire: 0.1, water: 0.05, psn: 0.25, seal: 0.1, fnt: 0.05, drain: 0.15, crit: 0.1, knock: 0.2 },
        statusAttacks: { psn: 0.3, seal: 0.2, par: 0.1 },
        geometry: { depth: 2, length: 1, width: 1 },
        weaponClass: 'Short Sword',
      }),
      'item-claymore': equipmentPayload({
        itemName: 'Claymore',
        stats: { atk: 10 },
        geometry: { depth: 3, length: 2, width: 1 },
        weaponClass: 'Long Sword',
      }),
      'item-cutlass': equipmentPayload({
        itemName: 'Cutlass',
        stats: { atk: 8, def: 1 },
        geometry: { depth: 2.2, length: 1.1, width: 1 },
        weaponClass: 'Short Sword',
        attackType: 'Short Sword',
        damageType: 'Physical',
        element: 'None',
        rarity: 8,
      }),
      'item-heaven-asunder': equipmentPayload({
        itemName: 'Heaven Asunder',
        stats: { atk: 12000, matk: 9000, diz: 12, crit: 0.1 },
        resistances: { fire: 0.333, knock: 0.125, psn: 0.5 },
        statusAttacks: { faint: 0.5 },
        geometry: { depth: 1.2, length: 1.6, width: 1.1 },
        weaponClass: 'Long Sword',
        attackType: 'Long Sword',
        damageType: 'Physical',
        element: 'Wind',
        rarity: 66,
      }),
    },
    armor: {
      'item-royal-garter': equipmentPayload({ itemName: 'Royal Garter', stats: { def: 100 } }),
      'item-feathered-hat': equipmentPayload({ itemName: 'Feathered Hat', stats: { def: 20 } }),
      'item-rune-shield': equipmentPayload({ itemName: 'Rune Shield', stats: { def: 80 }, resistances: { light: 0.5 } }),
      'item-strange-pendant': equipmentPayload({ itemName: 'Strange Pendant', stats: { str: 30 } }),
      'item-heavy-boots': equipmentPayload({ itemName: 'Heavy Boots', stats: { def: 22 } }),
    },
  },
  materials: {
    weapon: {
      'item-iron': equipmentPayload({ itemName: 'Iron', rarity: 1 }),
      'item-silver': equipmentPayload({ itemName: 'Silver', rarity: 2 }),
      'item-light-ore': equipmentPayload({ itemName: 'Light Ore', rarity: 13 }),
      'item-turnip-heaven': equipmentPayload({ itemName: 'Turnip Heaven', rarity: 0 }),
      'item-shade-stone': equipmentPayload({ itemName: 'Shade Stone', stats: { atk: 1 }, rarity: 3 }),
      'item-firewyrm-scale': equipmentPayload({
        itemName: 'Firewyrm Scale',
        stats: { str: 10 },
        statusAttacks: { sick: 0.1 },
        rarity: 9,
      }),
    },
    armor: {
      'item-iron': equipmentPayload({ itemName: 'Iron', rarity: 1 }),
      'item-silver': equipmentPayload({ itemName: 'Silver', rarity: 2 }),
      'item-shade-stone': equipmentPayload({ itemName: 'Shade Stone', stats: { atk: 1 }, rarity: 3 }),
      'item-firewyrm-scale': equipmentPayload({
        itemName: 'Firewyrm Scale',
        stats: { str: 10 },
        statusAttacks: { sick: 0.1 },
        rarity: 9,
      }),
    },
    food: {
      'item-iron': foodPayload({
        additive: { hp: 100, rp: 25, str: 10 },
        multipliers: { hp: 0.1, rp: 0.05 },
        resistances: { fire: 0.2 },
        statusAttacks: { psn: 0.3 },
      }),
      'item-silver': foodPayload({
        additive: { hp: 50, rp: 10, vit: 5 },
        multipliers: { hp: 0.05, rp: 0.1 },
        resistances: { light: 0.15 },
        statusAttacks: { seal: 0.2 },
      }),
    },
  },
  food: {
    baseStats: {
      'item-glitter-sashimi': foodPayload({
        additive: { hp: 1000, rp: 200, str: 40 },
        multipliers: { hp: 0.5, rp: 0.25, str: 0.2 },
        resistances: { water: 0.1 },
        statusAttacks: { faint: 0.25 },
      }),
    },
  },
  bonusEffects: {},
  staff: { chargeAttacks: {}, bases: {} },
  fixtures: {},
};

function CrafterHarness({
  onSerializedBuildChange = vi.fn(),
}: {
  onSerializedBuildChange?: (value: string) => void;
}) {
  const [serializedBuild, setSerializedBuild] = useState<string>();

  return (
    <CrafterView
      items={items}
      crafterData={crafterData}
      serializedBuild={serializedBuild}
      onSerializedBuildChange={(value) => {
        setSerializedBuild(value);
        onSerializedBuildChange(value);
      }}
    />
  );
}

async function chooseItemFromSelector(user: ReturnType<typeof userEvent.setup>, query: string, itemName: string) {
  const dialog = await screen.findByRole('dialog');
  const search = within(dialog).getByRole('searchbox', { name: /search items/i });
  await user.clear(search);
  await user.type(search, query);
  await user.click(within(dialog).getByRole('button', { name: new RegExp(itemName, 'i') }));
  await user.click(within(dialog).getByRole('button', { name: /apply/i }));
}

describe('CrafterView', () => {
  it('renders the crafter header with the simplified tab set and dashboard final build summary', () => {
    render(<CrafterHarness />);

    expect(screen.getByRole('button', { name: /reset build/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: /weapon/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /armor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /headgear/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /shield/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /accessory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /shoes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cooking/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /breakdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /final build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /readme/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /final build/i })).toBeInTheDocument();
    expect(screen.getByText(/complete build summary driven by the current crafter state/i)).toBeInTheDocument();
    expect(screen.getByText(/psn: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/seal: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/par: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/slp: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/ftg: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/sick: \+49%/i)).toBeInTheDocument();
    expect(screen.getByText(/faint: \+49%/i)).toBeInTheDocument();
  });

  it('renders compact slot groups, keeps the top slot labeled Base, and shows grouped stats', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));

    expect(screen.getByRole('button', { name: /base/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /appearance/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/recipe slots/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/inherit slots/i)).toBeInTheDocument();
    expect(screen.getByText(/upgrade slots/i)).toBeInTheDocument();
    expect(screen.getByText(/^resume$/i)).toBeInTheDocument();
    expect(screen.queryByText(/craft notes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/how to make/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe 6/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upgrade 9/i })).toBeInTheDocument();
    expect(screen.getByText('0/6')).toBeInTheDocument();
    expect(screen.getByText('0/9')).toBeInTheDocument();

    const emptyBaseSlot = screen.getByRole('button', { name: /base/i });
    expect(emptyBaseSlot.className).toContain('border-dashed');
    expect(emptyBaseSlot.className).toContain('h-24');
    expect(emptyBaseSlot.className).toContain('w-24');
    expect(emptyBaseSlot.parentElement?.className).toContain('mt-1');
    expect(screen.getByRole('button', { name: /recipe 6/i }).className).toContain('h-24');
    expect(screen.getByRole('button', { name: /recipe 6/i }).className).toContain('w-24');
    expect(screen.getByRole('button', { name: /upgrade 9/i }).className).toContain('h-24');
    expect(screen.getByRole('button', { name: /upgrade 9/i }).className).toContain('w-24');

    await user.click(emptyBaseSlot);
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    const filledBaseSlot = screen.getByRole('button', { name: /broadsword/i });
    expect(filledBaseSlot.className).toContain('border-solid');
    expect(screen.getAllByAltText(/broadsword icon/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^stats$/i)).toBeInTheDocument();
    expect(screen.getByText(/status attack/i)).toBeInTheDocument();
    expect(screen.getByText(/^others$/i)).toBeInTheDocument();
    expect(screen.getByText(/elem res/i)).toBeInTheDocument();
    expect(screen.getByText(/reaction res/i)).toBeInTheDocument();
    expect(screen.getByText(/status res/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bonus effects/i).length).toBeGreaterThan(0);
  });

  it('keeps long selector previews usable, rounds percentages visually, and hides default recipe items from Resume', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Heav');
    await user.click(within(dialog).getByRole('button', { name: /heaven asunder/i }));

    expect(within(dialog).getByRole('button', { name: /apply/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/crit \+10%/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/faint 50%/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/fire 33\.3%/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/knock 12\.5%/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/psn 50%/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /apply/i }));

    const critRow = screen.getByText(/^crit$/i).closest('div');
    expect(critRow).toBeTruthy();
    expect(within(critRow as HTMLElement).getByText(/\+10%/i)).toBeInTheDocument();

    const slotButton = screen.getByRole('button', { name: /heaven asunder/i });
    await user.hover(slotButton);
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText(/crit \+10%/i)).toBeInTheDocument();
    await user.unhover(slotButton);

    const resumeCard = screen.getByText(/^resume$/i).closest('[data-slot="card"]');
    expect(resumeCard).toBeInstanceOf(HTMLElement);
    const resumeCardElement = resumeCard as HTMLElement;
    expect(within(resumeCardElement).getByText(/no recipe data/i)).toBeInTheDocument();
    expect(within(resumeCardElement).getByText(/actual base/i)).toBeInTheDocument();
    expect(within(resumeCardElement).queryByText(/^silver$/i)).not.toBeInTheDocument();
    expect(within(resumeCardElement).queryByText(/^iron$/i)).not.toBeInTheDocument();
  });

  it('rounds final stats to integers while keeping geometry precision in the final stats panel', async () => {
    const customCrafterData = structuredClone(crafterData);
    customCrafterData.stats.weapon['item-broadsword'] = equipmentPayload({
      itemName: 'Broadsword',
      weaponClass: 'Short Sword',
      stats: { atk: 1234.6, crit: 0.104, knock: 0.126, stun: 0.994 },
      resistances: { fire: 0.126, water: 0.874, psn: 0.104 },
      statusAttacks: { psn: 0.126 },
      geometry: { depth: 1.6499, length: 2.3499, width: 0.6499 },
    });

    function CustomHarness() {
      const [serializedBuild, setSerializedBuild] = useState<string>();

      return (
        <CrafterView
          items={items}
          crafterData={customCrafterData}
          serializedBuild={serializedBuild}
          onSerializedBuildChange={setSerializedBuild}
        />
      );
    }

    const user = userEvent.setup();
    render(<CustomHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getByText(/\+1,235$/i)).toBeInTheDocument();
    expect(screen.getByText(/^crit$/i).closest('div')).toHaveTextContent('+10%');
    expect(screen.getByText(/^knock$/i).closest('div')).toHaveTextContent('+13%');
    expect(screen.getByText(/^stun$/i).closest('div')).toHaveTextContent('+99%');
    expect(screen.getByText(/fire: \+13%/i)).toBeInTheDocument();
    expect(screen.getByText(/water: \+87%/i)).toBeInTheDocument();
    expect(screen.getByText(/psn: \+10%/i)).toBeInTheDocument();
    expect(screen.getByText(/^psn 13%$/i)).toBeInTheDocument();
    expect(screen.getByText(/depth \+1\.65/i)).toBeInTheDocument();
    expect(screen.getByText(/length \+2\.35/i)).toBeInTheDocument();
    expect(screen.getByText(/width \+0\.65/i)).toBeInTheDocument();
    expect(screen.queryByText(/\+1,234\.6$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/10\.4%/i)).not.toBeInTheDocument();
  });

  it('applies selector choices with Enter, keeps sort above search, and persists appearance ids, derived base ids, and slider levels', async () => {
    const user = userEvent.setup();
    const onSerializedBuildChange = vi.fn();

    render(<CrafterHarness onSerializedBuildChange={onSerializedBuildChange} />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const sortControl = within(dialog).getByRole('combobox', { name: /sort items/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    expect(Boolean(sortControl.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    await user.clear(search);
    await user.type(search, 'Broad');
    await user.click(within(dialog).getByRole('button', { name: /broadsword/i }));
    await user.keyboard('{Enter}');

    expect(screen.getAllByText(/broadsword/i).length).toBeGreaterThan(0);
    expect(onSerializedBuildChange).toHaveBeenCalled();
    expect(onSerializedBuildChange.mock.lastCall?.[0]).toContain('"appearanceId":"item-broadsword"');
    expect(onSerializedBuildChange.mock.lastCall?.[0]).not.toContain('"baseId":"item-broadsword"');

    await user.click(screen.getByRole('button', { name: /iron/i }));
    const recipeDialog = await screen.findByRole('dialog', { name: /select recipe 1/i });
    const levelSlider = within(recipeDialog).getByRole('slider', { name: /item level/i });
    expect(levelSlider).toHaveAttribute('aria-valuenow', '10');

    levelSlider.focus();
    fireEvent.keyDown(levelSlider, { key: 'ArrowLeft' });
    fireEvent.keyDown(levelSlider, { key: 'ArrowLeft' });
    expect(levelSlider).toHaveAttribute('aria-valuenow', '8');
    await user.click(within(dialog).getByRole('button', { name: /apply/i }));

    await user.click(screen.getByRole('button', { name: /iron/i }));
    const reopenedDialog = await screen.findByRole('dialog', { name: /select recipe 1/i });
    expect(within(reopenedDialog).getByRole('slider', { name: /item level/i })).toHaveAttribute('aria-valuenow', '8');
  });

  it('derives Actual Base from the single recipe craft item and clears the previous one when a new craft item is selected', async () => {
    const user = userEvent.setup();
    const onSerializedBuildChange = vi.fn();

    render(<CrafterHarness onSerializedBuildChange={onSerializedBuildChange} />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 2/i }));
    await chooseItemFromSelector(user, 'Cut', 'Cutlass');

    const resumeCard = screen.getByText(/^resume$/i).closest('[data-slot="card"]') as HTMLElement;
    const baseHeading = within(resumeCard).getByText(/^base$/i);
    const actualBaseHeading = within(resumeCard).getByText(/^actual base$/i);
    const recipeHeading = within(resumeCard).getByText(/^recipe$/i);
    expect(Boolean(baseHeading.compareDocumentPosition(actualBaseHeading) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(Boolean(actualBaseHeading.compareDocumentPosition(recipeHeading) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(within(resumeCard).queryByText(/no recipe data/i)).not.toBeInTheDocument();
    expect(within(resumeCard).getAllByText(/cutlass/i).length).toBeGreaterThanOrEqual(2);
    expect(onSerializedBuildChange.mock.lastCall?.[0]).toContain('"appearanceId":"item-broadsword"');
    expect(onSerializedBuildChange.mock.lastCall?.[0]).toContain('"baseId":"item-cutlass"');

    await user.click(screen.getByRole('button', { name: /recipe 3/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getByRole('button', { name: /^recipe 2$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cutlass/i })).not.toBeInTheDocument();
    expect(onSerializedBuildChange.mock.lastCall?.[0]).toContain('"baseId":"item-broadsword"');
  });

  it('shows sort controls with direct and inverse modes while keeping the rarity placeholder pinned and Turnip Heaven selectable', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 2/i }));
    const dialog = await screen.findByRole('dialog', { name: /select recipe 2/i });

    expect(within(dialog).getByRole('button', { name: /rarity \+15/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: /sort items/i })).toBeInTheDocument();

    const sortControl = within(dialog).getByRole('combobox', { name: /sort items/i });
    await user.click(sortControl);
    await user.click(screen.getByRole('option', { name: /name \(z-a\)/i }));
    expect(within(dialog).getAllByRole('button')[0]).toHaveAccessibleName(/rarity \+15/i);

    await user.click(sortControl);
    await user.click(screen.getByRole('option', { name: /rarity \(low-high\)/i }));
    expect(within(dialog).getByRole('button', { name: /turnip heaven/i })).toBeInTheDocument();
  });

  it('lets Light Ore unlock a cross-class Actual Base on weapon recipes only', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 2/i }));
    await chooseItemFromSelector(user, 'Clay', 'Claymore');

    let resumeCard = screen.getByText(/^resume$/i).closest('[data-slot="card"]') as HTMLElement;
    expect(within(resumeCard).getByText(/no actual base selected/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /recipe 3/i }));
    await chooseItemFromSelector(user, 'Light', 'Light Ore');

    resumeCard = screen.getByText(/^resume$/i).closest('[data-slot="card"]') as HTMLElement;
    expect(within(resumeCard).getByText(/actual base/i)).toBeInTheDocument();
    expect(within(resumeCard).getAllByText(/claymore/i).length).toBeGreaterThan(0);
  });

  it('shows hover tooltips for filled crafter slots without changing the click-to-edit flow', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    const slotButton = screen.getByRole('button', { name: /broadsword/i });
    const caption = screen.getByText(/^base item$/i);
    expect(caption.closest('[data-slot="tooltip-trigger"]')).toBeNull();
    await user.hover(slotButton);

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText(/broadsword/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/forge/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/^ATK \+5$/i)).toBeInTheDocument();
    expect(within(tooltip).getByText(/lv\. 1/i)).toBeInTheDocument();

    await user.unhover(slotButton);
    await user.click(slotButton);
    expect(await screen.findByRole('dialog', { name: /select base/i })).toBeInTheDocument();
  });

  it('renders cooking with healing groups and keeps the final build summary on the dashboard only', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    expect(screen.getByRole('heading', { name: /final build/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /final build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /breakdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /readme/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('tab', { name: /cooking/i }));
    expect(screen.getByText(/dish selection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /base food/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recipe 6/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /base food/i }));
    await chooseItemFromSelector(user, 'Glitter', 'Glitter Sashimi');
    const dishSelectionCard = screen.getByText(/dish selection/i).closest('[data-slot="card"]') as HTMLElement;
    expect(within(dishSelectionCard).getByRole('button', { name: /iron/i })).toBeInTheDocument();
    await user.click(within(dishSelectionCard).getByRole('button', { name: /recipe 2/i }));
    await chooseItemFromSelector(user, 'Silver', 'Silver');

    expect(screen.getByText(/^healing$/i)).toBeInTheDocument();
    expect(screen.getByText(/^HP$/i)).toBeInTheDocument();
    expect(screen.getByText(/^HP%$/i)).toBeInTheDocument();
    expect(screen.getByText(/^RP$/i)).toBeInTheDocument();
    expect(screen.getByText(/^RP%$/i)).toBeInTheDocument();
    expect(screen.getByText(/elem res/i)).toBeInTheDocument();
    expect(screen.getByText(/status attack/i)).toBeInTheDocument();
  });

  it('resets the current build without affecting the available crafter tabs', async () => {
    const user = userEvent.setup();

    render(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getAllByText(/broadsword/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /reset build/i }));

    expect(screen.queryByText(/broadsword/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /base/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /appearance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /simple/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /advanced/i })).not.toBeInTheDocument();
  });
});
