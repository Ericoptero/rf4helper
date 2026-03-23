import { describe, expect, it } from 'vitest';
import type { CrafterData, CrafterWarning, Item } from './schemas';
import {
  calculateCrafterBuild,
  createDefaultCrafterBuild,
} from './crafter';

const items: Record<string, Item> = {
  'item-base-blade': {
    id: 'item-base-blade',
    name: 'Base Blade',
    type: 'Forge',
    category: 'shortSword',
    craft: [{ recipeId: 'base-blade#1', stationType: 'Forging', station: 'Short Sword', level: 10, ingredients: ['item-iron'] }],
    stats: { atk: 100, diz: 3 },
    effects: [{ type: 'resistance', target: 'fire', value: 10 }],
  },
  'item-long-blade': {
    id: 'item-long-blade',
    name: 'Long Blade',
    type: 'Forge',
    category: 'longSword',
    craft: [{ recipeId: 'long-blade#1', stationType: 'Forging', station: 'Long Sword', level: 10, ingredients: ['item-iron'] }],
    stats: { atk: 130 },
  },
  'item-armor': {
    id: 'item-armor',
    name: 'Armor',
    type: 'Craft',
    category: 'armor',
    craft: [{ recipeId: 'armor#1', stationType: 'Crafting', station: 'Armor', level: 20, ingredients: ['item-cloth'] }],
    stats: { def: 50, mdef: 25 },
  },
  'item-headgear': {
    id: 'item-headgear',
    name: 'Headgear',
    type: 'Craft',
    category: 'headgear',
    craft: [{ recipeId: 'headgear#1', stationType: 'Crafting', station: 'Headgear', level: 20, ingredients: ['item-cloth'] }],
    stats: { def: 10 },
  },
  'item-shield': {
    id: 'item-shield',
    name: 'Shield',
    type: 'Craft',
    category: 'shield',
    craft: [{ recipeId: 'shield#1', stationType: 'Crafting', station: 'Shield', level: 20, ingredients: ['item-iron'] }],
    stats: { def: 40, mdef: 20 },
    effects: [{ type: 'resistance', target: 'light', value: 40 }],
  },
  'item-accessory': {
    id: 'item-accessory',
    name: 'Accessory',
    type: 'Craft',
    category: 'accessory',
    craft: [{ recipeId: 'accessory#1', stationType: 'Crafting', station: 'Accessory', level: 20, ingredients: ['item-gem'] }],
    stats: { str: 12 },
  },
  'item-shoes': {
    id: 'item-shoes',
    name: 'Shoes',
    type: 'Craft',
    category: 'shoes',
    craft: [{ recipeId: 'shoes#1', stationType: 'Crafting', station: 'Shoes', level: 20, ingredients: ['item-leather'] }],
    stats: { vit: 12 },
  },
  'item-food': {
    id: 'item-food',
    name: 'Food',
    type: 'Dish',
    craft: [{ recipeId: 'food#1', stationType: 'Cooking', station: 'Knife', level: 12, ingredients: ['item-fish'] }],
    stats: { hp: 1000, str: 10 },
  },
  'item-add': {
    id: 'item-add',
    name: 'Add',
    type: 'Material',
    rarityPoints: 20,
    stats: { atk: 10, def: 5 },
    effects: [{ type: 'resistance', target: 'water', value: 10 }],
  },
  'item-plus': {
    id: 'item-plus',
    name: 'Plus',
    type: 'Material',
    rarityPoints: 30,
    stats: { atk: 20 },
  },
  'item-object-x': {
    id: 'item-object-x',
    name: 'Object X',
    type: 'Potion',
    stats: {},
  },
  'item-double-steel': {
    id: 'item-double-steel',
    name: 'Double Steel',
    type: 'Drop',
    rarityPoints: 5,
    stats: {},
  },
  'item-10-fold-steel': {
    id: 'item-10-fold-steel',
    name: '10-Fold Steel',
    type: 'Drop',
    rarityPoints: 10,
    stats: {},
  },
  'item-light-ore': {
    id: 'item-light-ore',
    name: 'Light Ore',
    type: 'Mineral',
    rarityPoints: 13,
    stats: {},
  },
  'item-fire-crystal': {
    id: 'item-fire-crystal',
    name: 'Fire Crystal',
    type: 'Crystal',
    stats: { matk: 15 },
  },
  'item-turnip': {
    id: 'item-turnip',
    name: 'Golden Turnip',
    type: 'Crop',
    stats: { hp: 100 },
  },
};

