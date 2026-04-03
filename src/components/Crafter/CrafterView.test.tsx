import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { CrafterView } from './CrafterView';
import { DetailDrawerProvider } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { resetDetailPayloadCache } from '@/components/details/useDetailPayload';
import { deserializeCrafterBuild } from '@/lib/crafter';
import type { CrafterData, CrafterSlotConfig, Item } from '@/lib/schemas';
import { server } from '@/setupTests';

const items: Record<string, Item> = {
  'item-broadsword': {
    id: 'item-broadsword',
    name: 'Broadsword',
    type: 'Forge',
    category: 'shortSword',
    image: '/images/items/broadsword.png',
    rarityPoints: 15,
    craft: [{ recipeId: 'broadsword#1', stationType: 'Forging', station: 'Short Sword', level: 1, ingredients: ['item-minerals'] }],
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
    craft: [{ recipeId: 'cutlass#3', stationType: 'Forging', station: 'Short Sword', level: 6, ingredients: ['item-minerals'] }],
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
  'item-minerals': {
    id: 'item-minerals',
    name: 'Minerals',
    type: 'Category',
    image: '/images/items/minerals.png',
    groupMembers: ['item-iron', 'item-silver'],
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
  'item-object-x': {
    id: 'item-object-x',
    name: 'Object X',
    type: 'Chemistry',
    image: '/images/items/object-x.png',
    rarityPoints: 0,
    stats: {},
  },
  'item-turnip-heaven': {
    id: 'item-turnip-heaven',
    name: 'Turnip Heaven',
    type: 'Dish',
    image: '/images/items/turnip-heaven.png',
    rarityPoints: 0,
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
          station: 'Short Sword',
          materials: ['item-minerals'],
        },
        'item-claymore': {
          station: 'Long Sword',
          materials: ['item-iron'],
        },
        'item-cutlass': {
          station: 'Short Sword',
          materials: ['item-minerals'],
        },
        'item-heaven-asunder': {
          station: 'Long Sword',
          materials: ['item-silver', 'item-iron'],
        },
      },
      armor: {
        'item-royal-garter': {
          station: 'Armor',
          materials: ['item-iron'],
        },
      },
      headgear: {
        'item-feathered-hat': {
          station: 'Headgear',
          materials: ['item-iron'],
        },
      },
      shield: {
        'item-rune-shield': {
          station: 'Shield',
          materials: ['item-iron'],
        },
      },
      accessory: {
        'item-strange-pendant': {
          station: 'Accessory',
          materials: ['item-iron'],
        },
      },
      shoes: {
        'item-heavy-boots': {
          station: 'Shoes',
          materials: ['item-iron'],
        },
      },
    },
    food: {
      'item-glitter-sashimi': {
        station: 'Knife',
        materials: ['item-iron'],
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
      'item-object-x': equipmentPayload({ itemName: 'Object X', rarity: 0 }),
      'item-turnip-heaven': equipmentPayload({ itemName: 'Turnip Heaven', rarity: 0 }),
      'item-minerals': equipmentPayload({ itemName: 'Minerals', rarity: 0 }),
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
      'item-object-x': equipmentPayload({ itemName: 'Object X', rarity: 0 }),
      'item-minerals': equipmentPayload({ itemName: 'Minerals', rarity: 0 }),
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

function renderWithDetailDrawer(ui: React.ReactNode) {
  return render(
    <DetailDrawerProvider onDetailReferenceChange={() => undefined}>
      {ui}
      <UniversalDetailsDrawer />
    </DetailDrawerProvider>,
  );
}

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

afterEach(() => {
  resetDetailPayloadCache();
});

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
    renderWithDetailDrawer(<CrafterHarness />);

    expect(screen.getByRole('button', { name: /reset build/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: /weapon/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /armor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /headgear/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /shield/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /accessory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /shoes/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /cooking/i })).not.toBeInTheDocument();
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

    renderWithDetailDrawer(<CrafterHarness />);

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

    renderWithDetailDrawer(<CrafterHarness />);

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

  it('keeps legacy preview percent stats in top-level item stats from double-scaling in the selector dialog', async () => {
    const legacyItems: Record<string, Item> = {
      ...items,
      'item-legacy-crit-blade': {
        id: 'item-legacy-crit-blade',
        name: 'Legacy Crit Blade',
        type: 'Forge',
        category: 'shortSword',
        image: '/images/items/broadsword.png',
        rarityPoints: 7,
        craft: [{ recipeId: 'legacy-crit-blade#1', stationType: 'Forging', station: 'Short Sword', level: 15, ingredients: ['item-iron'] }],
        stats: { atk: 30, crit: 10 },
      },
    };
    const legacyCrafterData = structuredClone(crafterData);

    function LegacyHarness() {
      const [serializedBuild, setSerializedBuild] = useState<string>();

      return (
        <CrafterView
          items={legacyItems}
          crafterData={legacyCrafterData}
          serializedBuild={serializedBuild}
          onSerializedBuildChange={setSerializedBuild}
        />
      );
    }

    const user = userEvent.setup();
    renderWithDetailDrawer(<LegacyHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Legacy');
    await user.click(within(dialog).getByRole('button', { name: /legacy crit blade/i }));

    expect(within(dialog).getAllByText(/crit \+10%/i).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/crit \+1,?000%/i)).not.toBeInTheDocument();
  });

  it('keeps crafter selector images on the public images path for backend-enriched items', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const previewIcon = within(dialog).getByAltText(/broadsword icon/i);

    expect(previewIcon).toHaveAttribute('src', '/images/items/broadsword.png');
  });

  it('opens the shared item drawer from the selector preview without closing the selector dialog', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('http://localhost:3000/api/details/item/item-broadsword', () =>
        HttpResponse.json({
          type: 'item',
          item: items['item-broadsword'],
          items,
          dropSources: [],
          cropRelations: [],
        })),
    );

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const selectorDialog = await screen.findByRole('dialog', { name: /select base/i });
    const search = within(selectorDialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Broad');
    await user.click(within(selectorDialog).getByRole('button', { name: /broadsword/i }));

    await user.click(within(selectorDialog).getByRole('button', { name: /open item details/i }));

    expect(selectorDialog).toBeInTheDocument();
    expect(within(selectorDialog).getByRole('button', { name: /apply/i, hidden: true })).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: /broadsword/i })).toBeInTheDocument();
  });

  it('shows final stats with at most one decimal place while keeping geometry precision in the final stats panel', async () => {
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
    renderWithDetailDrawer(<CustomHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getByText(/\+1,234\.6$/i)).toBeInTheDocument();
    expect(screen.getByText(/^crit$/i).closest('div')).toHaveTextContent('+10.4%');
    expect(screen.getByText(/^knock$/i).closest('div')).toHaveTextContent('+12.6%');
    expect(screen.getByText(/^stun$/i).closest('div')).toHaveTextContent('+99.4%');
    expect(screen.getByText(/fire: \+12\.6%/i)).toBeInTheDocument();
    expect(screen.getByText(/water: \+87\.4%/i)).toBeInTheDocument();
    expect(screen.getByText(/psn: \+10\.4%/i)).toBeInTheDocument();
    expect(screen.getByText(/^psn 12\.6%$/i)).toBeInTheDocument();
    expect(screen.getByText(/depth \+1\.6/i)).toBeInTheDocument();
    expect(screen.getByText(/length \+2\.3/i)).toBeInTheDocument();
    expect(screen.getByText(/width \+0\.6/i)).toBeInTheDocument();
    expect(screen.queryByText(/\+1,235$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^psn 13%$/i)).not.toBeInTheDocument();
  });

  it('renders raw crafter payload percent stats in selector previews without extra scaling', async () => {
    const customCrafterData = structuredClone(crafterData);
    customCrafterData.stats.weapon['item-broadsword'] = equipmentPayload({
      itemName: 'Broadsword',
      weaponClass: 'Short Sword',
      stats: { atk: 5, crit: 0.098 },
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
    renderWithDetailDrawer(<CustomHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Broad');
    await user.click(within(dialog).getByRole('button', { name: /broadsword/i }));

    expect(within(dialog).getAllByText(/crit \+9\.8%/i).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/crit \+980%/i)).not.toBeInTheDocument();
  });

  it('restores selector stat tags for items that only expose derived display stats in the current slot', async () => {
    const derivedItems: Record<string, Item> = {
      ...items,
      'item-derived-display-blade': {
        id: 'item-derived-display-blade',
        name: 'Derived Display Blade',
        type: 'Forge',
        category: 'shortSword',
        image: '/images/items/broadsword.png',
        rarityPoints: 12,
        craft: [{ recipeId: 'derived-display-blade#1', stationType: 'Forging', station: 'Short Sword', level: 40, ingredients: ['item-iron'] }],
        crafter: {
          equipment: {
            weapon: {
              stats: { atk: 88, crit: 0.1 },
              weaponClass: 'Short Sword',
              attackType: 'Short Sword',
              element: 'None',
              damageType: 'Physical',
              resistances: {},
              statusAttacks: {},
              geometry: {},
              bonusType: undefined,
              bonusType2: undefined,
            },
          },
        },
      },
    };
    const user = userEvent.setup();

    function DerivedHarness() {
      const [serializedBuild, setSerializedBuild] = useState<string>();

      return (
        <CrafterView
          items={derivedItems}
          crafterData={crafterData}
          serializedBuild={serializedBuild}
          onSerializedBuildChange={setSerializedBuild}
        />
      );
    }

    renderWithDetailDrawer(<DerivedHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /upgrade 1/i }));

    const dialog = await screen.findByRole('dialog', { name: /select upgrade 1/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Derived');
    await user.click(within(dialog).getByRole('button', { name: /derived display blade/i }));

    expect(within(dialog).getAllByText(/atk \+88/i).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/crit \+10%/i).length).toBeGreaterThan(0);
  });

  it('focuses the selector search, keeps the sort control full width, and persists compressed appearance and recipe level changes', async () => {
    const user = userEvent.setup();
    const onSerializedBuildChange = vi.fn();

    renderWithDetailDrawer(<CrafterHarness onSerializedBuildChange={onSerializedBuildChange} />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const dialog = await screen.findByRole('dialog', { name: /select base/i });
    const sortControl = within(dialog).getByRole('combobox', { name: /sort items/i });
    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    expect(search).toHaveFocus();
    expect(search).toHaveAttribute('tabindex', '0');
    expect(Boolean(sortControl.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(sortControl.className).toContain('w-full');
    await user.clear(search);
    await user.type(search, 'Broad');
    await user.click(within(dialog).getByRole('button', { name: /broadsword/i }));
    await user.keyboard('{Enter}');

    expect(screen.getAllByText(/broadsword/i).length).toBeGreaterThan(0);
    expect(onSerializedBuildChange).toHaveBeenCalled();
    expect(onSerializedBuildChange.mock.lastCall?.[0]).not.toContain('"appearanceId"');
    expect(deserializeCrafterBuild(onSerializedBuildChange.mock.lastCall?.[0], crafterData).weapon.appearanceId).toBe('item-broadsword');

    await user.click(screen.getByRole('button', { name: /minerals/i }));
    const recipeDialog = await screen.findByRole('dialog', { name: /select recipe 1/i });
    const levelSlider = within(recipeDialog).getByRole('slider', { name: /item level/i });
    expect(levelSlider).toHaveAttribute('aria-valuenow', '10');
    expect(within(recipeDialog).getByText(/this recipe slot accepts any item from the minerals group/i)).toBeInTheDocument();

    levelSlider.focus();
    fireEvent.keyDown(levelSlider, { key: 'ArrowLeft' });
    fireEvent.keyDown(levelSlider, { key: 'ArrowLeft' });
    expect(levelSlider).toHaveAttribute('aria-valuenow', '8');
    await user.click(within(recipeDialog).getByRole('button', { name: /apply/i }));

    expect(deserializeCrafterBuild(onSerializedBuildChange.mock.lastCall?.[0], crafterData).weapon.recipe[0]?.level).toBe(8);

    await user.click(screen.getByRole('button', { name: /minerals/i }));
    const reopenedDialog = await screen.findByRole('dialog', { name: /select recipe 1/i });
    expect(within(reopenedDialog).getByRole('slider', { name: /item level/i })).toHaveAttribute('aria-valuenow', '8');
  });

  it('keeps recipe ingredients hydrated from the merged item recipes and restricts category slots to their group members', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getByRole('button', { name: /minerals/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /minerals/i }));

    const dialog = await screen.findByRole('dialog', { name: /select recipe 1/i });
    expect(within(dialog).getByText(/choose material/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /iron/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /silver/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /firewyrm scale/i })).not.toBeInTheDocument();

    const search = within(dialog).getByRole('searchbox', { name: /search items/i });
    await user.clear(search);
    await user.type(search, 'Silver');
    await user.click(within(dialog).getByRole('button', { name: /silver/i }));
    await user.click(within(dialog).getByRole('button', { name: /apply/i }));

    expect(screen.getByRole('button', { name: /silver/i })).toBeInTheDocument();
  });

  it('keeps empty equipment recipe slots freely editable with the rarity placeholder pinned once a base is selected', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 6/i }));

    const dialog = await screen.findByRole('dialog', { name: /select recipe 6/i });
    const allButtons = within(dialog).getAllByRole('button');

    expect(within(dialog).queryByText(/choose material/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/level only/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/recipe unavailable/i)).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /clear slot/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /rarity \+15/i })).toBeInTheDocument();
    expect(allButtons[0]).toHaveAccessibleName(/rarity \+15/i);
    expect(within(dialog).getByRole('button', { name: /object x/i })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /rarity \+15/i }));
    await user.click(within(dialog).getByRole('button', { name: /apply/i }));

    const recipeSlotButton = screen.getByRole('button', { name: /rarity \+15/i });
    expect(recipeSlotButton.querySelector('.lucide-star')).not.toBeNull();
    expect(within(recipeSlotButton).queryByRole('img', { name: /rarity \+15 icon/i })).not.toBeInTheDocument();
  });

  it('does not fall back to the free material picker for unresolved recipe slots', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /recipe 1/i }));

    const dialog = await screen.findByRole('dialog', { name: /select recipe 1/i });

    expect(within(dialog).getAllByText(/select a base item first/i).length).toBeGreaterThan(0);
    expect(within(dialog).queryByRole('button', { name: /heavy boots/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /firewyrm scale/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /rarity \+15/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/no items found\./i)).not.toBeInTheDocument();
  });

  it('shows effective slot rarity in selector lists, keeping equipment base choices at zero and upgrade materials at their real values', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));

    const baseDialog = await screen.findByRole('dialog', { name: /select base/i });
    const baseSortControl = within(baseDialog).getByRole('combobox', { name: /sort items/i });
    const broadswordButton = within(baseDialog).getByRole('button', { name: /broadsword/i });
    const heavenAsunderButton = within(baseDialog).getByRole('button', { name: /heaven asunder/i });

    expect(within(broadswordButton).getByText(/rarity 0/i)).toBeInTheDocument();
    expect(within(heavenAsunderButton).getByText(/rarity 0/i)).toBeInTheDocument();

    await user.click(baseSortControl);
    await user.click(screen.getByRole('option', { name: /rarity \(high-low\)/i }));

    const sortedBroadswordButton = within(baseDialog).getByRole('button', { name: /broadsword/i });
    const sortedHeavenAsunderButton = within(baseDialog).getByRole('button', { name: /heaven asunder/i });
    expect(Boolean(sortedBroadswordButton.compareDocumentPosition(sortedHeavenAsunderButton) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    await user.click(within(baseDialog).getByRole('button', { name: /cancel/i }));

    await user.click(screen.getByRole('button', { name: /upgrade 1/i }));
    const upgradeDialog = await screen.findByRole('dialog', { name: /select upgrade 1/i });
    const placeholderButton = within(upgradeDialog).getByRole('button', { name: /rarity \+15/i });
    const firewyrmButton = within(upgradeDialog).getByRole('button', { name: /firewyrm scale/i });

    expect(within(placeholderButton).getByText(/rarity 15/i)).toBeInTheDocument();
    expect(placeholderButton.querySelector('.lucide-star')).not.toBeNull();
    expect(within(placeholderButton).getAllByText(/rarity \+15/i).length).toBeGreaterThan(0);
    expect(within(firewyrmButton).getByText(/rarity 9/i)).toBeInTheDocument();

    await user.click(placeholderButton);

    expect(within(upgradeDialog).getByText(/^selected item$/i)).toBeInTheDocument();
    expect(within(upgradeDialog).getAllByText(/rarity \+15/i).length).toBeGreaterThan(0);
    const selectedItemPreview = within(upgradeDialog).getByText(/^selected item$/i).closest('div')?.parentElement;
    expect(selectedItemPreview?.querySelector('.lucide-star')).not.toBeNull();
  });

  it('shows derived-base recipe candidates as rarity zero in recipe slot dialogs', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 6/i }));

    const recipeDialog = await screen.findByRole('dialog', { name: /select recipe 6/i });
    const broadswordButton = within(recipeDialog).getByRole('button', { name: /broadsword/i });

    expect(within(broadswordButton).getByText(/rarity 0/i)).toBeInTheDocument();
  });

  it('shows a recipe-specific unresolved state instead of the generic empty results message', async () => {
    const user = userEvent.setup();
    const brokenCrafterData = structuredClone(crafterData);
    brokenCrafterData.recipes.equipment.weapon['item-broadsword'] = {
      station: 'Short Sword',
      materials: ['item-missing-default'],
    };

    function BrokenHarness() {
      const [serializedBuild, setSerializedBuild] = useState<string>();

      return (
        <CrafterView
          items={items}
          crafterData={brokenCrafterData}
          serializedBuild={serializedBuild}
          onSerializedBuildChange={setSerializedBuild}
        />
      );
    }

    renderWithDetailDrawer(<BrokenHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    await user.click(screen.getByRole('button', { name: /recipe 1/i }));

    const dialog = await screen.findByRole('dialog', { name: /select recipe 1/i });

    expect(within(dialog).getAllByText(/this recipe could not be resolved for the selected base/i).length).toBeGreaterThan(0);
    expect(within(dialog).queryByText(/no items found\./i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /iron/i })).not.toBeInTheDocument();
  });

  it('keeps fixed recipe slots level-only while leaving upgrade slots fully selectable with the placeholder pinned', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Heav', 'Heaven Asunder');

    await user.click(screen.getByRole('button', { name: /silver/i }));
    const fixedDialog = await screen.findByRole('dialog', { name: /select recipe 1/i });

    expect(within(fixedDialog).getByText(/this recipe ingredient is fixed\. you can only adjust its level\./i)).toBeInTheDocument();
    expect(within(fixedDialog).getByText(/level only/i)).toBeInTheDocument();
    expect(within(fixedDialog).queryByRole('button', { name: /firewyrm scale/i })).not.toBeInTheDocument();
    expect(within(fixedDialog).getByRole('button', { name: /silver/i })).toBeInTheDocument();
    expect(within(fixedDialog).queryByRole('button', { name: /clear slot/i })).not.toBeInTheDocument();
    await user.click(within(fixedDialog).getByRole('button', { name: /cancel/i }));

    await user.click(screen.getByRole('button', { name: /upgrade 1/i }));
    const dialog = await screen.findByRole('dialog', { name: /select upgrade 1/i });

    const sortControl = within(dialog).getByRole('combobox', { name: /sort items/i });
    expect(within(dialog).getByRole('button', { name: /rarity \+15/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /turnip heaven/i })).toBeInTheDocument();
    await user.click(sortControl);
    await user.click(screen.getByRole('option', { name: /name \(z-a\)/i }));
    expect(within(dialog).getAllByRole('button')[0]).toHaveAccessibleName(/rarity \+15/i);

    await user.click(sortControl);
    await user.click(screen.getByRole('option', { name: /rarity \(low-high\)/i }));
    expect(within(dialog).getByRole('button', { name: /turnip heaven/i })).toBeInTheDocument();
  });

  it('shows hover tooltips for filled crafter slots without changing the click-to-edit flow', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

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
    expect(within(tooltip).getByRole('img', { name: /broadsword preview/i })).toHaveAttribute('src', '/images/items/broadsword.png');

    await user.unhover(slotButton);
    await user.click(slotButton);
    expect(await screen.findByRole('dialog', { name: /select base/i })).toBeInTheDocument();
  });

  it('keeps the cooking tab hidden and shows the final build summary on the dashboard only', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

    expect(screen.getByRole('heading', { name: /final build/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /final build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /breakdown/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /readme/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /cooking/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /weapon/i }));
    await user.click(screen.getByRole('button', { name: /base/i }));
    await chooseItemFromSelector(user, 'Broad', 'Broadsword');

    expect(screen.getByText(/elem res/i)).toBeInTheDocument();
    expect(screen.getByText(/status attack/i)).toBeInTheDocument();
  });

  it('does not render the cooking tab trigger in the tab list', async () => {
    renderWithDetailDrawer(<CrafterHarness />);

    expect(screen.queryByRole('tab', { name: /cooking/i })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /weapon/i })).toBeInTheDocument();
  });

  it('resets the current build without affecting the available crafter tabs', async () => {
    const user = userEvent.setup();

    renderWithDetailDrawer(<CrafterHarness />);

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
