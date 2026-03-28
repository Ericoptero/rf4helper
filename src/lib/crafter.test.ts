import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  calculateCrafterBuild,
  CRAFTER_RARITY_PLACEHOLDER_ID,
  createDefaultCrafterBuild,
  deserializeCrafterBuild,
  serializeCrafterBuild,
} from './crafter';
import { buildCrafterData } from './crafterData';
import { CrafterConfigSchema, ItemSchema, type CrafterConfig, type CrafterDefaults, type Item } from './schemas';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dirname, '../../public/data');

const items = z
  .record(z.string(), ItemSchema)
  .parse(JSON.parse(readFileSync(path.join(dataDir, 'items.json'), 'utf8'))) as Record<string, Item>;
const crafterConfig = CrafterConfigSchema.parse(
  JSON.parse(readFileSync(path.join(dataDir, 'crafter.json'), 'utf8')),
) as CrafterConfig;
const crafterData = buildCrafterData(items, crafterConfig);

function selection(itemId: string, level = 10) {
  return { itemId, level };
}

function cloneBuild(build: CrafterDefaults): CrafterDefaults {
  return structuredClone(build);
}

describe('crafter engine parity', () => {
  it('creates a default build padded from slot configuration', () => {
    const build = createDefaultCrafterBuild(crafterData);

    expect(build.weapon.recipe).toHaveLength(6);
    expect(build.weapon.inherits).toHaveLength(3);
    expect(build.weapon.upgrades).toHaveLength(9);
    expect(build.weapon.appearanceId).toBeUndefined();
    expect(build.accessory.baseId).toBeUndefined();
    expect(build.accessory.appearanceId).toBeUndefined();
    expect(build.food.recipe).toHaveLength(6);
    expect(build.food.recipe.every((slot) => slot.itemId == null && slot.level === 1)).toBe(true);
  });

  it('round-trips compressed builds and migrates the retired raw JSON format with baseId-only slots', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-minerals', 8);
    build.weapon.upgrades[0] = selection('item-firewyrm-scale');
    build.accessory.appearanceId = 'item-strange-pendant';
    build.food.baseId = 'item-glitter-sashimi';
    build.food.recipe[0] = selection('item-golden-turnip', 8);
    const legacyRawBuild = JSON.stringify({
      ...build,
      weapon: {
        ...build.weapon,
        appearanceId: undefined,
        baseId: 'item-broadsword',
      },
      accessory: {
        ...build.accessory,
        appearanceId: undefined,
        baseId: 'item-strange-pendant',
      },
    });

    const serialized = serializeCrafterBuild(build, crafterData);
    const restored = deserializeCrafterBuild(serialized, crafterData);
    const restoredLegacy = deserializeCrafterBuild(legacyRawBuild, crafterData);

    expect(serialized).not.toContain('{');
    expect(serialized).not.toContain('"appearanceId"');
    expect(restored.weapon.appearanceId).toBe('item-broadsword');
    expect(restored.weapon.recipe[0]?.itemId).toBe('item-minerals');
    expect(restored.weapon.recipe[0]?.level).toBe(8);
    expect(restored.weapon.upgrades[0]?.itemId).toBe('item-firewyrm-scale');
    expect(restored.accessory.appearanceId).toBe('item-strange-pendant');
    expect(restored.food.baseId).toBe('item-glitter-sashimi');
    expect(restored.food.recipe[0]?.itemId).toBe('item-golden-turnip');
    expect(restored.food.recipe[0]?.level).toBe(8);
    expect(restoredLegacy.weapon.appearanceId).toBe('item-broadsword');
    expect(restoredLegacy.weapon.baseId).toBeUndefined();
    expect(restoredLegacy.accessory.appearanceId).toBe('item-strange-pendant');
    expect(restoredLegacy.accessory.baseId).toBeUndefined();
    expect(restoredLegacy.food.baseId).toBe('item-glitter-sashimi');
  });

  it('keeps the workbook sample structurally valid under the restored appearance/base model', () => {
    const fixture = crafterData.fixtures.workbookSample;
    expect(fixture).toBeDefined();

    const result = calculateCrafterBuild(cloneBuild(fixture!.build), items, crafterData);

    expect(result.build.weapon.appearanceId).toBe('item-broadsword');
    expect(result.build.weapon.baseId).toBeUndefined();
    expect(result.slotResults.weapon.appearanceName).toBe('Broadsword');
    expect(result.slotResults.weapon.baseName).toBe('Broadsword');
    expect(result.totalStats.atk ?? 0).toBeGreaterThan(0);
    expect(result.effectiveStats.atk ?? 0).toBeGreaterThan(0);
    expect(result.resistances.fnt ?? 0).toBeGreaterThanOrEqual(0);
    expect(result.shieldSummary.coverage).toBe(fixture!.expected.shieldCoverage);
    expect(result.attackSummary.attackType).toBe(fixture!.expected.attackType);
    expect(result.attackSummary.element).toBe(fixture!.expected.element);
    expect(result.attackSummary.damageType).toBe(fixture!.expected.damageType);
    expect([...result.allEffects].sort()).toEqual([...fixture!.expected.effects].sort());
  });

  it('exposes per-slot bonus summaries with threshold progress metadata and aggregated geometry', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.upgrades[0] = selection('item-firewyrm-scale');

    const result = calculateCrafterBuild(build, items, crafterData);
    const levelSummary = result.slotResults.weapon.levelBonusSummary;
    const raritySummary = result.slotResults.weapon.rarityBonusSummary;

    expect(levelSummary.currentThreshold).toBeLessThanOrEqual(levelSummary.value);
    expect(levelSummary.nextThreshold).toBeGreaterThan(levelSummary.value);
    expect(levelSummary.remainingToNext).toBe((levelSummary.nextThreshold ?? 0) - levelSummary.value);
    expect(levelSummary.progressRatio).toBeGreaterThanOrEqual(0);
    expect(levelSummary.progressRatio).toBeLessThanOrEqual(1);
    expect(levelSummary.isMaxTier).toBe(false);

    expect(raritySummary.currentThreshold).toBeLessThanOrEqual(raritySummary.value);
    expect(raritySummary.nextThreshold).toBeGreaterThan(raritySummary.value);
    expect(raritySummary.remainingToNext).toBe((raritySummary.nextThreshold ?? 0) - raritySummary.value);
    expect(raritySummary.progressRatio).toBeGreaterThanOrEqual(0);
    expect(raritySummary.progressRatio).toBeLessThanOrEqual(1);
    expect(raritySummary.isMaxTier).toBe(false);

    expect(result.slotResults.weapon.geometry.depth).toBeGreaterThan(0);
    expect(result.slotResults.weapon.geometry.length).toBeGreaterThan(0);
    expect(result.slotResults.weapon.geometry.width).toBeGreaterThan(0);
    expect(result.equipmentGeometry.depth).toBe(result.slotResults.weapon.geometry.depth);
    expect(result.geometry.width).toBe(result.slotResults.weapon.geometry.width);
  });

  it('clamps weapon length to the spreadsheet maximum of 4', () => {
    const data = structuredClone(crafterData);
    data.materials.weapon['item-firewyrm-scale'] = {
      ...(data.materials.weapon['item-firewyrm-scale'] ?? { itemName: 'Firewyrm Scale', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      geometry: { length: 2.5 },
    };

    const build = createDefaultCrafterBuild(data);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.upgrades[0] = selection('item-firewyrm-scale');
    build.weapon.upgrades[1] = selection('item-firewyrm-scale');
    build.weapon.upgrades[2] = selection('item-firewyrm-scale');

    const result = calculateCrafterBuild(build, items, data);

    expect(result.slotResults.weapon.geometry.length).toBe(4);
    expect(result.equipmentGeometry.length).toBe(4);
    expect(result.geometry.length).toBe(4);
  });

  it('derives the equipped base level from filled upgrades without adding it to the level bonus total', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');

    const withoutUpgrades = calculateCrafterBuild(build, items, crafterData);
    expect(withoutUpgrades.slotResults.weapon.itemLevel).toBe(1);
    expect(withoutUpgrades.slotResults.weapon.level).toBe(10);

    build.weapon.upgrades[0] = selection('item-firewyrm-scale');
    build.weapon.upgrades[1] = selection('item-firewyrm-scale');

    const twoUpgrades = calculateCrafterBuild(build, items, crafterData);
    expect(twoUpgrades.slotResults.weapon.itemLevel).toBe(3);
    expect(twoUpgrades.slotResults.weapon.level).toBe(withoutUpgrades.slotResults.weapon.level + 20);

    for (let index = 2; index < 9; index += 1) {
      build.weapon.upgrades[index] = selection('item-firewyrm-scale');
    }

    const maxed = calculateCrafterBuild(build, items, crafterData);
    expect(maxed.slotResults.weapon.itemLevel).toBe(10);
    expect(maxed.slotResults.weapon.level).toBe(100);
  });

  it('applies Object X inversion and repeated-upgrade halving using workbook ordering rules', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.armor.appearanceId = 'item-four-dragons-vest';
    build.armor.recipe[0] = selection('item-four-dragons-vest');
    build.armor.upgrades[0] = selection('item-object-x');
    build.armor.upgrades[1] = selection('item-firewyrm-scale');
    build.armor.upgrades[2] = selection('item-firewyrm-scale');

    const result = calculateCrafterBuild(build, items, crafterData);
    const upgrades = result.slotResults.armor.materialContributions.filter((entry) => entry.source === 'upgrade');

    expect(upgrades[1]?.stats.str).toBeCloseTo(-300, 6);
    expect(upgrades[2]?.stats.str).toBeCloseTo(-150, 6);
    expect(upgrades[1]?.stats.int).toBeCloseTo(10, 6);
    expect(upgrades[2]?.stats.int).toBeCloseTo(5, 6);
  });

  it('replays Double Steel and 10-Fold Steel from the previous regular upgrade contribution', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.upgrades[0] = selection('item-firewyrm-scale');
    build.weapon.upgrades[1] = selection('item-double-steel');
    build.weapon.upgrades[2] = selection('item-10-fold-steel');

    const result = calculateCrafterBuild(build, items, crafterData);
    const upgrades = result.slotResults.weapon.materialContributions.filter((entry) => entry.source === 'upgrade');

    expect(upgrades[0]?.stats.str).toBeCloseTo(300, 6);
    expect(upgrades[1]?.stats.str).toBeCloseTo(600, 6);
    expect(upgrades[2]?.stats.str).toBeCloseTo(2400, 6);
    expect(upgrades[0]?.stats.int).toBeCloseTo(-10, 6);
    expect(upgrades[1]?.stats.int).toBeCloseTo(-20, 6);
    expect(upgrades[2]?.stats.int).toBeCloseTo(-80, 6);
  });

  it('transfers only special effects for accessory and shoes inheritance, ignoring numeric payloads', () => {
    const data = structuredClone(crafterData);
    data.materials.armor['item-art-of-magic'] = {
      ...(data.materials.armor['item-art-of-magic'] ?? { itemName: 'Art of Magic', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      stats: { atk: 999, def: 777 },
      resistances: { fire: 0.5, water: 0.25 },
      statusAttacks: { seal: 0.4 },
      geometry: { length: 2 },
    };
    data.materials.armor['item-talisman'] = {
      ...(data.materials.armor['item-talisman'] ?? { itemName: 'Talisman', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      stats: { matk: 555 },
      resistances: { dark: 0.75 },
      statusAttacks: { psn: 0.3 },
      geometry: { width: 1.5 },
    };
    data.materials.armor['item-fast-step-boots'] = {
      ...(data.materials.armor['item-fast-step-boots'] ?? { itemName: 'Fast Step Boots', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      stats: { def: 432, vit: 123 },
      resistances: { wind: 0.6 },
      statusAttacks: { faint: 0.2 },
      geometry: { depth: 4 },
    };
    data.materials.armor['item-rocket-wing'] = {
      ...(data.materials.armor['item-rocket-wing'] ?? { itemName: 'Rocket Wing', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      stats: { atk: 321 },
      resistances: { light: 0.9 },
      statusAttacks: { drain: 0.4 },
      geometry: { width: 3 },
    };

    const baselineBuild = createDefaultCrafterBuild(data);
    baselineBuild.accessory.appearanceId = 'item-strange-pendant';
    baselineBuild.shoes.appearanceId = 'item-heavy-boots';

    const inheritedBuild = cloneBuild(baselineBuild);
    inheritedBuild.accessory.inherits[0] = selection('item-art-of-magic');
    inheritedBuild.accessory.inherits[1] = selection('item-talisman');
    inheritedBuild.shoes.inherits[0] = selection('item-fast-step-boots');
    inheritedBuild.shoes.inherits[1] = selection('item-rocket-wing');

    const baseline = calculateCrafterBuild(baselineBuild, items, data);
    const result = calculateCrafterBuild(inheritedBuild, items, data);

    expect(result.slotResults.accessory.stats).toEqual(baseline.slotResults.accessory.stats);
    expect(result.slotResults.accessory.resistances).toEqual(baseline.slotResults.accessory.resistances);
    expect(result.slotResults.accessory.statusAttacks).toEqual(baseline.slotResults.accessory.statusAttacks);
    expect(result.slotResults.accessory.geometry).toEqual(baseline.slotResults.accessory.geometry);
    expect(result.slotResults.shoes.stats).toEqual(baseline.slotResults.shoes.stats);
    expect(result.slotResults.shoes.resistances).toEqual(baseline.slotResults.shoes.resistances);
    expect(result.slotResults.shoes.statusAttacks).toEqual(baseline.slotResults.shoes.statusAttacks);
    expect(result.slotResults.shoes.geometry).toEqual(baseline.slotResults.shoes.geometry);
    expect(result.slotResults.accessory.effects).toContain('Strange Pendant');
    expect(result.slotResults.accessory.effects).toContain('Art of Magic');
    expect(result.slotResults.accessory.effects).toContain('Talisman');
    expect(result.slotResults.shoes.effects).toContain('Heavy Boots');
    expect(result.slotResults.shoes.effects).toContain('Fast Step Boots');
    expect(result.slotResults.shoes.effects).toContain('Rocket Wing');
  });

  it('updates staff charge attacks from inherited charge materials', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-rod';
    build.weapon.recipe[0] = selection('item-rod');
    build.weapon.inherits[0] = selection('item-fire-crystal');

    const result = calculateCrafterBuild(build, items, crafterData);

    expect(result.attackSummary.weaponClass).toBe('Staff');
    expect(result.attackSummary.staffCharges?.lv1).toBe('Fire Spread Lv1');
    expect(result.attackSummary.staffCharges?.lv2).toBe('Fire Spread Lv2');
    expect(result.attackSummary.staffCharges?.lv3).toBe('Fire Spread Lv3');
    expect(result.attackSummary.staffCharges?.maxCharge).toBe(1);
  });

  it('computes cooking healing, stats, resistances, status attacks, and final level from selected ingredients', () => {
    const data = structuredClone(crafterData);
    data.food.baseStats['item-glitter-sashimi'] = {
      ...(data.food.baseStats['item-glitter-sashimi'] ?? { itemName: 'Glitter Sashimi', additive: {}, multipliers: {}, resistances: {}, statusAttacks: {} }),
      additive: { hp: 1000, rp: 200, str: 150, crit: 0.6 },
      multipliers: { hp: 0.5, rp: 0.25, str: 0.2 },
      resistances: { fire: 0.2, crit: 0.35, psn: 0.25 },
      statusAttacks: { psn: 0.1 },
    };
    data.materials.food['item-glitter-snapper'] = {
      itemName: 'Glitter Snapper',
      additive: { hp: 125, rp: 40, int: 30, crit: 0.15 },
      multipliers: { hp: 0.1, rp: 0.05, vit: 0.3 },
      resistances: { water: 0.15, knock: 0.2, seal: 0.15 },
      statusAttacks: { seal: 0.2 },
    };
    data.materials.food['item-golden-turnip'] = {
      itemName: 'Golden Turnip',
      additive: { hp: 75, rp: 15, vit: 20, crit: 0.2 },
      multipliers: { hp: 0.05, rp: 0.1, str: 0.15 },
      resistances: { light: 0.25, crit: 0.15, psn: 0.2 },
      statusAttacks: { faint: 0.3 },
    };

    const build = createDefaultCrafterBuild(data);
    build.food.baseId = 'item-glitter-sashimi';
    build.food.recipe[0] = selection('item-glitter-snapper', 1);
    build.food.recipe[1] = selection('item-golden-turnip');
    build.food.recipe[2] = selection('item-golden-turnip');
    build.food.recipe[3] = selection('item-golden-turnip');
    build.food.recipe[4] = selection('item-golden-turnip');
    build.food.recipe[5] = selection('item-golden-turnip');

    const result = calculateCrafterBuild(build, items, data);

    expect(result.foodSummary.totalLevel).toBe(51);
    expect(result.foodSummary.finalLevel).toBe(8);
    expect(result.foodSummary.healing.hp).toBeCloseTo(2375, 6);
    expect(result.foodSummary.healing.hpPercent).toBeCloseTo(1.2875, 6);
    expect(result.foodSummary.healing.rp).toBeCloseTo(490, 6);
    expect(result.foodSummary.healing.rpPercent).toBeCloseTo(1.01875, 6);
    expect(result.foodSummary.stats.additive.str).toBeCloseTo(281.25, 6);
    expect(result.foodSummary.stats.additive.int).toBeCloseTo(30, 6);
    expect(result.foodSummary.stats.additive.vit).toBeCloseTo(100, 6);
    expect(result.foodSummary.stats.additive.crit).toBeCloseTo(1, 6);
    expect(result.foodSummary.stats.multipliers.str).toBeCloseTo(1.125, 6);
    expect(result.foodSummary.stats.multipliers.vit).toBeCloseTo(0.3, 6);
    expect(result.foodSummary.resistances.fire).toBeCloseTo(0.375, 6);
    expect(result.foodSummary.resistances.water).toBeCloseTo(0.15, 6);
    expect(result.foodSummary.resistances.light).toBeCloseTo(1, 6);
    expect(result.foodSummary.resistances.crit).toBeCloseTo(1, 6);
    expect(result.foodSummary.resistances.knock).toBeCloseTo(0.2, 6);
    expect(result.foodSummary.resistances.psn).toBeCloseTo(1, 6);
    expect(result.foodSummary.resistances.seal).toBeCloseTo(0.15, 6);
    expect(result.foodSummary.statusAttacks.psn).toBeCloseTo(0.1875, 6);
    expect(result.foodSummary.statusAttacks.seal).toBeCloseTo(0.2, 6);
    expect(result.foodSummary.statusAttacks.faint).toBeCloseTo(1, 6);
    expect(result.totalStats.crit).toBeCloseTo(1, 6);
    expect(result.resistances.light).toBeCloseTo(1, 6);
    expect(result.resistances.crit).toBeCloseTo(1, 6);
    expect(result.resistances.psn).toBeCloseTo(1, 6);
    expect(result.statusAttacks.faint).toBeCloseTo(1, 6);
  });

  it('applies the workbook overwrite branch for food ingredients that set overwrite', () => {
    const data = structuredClone(crafterData);
    data.food.baseStats['item-glitter-sashimi'] = {
      ...(data.food.baseStats['item-glitter-sashimi'] ?? { itemName: 'Glitter Sashimi', additive: {}, multipliers: {}, resistances: {}, statusAttacks: {} }),
      additive: { hp: 5000, rp: 1000, str: 150 },
      multipliers: { hp: 1.609863, rpMax: 0.5, str: 0.179932, int: 0.15, vit: 0.2 },
      resistances: { light: 0.5 },
      statusAttacks: { psn: 0.25 },
    };
    data.materials.food['item-broadsword'] = {
      itemName: 'Broadsword',
      additive: {},
      multipliers: {},
      resistances: {},
      statusAttacks: {},
      status: { status: 4000, overwrite: 1 },
    };

    const build = createDefaultCrafterBuild(data);
    build.food.baseId = 'item-glitter-sashimi';
    build.food.recipe[0] = selection('item-broadsword');

    const result = calculateCrafterBuild(build, items, data);

    expect(result.foodSummary.totalLevel).toBe(10);
    expect(result.foodSummary.finalLevel).toBe(10);
    expect(result.foodSummary.healing.hp).toBe(0);
    expect(result.foodSummary.healing.hpPercent).toBeCloseTo(-0.425, 6);
    expect(result.foodSummary.stats.additive.str ?? 0).toBe(0);
    expect(result.foodSummary.stats.multipliers.rpMax).toBeCloseTo(-0.2125, 6);
    expect(result.foodSummary.stats.multipliers.str).toBeCloseTo(-0.2125, 6);
    expect(result.foodSummary.stats.multipliers.int).toBeCloseTo(-0.2125, 6);
    expect(result.foodSummary.stats.multipliers.vit).toBeCloseTo(-0.2125, 6);
    expect(result.foodSummary.resistances.light ?? 0).toBe(0);
    expect(result.foodSummary.statusAttacks.psn ?? 0).toBe(0);
  });

  it('adds the dashboard status-res baseline of 49% before capping without mutating slot resistances', () => {
    const data = structuredClone(crafterData);
    data.stats.armor['item-royal-garter'] = {
      ...(data.stats.armor['item-royal-garter'] ?? { itemName: 'Royal Garter', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: {
        psn: 0.75,
        crit: 0.2,
        fire: 0.3,
      },
    };

    const build = createDefaultCrafterBuild(data);
    build.armor.appearanceId = 'item-royal-garter';
    build.armor.recipe[0] = selection('item-royal-garter');

    const result = calculateCrafterBuild(build, items, data);

    expect(result.slotResults.armor.resistances.psn).toBeCloseTo(0.75, 6);
    expect(result.slotResults.armor.resistances.seal ?? 0).toBeCloseTo(0, 6);
    expect(result.slotResults.armor.resistances.crit).toBeCloseTo(0.2, 6);
    expect(result.slotResults.armor.resistances.fire).toBeCloseTo(0.3, 6);

    expect(result.resistances.psn).toBeCloseTo(1, 6);
    expect(result.resistances.seal).toBeCloseTo(0.49, 6);
    expect(result.resistances.par).toBeCloseTo(0.49, 6);
    expect(result.resistances.slp).toBeCloseTo(0.49, 6);
    expect(result.resistances.ftg).toBeCloseTo(0.49, 6);
    expect(result.resistances.sick).toBeCloseTo(0.49, 6);
    expect(result.resistances.fnt).toBeCloseTo(0.49, 6);
    expect(result.resistances.crit).toBeCloseTo(0.2, 6);
    expect(result.resistances.knock ?? 0).toBeCloseTo(0, 6);
    expect(result.resistances.drain ?? 0).toBeCloseTo(0, 6);
    expect(result.resistances.fire).toBeCloseTo(0.3, 6);
  });

  it('keeps shield slot values raw while applying partial coverage only in the combined totals', () => {
    const data = structuredClone(crafterData);
    data.stats.weapon['item-claymore'] = {
      ...(data.stats.weapon['item-claymore'] ?? { itemName: 'Claymore', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      weaponClass: 'Long Sword',
      stats: { atk: 100 },
    };
    data.stats.armor['item-rune-shield'] = {
      ...(data.stats.armor['item-rune-shield'] ?? { itemName: 'Rune Shield', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      stats: { atk: 735, def: 80, crit: 0.25, knock: 0.5, stun: 0.75, diz: 12 },
      resistances: { light: 0.5 },
      statusAttacks: { seal: 0.4 },
    };
    data.shieldCoverageByWeaponClass['Long Sword'] = 'partial';

    const noShieldBuild = createDefaultCrafterBuild(data);
    noShieldBuild.weapon.appearanceId = 'item-claymore';
    noShieldBuild.weapon.recipe[0] = selection('item-claymore');

    const withShieldBuild = cloneBuild(noShieldBuild);
    withShieldBuild.shield.appearanceId = 'item-rune-shield';

    const noShield = calculateCrafterBuild(noShieldBuild, items, data);
    const withShield = calculateCrafterBuild(withShieldBuild, items, data);

    expect(withShield.shieldSummary.coverage).toBe('partial');
    expect(withShield.shieldSummary.factor).toBe(0.5);
    expect(withShield.slotResults.shield.stats.atk).toBeCloseTo(735, 6);
    expect(withShield.slotResults.shield.stats.crit).toBeCloseTo(0.25, 6);
    expect(withShield.slotResults.shield.stats.knock).toBeCloseTo(0.5, 6);
    expect(withShield.slotResults.shield.stats.stun).toBeCloseTo(0.75, 6);
    expect(withShield.slotResults.shield.resistances.light).toBeCloseTo(0.5, 6);
    expect(withShield.slotResults.shield.statusAttacks.seal).toBeCloseTo(0.4, 6);
    expect((withShield.equipmentStats.atk ?? 0) - (noShield.equipmentStats.atk ?? 0)).toBeCloseTo(367.5, 6);
    expect((withShield.equipmentStats.def ?? 0) - (noShield.equipmentStats.def ?? 0)).toBeCloseTo(
      (withShield.slotResults.shield.stats.def ?? 0) * 0.5,
      6,
    );
    expect((withShield.equipmentStats.crit ?? 0) - (noShield.equipmentStats.crit ?? 0)).toBeCloseTo(0.25, 6);
    expect((withShield.equipmentStats.knock ?? 0) - (noShield.equipmentStats.knock ?? 0)).toBeCloseTo(0.5, 6);
    expect((withShield.equipmentStats.stun ?? 0) - (noShield.equipmentStats.stun ?? 0)).toBeCloseTo(0.75, 6);
    expect((withShield.equipmentStats.diz ?? 0) - (noShield.equipmentStats.diz ?? 0)).toBeCloseTo(12, 6);
    expect((withShield.equipmentResistances.light ?? 0) - (noShield.equipmentResistances.light ?? 0)).toBeCloseTo(0.5, 6);
    expect((withShield.statusAttacks.seal ?? 0) - (noShield.statusAttacks.seal ?? 0)).toBeCloseTo(0.4, 6);
  });

  it('caps resistances and status attacks only for weapon and shoes, not for other slots or aggregated totals', () => {
    const data = structuredClone(crafterData);
    data.stats.weapon['item-broadsword'] = {
      ...(data.stats.weapon['item-broadsword'] ?? { itemName: 'Broadsword', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: { fire: 0.8, light: 0.7, crit: 0.75 },
      statusAttacks: { psn: 0.6, seal: 0.55 },
    };
    data.stats.armor['item-heavy-boots'] = {
      ...(data.stats.armor['item-heavy-boots'] ?? { itemName: 'Heavy Boots', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: { fire: 0.9, light: 0.65, crit: 0.8 },
      statusAttacks: { psn: 0.55, seal: 0.65 },
    };
    data.stats.armor['item-royal-garter'] = {
      ...(data.stats.armor['item-royal-garter'] ?? { itemName: 'Royal Garter', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: { fire: 0.85, light: 0.9, crit: 0.9 },
      statusAttacks: { psn: 0.75, seal: 0.8 },
    };
    data.materials.weapon['item-firewyrm-scale'] = {
      ...(data.materials.weapon['item-firewyrm-scale'] ?? { itemName: 'Firewyrm Scale', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: { fire: 0.55, light: 0.45, crit: 0.5 },
      statusAttacks: { psn: 0.7, seal: 0.65 },
    };
    data.materials.armor['item-firewyrm-scale'] = {
      ...(data.materials.armor['item-firewyrm-scale'] ?? { itemName: 'Firewyrm Scale', stats: {}, resistances: {}, statusAttacks: {}, geometry: {}, rarity: 0 }),
      resistances: { fire: 0.45, light: 0.35, crit: 0.4 },
      statusAttacks: { psn: 0.55, seal: 0.5 },
    };

    const build = createDefaultCrafterBuild(data);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.upgrades[0] = selection('item-firewyrm-scale');
    build.shoes.appearanceId = 'item-heavy-boots';
    build.shoes.upgrades[0] = selection('item-firewyrm-scale');
    build.armor.appearanceId = 'item-royal-garter';
    build.armor.upgrades[0] = selection('item-firewyrm-scale');

    const result = calculateCrafterBuild(build, items, data);

    expect(result.slotResults.weapon.resistances.fire).toBeCloseTo(1, 6);
    expect(result.slotResults.weapon.resistances.light).toBeCloseTo(1, 6);
    expect(result.slotResults.weapon.resistances.crit).toBeCloseTo(1, 6);
    expect(result.slotResults.weapon.statusAttacks.psn).toBeCloseTo(1, 6);
    expect(result.slotResults.weapon.statusAttacks.seal).toBeCloseTo(1, 6);

    expect(result.slotResults.shoes.resistances.fire).toBeCloseTo(1, 6);
    expect(result.slotResults.shoes.resistances.light).toBeCloseTo(1, 6);
    expect(result.slotResults.shoes.resistances.crit).toBeCloseTo(1, 6);
    expect(result.slotResults.shoes.statusAttacks.psn).toBeCloseTo(1, 6);
    expect(result.slotResults.shoes.statusAttacks.seal).toBeCloseTo(1, 6);

    expect(result.slotResults.armor.resistances.fire).toBeCloseTo(1.3, 6);
    expect(result.slotResults.armor.resistances.light).toBeCloseTo(1.25, 6);
    expect(result.slotResults.armor.resistances.crit).toBeCloseTo(1.3, 6);
    expect(result.slotResults.armor.statusAttacks.psn).toBeCloseTo(1.3, 6);
    expect(result.slotResults.armor.statusAttacks.seal).toBeCloseTo(1.3, 6);

    expect(result.equipmentResistances.fire).toBeCloseTo(3.3, 6);
    expect(result.equipmentResistances.light).toBeCloseTo(3.25, 6);
    expect(result.equipmentResistances.crit).toBeCloseTo(3.3, 6);
    expect(result.statusAttacks.psn).toBeCloseTo(3.3, 6);
    expect(result.statusAttacks.seal).toBeCloseTo(3.3, 6);
  });

  it('uses appearance for recipe defaults and derives the actual base from the single recipe craft item', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');

    const result = calculateCrafterBuild(build, items, crafterData);

    expect(result.build.weapon.appearanceId).toBe('item-broadsword');
    expect(result.build.weapon.baseId).toBe('item-broadsword');
    expect(result.slotResults.weapon.appearanceName).toBe('Broadsword');
    expect(result.slotResults.weapon.baseName).toBe('Broadsword');
    expect(result.slotResults.weapon.recipeIngredients).toEqual(['Broadsword']);
  });

  it('keeps Turnip Heaven as a normal selectable item with its real rarity', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.recipe[1] = selection('item-turnip-heaven');

    const result = calculateCrafterBuild(build, items, crafterData);
    const turnipContribution = result.slotResults.weapon.materialContributions.find(
      (entry) => entry.source === 'recipe' && entry.itemId === 'item-turnip-heaven',
    );

    expect(turnipContribution).toBeDefined();
    expect(turnipContribution?.itemName).toBe('Turnip Heaven');
    expect(turnipContribution?.rarity ?? 0).toBe(15);
  });

  it('counts rarity from recipe and upgrades only, ignoring the equipped appearance item rarity', () => {
    const data = structuredClone(crafterData);
    data.recipes.equipment.weapon['item-broadsword'] = {
      station: 'Short Sword',
      materials: [],
    };
    data.recipes.equipment.weapon['item-heaven-asunder'] = {
      station: 'Long Sword',
      materials: [],
    };

    const lowRarityAppearance = createDefaultCrafterBuild(crafterData);
    lowRarityAppearance.weapon.appearanceId = 'item-broadsword';
    lowRarityAppearance.weapon.recipe[0] = selection('item-turnip-heaven');
    lowRarityAppearance.weapon.recipe[1] = selection('item-silver');
    for (let index = 2; index < lowRarityAppearance.weapon.recipe.length; index += 1) {
      lowRarityAppearance.weapon.recipe[index] = { itemId: '', level: 1 };
    }
    lowRarityAppearance.weapon.upgrades[0] = selection('item-firewyrm-scale');

    const highRarityAppearance = cloneBuild(lowRarityAppearance);
    highRarityAppearance.weapon.appearanceId = 'item-heaven-asunder';

    const lowAppearanceResult = calculateCrafterBuild(lowRarityAppearance, items, data);
    const highAppearanceResult = calculateCrafterBuild(highRarityAppearance, items, data);

    expect(lowAppearanceResult.slotResults.weapon.rarity).toBeGreaterThan(0);
    expect(lowAppearanceResult.slotResults.weapon.rarityBonusSummary.value).toBe(lowAppearanceResult.slotResults.weapon.rarity);
    expect(lowAppearanceResult.slotResults.weapon.rarityTier).toBeGreaterThanOrEqual(1);
    expect(highAppearanceResult.slotResults.weapon.rarity).toBe(lowAppearanceResult.slotResults.weapon.rarity);
    expect(highAppearanceResult.slotResults.weapon.rarityBonusSummary.value).toBe(
      lowAppearanceResult.slotResults.weapon.rarityBonusSummary.value,
    );
    expect(highAppearanceResult.slotResults.weapon.rarityTier).toBe(lowAppearanceResult.slotResults.weapon.rarityTier);
  });

  it('excludes the derived base recipe item from rarity totals while keeping other recipe materials counted', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.recipe[1] = selection('item-turnip-heaven');

    const result = calculateCrafterBuild(build, items, crafterData);
    const derivedBaseContribution = result.slotResults.weapon.materialContributions.find(
      (entry) => entry.source === 'recipe' && entry.itemId === 'item-broadsword',
    );
    const normalRecipeContribution = result.slotResults.weapon.materialContributions.find(
      (entry) => entry.source === 'recipe' && entry.itemId === 'item-turnip-heaven',
    );

    expect(result.build.weapon.baseId).toBe('item-broadsword');
    expect(derivedBaseContribution?.rarity).toBe(0);
    expect(normalRecipeContribution?.rarity).toBe(15);
    expect(result.slotResults.weapon.rarity).toBe(15);
  });

  it('adds a visible placeholder that contributes exactly 15 rarity and no other effects', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-broadsword');
    build.weapon.recipe[1] = selection(CRAFTER_RARITY_PLACEHOLDER_ID);

    const result = calculateCrafterBuild(build, items, crafterData);
    const placeholderContribution = result.slotResults.weapon.materialContributions.find(
      (entry) => entry.source === 'recipe' && entry.itemId === CRAFTER_RARITY_PLACEHOLDER_ID,
    );

    expect(placeholderContribution).toBeDefined();
    expect(placeholderContribution?.rarity).toBe(15);
    expect(placeholderContribution?.stats).toEqual({});
    expect(placeholderContribution?.resistances).toEqual({});
    expect(placeholderContribution?.statusAttacks).toEqual({});
    expect(placeholderContribution?.geometry).toEqual({});
  });

  it('allows cross-class weapon bases only when Light Ore is present in the recipe', () => {
    const build = createDefaultCrafterBuild(crafterData);
    build.weapon.appearanceId = 'item-broadsword';
    build.weapon.recipe[0] = selection('item-claymore');

    const withoutLightOre = calculateCrafterBuild(build, items, crafterData);
    expect(withoutLightOre.build.weapon.baseId).toBeUndefined();
    expect(withoutLightOre.slotResults.weapon.baseName).toBeUndefined();

    build.weapon.recipe[1] = selection('item-light-ore');
    const withLightOre = calculateCrafterBuild(build, items, crafterData);

    expect(withLightOre.build.weapon.baseId).toBe('item-claymore');
    expect(withLightOre.slotResults.weapon.baseName).toBe('Claymore');
    expect(withLightOre.attackSummary.weaponClass).toBe('Long Sword');
  });
});