const crafterData: CrafterData = {
  slotConfigs: [
    { key: 'weapon', label: 'Weapon', stationType: 'Forging', stations: ['Short Sword', 'Long Sword', 'Spear', 'Axe', 'Hammer', 'Dual Blade', 'Fist', 'Staff'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'armor', label: 'Armor', stationType: 'Crafting', stations: ['Armor'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'headgear', label: 'Headgear', stationType: 'Crafting', stations: ['Headgear'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'shield', label: 'Shield', stationType: 'Crafting', stations: ['Shield'], supportsAppearance: true, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'accessory', label: 'Accessory', stationType: 'Crafting', stations: ['Accessory'], supportsAppearance: false, inheritSlots: 3, upgradeSlots: 9 },
    { key: 'shoes', label: 'Shoes', stationType: 'Crafting', stations: ['Shoes'], supportsAppearance: false, inheritSlots: 3, upgradeSlots: 9 },
  ],
  defaults: {
    weapon: { appearanceId: 'item-base-blade', baseId: 'item-base-blade', inherits: [], upgrades: [] },
    armor: { appearanceId: 'item-armor', baseId: 'item-armor', inherits: [], upgrades: [] },
    headgear: { appearanceId: 'item-headgear', baseId: 'item-headgear', inherits: [], upgrades: [] },
    shield: { appearanceId: 'item-shield', baseId: 'item-shield', inherits: [], upgrades: [] },
    accessory: { baseId: 'item-accessory', inherits: [], upgrades: [] },
    shoes: { baseId: 'item-shoes', inherits: [], upgrades: [] },
    food: { baseId: 'item-food', ingredients: [] },
  },
  specialMaterialRules: [
    { itemId: 'item-object-x', behavior: 'invert' },
    { itemId: 'item-double-steel', behavior: 'doublePrevious' },
    { itemId: 'item-10-fold-steel', behavior: 'tenFoldPrevious' },
    { itemId: 'item-light-ore', behavior: 'lightOre' },
  ],
  weaponClassByStation: {
    'Short Sword': 'Short Sword',
    'Long Sword': 'Long Sword',
    Spear: 'Spear',
    Axe: 'Axe/Hammer',
    Hammer: 'Axe/Hammer',
    'Dual Blade': 'Dual Blade',
    Fist: 'Fist',
    Staff: 'Staff',
  },
  shieldCoverageByWeaponClass: {
    'Short Sword': 'full',
    'Long Sword': 'partial',
    Spear: 'partial',
    'Axe/Hammer': 'partial',
    Staff: 'partial',
    'Dual Blade': 'none',
    Fist: 'none',
  },
  chargeAttackByWeaponClass: {
    'Short Sword': 'Rush Slash',
    'Long Sword': 'Cyclone',
    Spear: 'Giga Swing',
    'Axe/Hammer': 'Grand Impact',
    Staff: 'Rune Burst',
    'Dual Blade': 'Twin Blitz',
    Fist: 'Flash Palm',
  },
  staffChargeByCrystalId: {
    'item-fire-crystal': 'Fireball',
  },
  levelBonusTiers: [
    { threshold: 0, tier: 0, label: '', stats: {} },
    { threshold: 30, tier: 1, label: 'Good quality.', stats: { atk: 10, def: 6, mdef: 5 } },
    { threshold: 60, tier: 2, label: 'Great quality.', stats: { atk: 25, def: 15, mdef: 12 } },
  ],
  rarityBonusTiers: [
    { threshold: 0, tier: 0, label: '', stats: {} },
    { threshold: 25, tier: 1, label: 'Some unusual materials.', stats: { atk: 10, def: 3, mdef: 3 } },
    { threshold: 50, tier: 2, label: 'Unusual materials.', stats: { atk: 40, def: 10, mdef: 10 } },
  ],
  foodOverrides: {
    'item-turnip': {
      additive: { hp: 100 },
      multipliers: { str: 0.1 },
    },
  },
};

function selection(itemId: string, level = 10) {
  return { itemId, level };
}

describe('crafter engine', () => {
  it('creates a default build from crafter data', () => {
    const build = createDefaultCrafterBuild(crafterData);
    expect(build.weapon.baseId).toBe('item-base-blade');
    expect(build.food.baseId).toBe('item-food');
    expect(build.weapon.upgrades).toHaveLength(9);
  });

  it('applies level and rarity tier bonuses', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.upgrades[0] = selection('item-plus', 10);
    build.weapon.upgrades[1] = selection('item-add', 10);

    const result = calculateCrafterBuild(build, items, crafterData);

    expect(result.bonusSummary.level.tier).toBe(2);
    expect(result.bonusSummary.rarity.tier).toBe(2);
    expect(result.totalStats.atk).toBeGreaterThan(100);
  });

  it('halves repeated upgrade material contributions', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.upgrades[0] = selection('item-add', 10);
    build.weapon.upgrades[1] = selection('item-add', 10);

    const result = calculateCrafterBuild(build, items, crafterData);
    const weapon = result.slotResults.weapon;

    expect(weapon.materialContributions[0]?.stats.atk).toBe(10);
    expect(weapon.materialContributions[1]?.stats.atk).toBe(5);
  });

  it('supports Object X, Double Steel, and 10-Fold Steel sequencing', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.upgrades[0] = selection('item-object-x', 10);
    build.weapon.upgrades[1] = selection('item-add', 10);
    build.weapon.upgrades[2] = selection('item-double-steel', 10);
    build.weapon.upgrades[3] = selection('item-10-fold-steel', 10);

    const result = calculateCrafterBuild(build, items, crafterData);
    const contributions = result.slotResults.weapon.materialContributions.filter(Boolean);

    expect(contributions[1]?.stats.atk).toBe(-10);
    expect(contributions[2]?.stats.atk).toBe(-20);
    expect(contributions[3]?.stats.atk).toBe(-80);
  });

  it('warns on light ore weapon mismatch and reduces shield effect for partial coverage', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.baseId = 'item-base-blade';
    build.weapon.appearanceId = 'item-long-blade';
    build.weapon.inherits[0] = selection('item-light-ore', 10);

    const result = calculateCrafterBuild(build, items, crafterData);
    const warningCodes = new Set(result.warnings.map((warning: CrafterWarning) => warning.code));

    expect(warningCodes.has('light-ore-weapon-mismatch')).toBe(true);
    expect(result.shieldSummary.coverage).toBe('full');
  });

  it('resolves staff charge attacks from crystal selections', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.baseId = 'item-base-blade';
    build.weapon.appearanceId = 'item-base-blade';
    const staffItem = { ...items['item-base-blade'], id: 'item-staff', name: 'Staff', craft: [{ recipeId: 'staff#1', stationType: 'Forging', station: 'Staff', level: 5, ingredients: ['item-fire-crystal'] }] };
    const nextItems = { ...items, 'item-staff': staffItem };
    build.weapon.baseId = 'item-staff';
    build.weapon.appearanceId = 'item-staff';
    build.weapon.inherits[0] = selection('item-fire-crystal', 10);

    const result = calculateCrafterBuild(build, nextItems, crafterData);
    expect(result.attackSummary.weaponClass).toBe('Staff');
    expect(result.attackSummary.chargeAttack).toContain('Fireball');
  });

  it('applies additive and multiplier food contributions', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.food.ingredients[0] = selection('item-turnip', 10);

    const result = calculateCrafterBuild(build, items, crafterData);

    expect(result.foodSummary.additive.hp).toBeGreaterThan(0);
    expect(result.totalStats.str ?? 0).toBeGreaterThan(result.equipmentStats.str ?? 0);
  });

  it('generates craft steps for equipment and food', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.upgrades[0] = selection('item-add', 10);
    build.food.ingredients[0] = selection('item-turnip', 10);

    const result = calculateCrafterBuild(build, items, crafterData);

    expect(result.craftSteps.join(' ')).toContain('Upgrade');
    expect(result.craftSteps.join(' ')).toContain('Cook');
  });
});
