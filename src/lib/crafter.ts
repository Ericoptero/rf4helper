import type {
  CrafterData,
  CrafterDefaults,
  CrafterMaterialSelection,
  CrafterSlotKey,
  CrafterWarning,
  Item,
} from './schemas';

export type CrafterBuildState = CrafterDefaults;

type CrafterStatBlock = Partial<NonNullable<Item['stats']>>;
type ResistanceMap = Record<string, number>;

export type CrafterContribution = {
  itemId: string;
  itemName: string;
  source: 'base' | 'inherit' | 'upgrade' | 'food' | 'foodIngredient' | 'bonus';
  behavior?: string;
  level: number;
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
};

export type CrafterSlotResult = {
  slot: CrafterSlotKey;
  label: string;
  appearanceName?: string;
  baseName?: string;
  recipeIngredients: string[];
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
  materialContributions: CrafterContribution[];
};

export type CrafterBonusSummary = {
  value: number;
  tier: number;
  overflow: number;
  label: string;
  stats: CrafterStatBlock;
};

export type CrafterCalculation = {
  build: CrafterBuildState;
  slotResults: Record<CrafterSlotKey, CrafterSlotResult>;
  equipmentStats: CrafterStatBlock;
  foodSummary: {
    additive: CrafterStatBlock;
    multipliers: CrafterStatBlock;
  };
  totalStats: CrafterStatBlock;
  resistances: ResistanceMap;
  warnings: CrafterWarning[];
  bonusSummary: {
    level: CrafterBonusSummary;
    rarity: CrafterBonusSummary;
  };
  shieldSummary: {
    coverage: 'full' | 'partial' | 'none';
    factor: number;
  };
  attackSummary: {
    weaponClass: string;
    chargeAttack: string;
  };
  craftSteps: string[];
};

const SLOT_KEYS: CrafterSlotKey[] = ['weapon', 'armor', 'headgear', 'shield', 'accessory', 'shoes'];

const STAT_KEYS = [
  'hp',
  'rp',
  'hpMax',
  'rpMax',
  'atk',
  'def',
  'matk',
  'mdef',
  'str',
  'vit',
  'int',
  'crit',
  'diz',
  'drain',
  'stun',
  'knock',
] as const;

function cloneSelection(selection?: CrafterMaterialSelection): CrafterMaterialSelection {
  return {
    itemId: selection?.itemId,
    level: selection?.level ?? 10,
  };
}

function padSelections(
  selections: CrafterMaterialSelection[] | undefined,
  count: number,
): CrafterMaterialSelection[] {
  return Array.from({ length: count }, (_, index) => cloneSelection(selections?.[index]));
}

export function createDefaultCrafterBuild(data: CrafterData): CrafterBuildState {
  const build = structuredClone(data.defaults) as CrafterBuildState;

  for (const slot of data.slotConfigs) {
    const current = build[slot.key];
    current.inherits = padSelections(current.inherits, slot.inheritSlots);
    current.upgrades = padSelections(current.upgrades, slot.upgradeSlots);
  }

  build.food.ingredients = padSelections(build.food.ingredients, 6);
  return build;
}

export function deserializeCrafterBuild(
  serialized: string | undefined,
  data: CrafterData,
): CrafterBuildState {
  const fallback = createDefaultCrafterBuild(data);
  if (!serialized) return fallback;

  try {
    let parsed: Partial<CrafterBuildState> | undefined;
    let candidate = serialized;
    for (let attempt = 0; attempt < 3 && !parsed; attempt += 1) {
      try {
        parsed = JSON.parse(candidate) as Partial<CrafterBuildState>;
      } catch {
        candidate = decodeURIComponent(candidate);
      }
    }
    if (!parsed) return fallback;
    const merged = structuredClone(fallback);

    for (const slot of SLOT_KEYS) {
      const incoming = parsed[slot];
      if (!incoming) continue;
      merged[slot].appearanceId = incoming.appearanceId ?? merged[slot].appearanceId;
      merged[slot].baseId = incoming.baseId ?? merged[slot].baseId;
      merged[slot].inherits = padSelections(incoming.inherits, merged[slot].inherits.length);
      merged[slot].upgrades = padSelections(incoming.upgrades, merged[slot].upgrades.length);
    }

    if (parsed.food) {
      merged.food.baseId = parsed.food.baseId ?? merged.food.baseId;
      merged.food.ingredients = padSelections(parsed.food.ingredients, merged.food.ingredients.length);
    }

    return merged;
  } catch {
    return fallback;
  }
}

export function serializeCrafterBuild(build: CrafterBuildState): string {
  return JSON.stringify(build);
}

function emptyStats(): CrafterStatBlock {
  return {};
}

function cloneStats(stats?: CrafterStatBlock): CrafterStatBlock {
  return { ...(stats ?? {}) };
}

function addStats(target: CrafterStatBlock, source?: CrafterStatBlock, scale = 1) {
  if (!source) return;
  for (const key of STAT_KEYS) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

function mergeResistance(target: ResistanceMap, key: string, value: number) {
  target[key] = (target[key] ?? 0) + value;
}

function addResistances(target: ResistanceMap, source?: ResistanceMap, scale = 1) {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    mergeResistance(target, key, value * scale);
  }
}

function scaleStats(source: CrafterStatBlock, scale: number): CrafterStatBlock {
  const next = emptyStats();
  addStats(next, source, scale);
  return next;
}

function scaleResistances(source: ResistanceMap, scale: number): ResistanceMap {
  const next: ResistanceMap = {};
  addResistances(next, source, scale);
  return next;
}

function getItemContribution(item?: Item): { stats: CrafterStatBlock; resistances: ResistanceMap } {
  const stats = cloneStats(item?.stats);
  const resistances: ResistanceMap = {};

  for (const effect of item?.effects ?? []) {
    if (effect.type === 'resistance') {
      mergeResistance(resistances, effect.target, effect.value / 100);
    }
  }

  return { stats, resistances };
}

function getPrimaryCraft(item?: Item) {
  return item?.craft?.[0];
}

function getWeaponClass(item: Item | undefined, data: CrafterData): string {
  const station = getPrimaryCraft(item)?.station;
  if (!station) return 'Unknown';
  return data.weaponClassByStation[station] ?? station;
}

function getTier(value: number, tiers: CrafterData['levelBonusTiers']): CrafterBonusSummary {
  const sorted = [...tiers].sort((left, right) => left.threshold - right.threshold);
  let active = sorted[0] ?? { threshold: 0, tier: 0, label: '', stats: {} };
  for (const tier of sorted) {
    if (value >= tier.threshold) active = tier;
  }

  const nextThreshold = sorted.find((tier) => tier.threshold > active.threshold)?.threshold;
  const overflow = nextThreshold == null ? Math.max(0, value - active.threshold) : value - active.threshold;

  return {
    value,
    tier: active.tier,
    overflow,
    label: active.label,
    stats: cloneStats(active.stats),
  };
}

function normalizeMaterialLevel(level?: number) {
  return Math.max(1, Math.min(10, level ?? 10));
}

function getRecipeIngredientNames(item: Item | undefined, items: Record<string, Item>) {
  return (getPrimaryCraft(item)?.ingredients ?? []).map((ingredientId) => items[ingredientId]?.name ?? ingredientId);
}

function describeMaterial(selection: CrafterMaterialSelection, items: Record<string, Item>) {
  if (!selection.itemId) return undefined;
  return `${items[selection.itemId]?.name ?? selection.itemId} Lv.${normalizeMaterialLevel(selection.level)}`;
}

function joinCraftSteps(itemName: string | undefined, materials: string[], prefix: string) {
  if (!itemName) return undefined;
  if (!materials.length) return `${prefix} ${itemName}.`;
  return `${prefix} ${itemName} using ${materials.join(', ')}.`;
}

export function calculateCrafterBuild(
  build: CrafterBuildState,
  items: Record<string, Item>,
  data: CrafterData,
): CrafterCalculation {
  const warnings: CrafterWarning[] = [];
  const slotResults = {} as Record<CrafterSlotKey, CrafterSlotResult>;
  const equipmentStats = emptyStats();
  const totalResistances: ResistanceMap = {};
  const craftSteps: string[] = [];
  const specialRuleMap = new Map(data.specialMaterialRules.map((rule) => [rule.itemId, rule.behavior]));
  let levelValue = 0;
  let rarityValue = 0;

  for (const slotConfig of data.slotConfigs) {
    const selection = build[slotConfig.key];
    const appearanceItem = selection.appearanceId ? items[selection.appearanceId] : undefined;
    const baseItem = selection.baseId ? items[selection.baseId] : appearanceItem;
    const baseContribution = getItemContribution(baseItem);
    const slotStats = cloneStats(baseContribution.stats);
    const slotResistances: ResistanceMap = { ...baseContribution.resistances };
    const materialContributions: CrafterContribution[] = [];
    const recipeSource = appearanceItem ?? baseItem;
    const recipeIngredients = getRecipeIngredientNames(recipeSource, items);

    addStats(equipmentStats, baseContribution.stats);
    addResistances(totalResistances, baseContribution.resistances);

    levelValue += normalizeMaterialLevel(getPrimaryCraft(baseItem)?.level ?? 1);
    rarityValue += baseItem?.rarityPoints ?? 0;

    let invertSign = 1;
    let previousRegular: CrafterContribution | undefined;
    const repeatCounts = new Map<string, number>();

    const pushContribution = (contribution: CrafterContribution) => {
      materialContributions.push(contribution);
      addStats(slotStats, contribution.stats);
      addResistances(slotResistances, contribution.resistances);
      addStats(equipmentStats, contribution.stats);
      addResistances(totalResistances, contribution.resistances);
    };

    const processMaterial = (source: 'inherit' | 'upgrade', material: CrafterMaterialSelection) => {
      if (!material.itemId) return;
      const item = items[material.itemId];
      const rule = specialRuleMap.get(material.itemId);
      const level = normalizeMaterialLevel(material.level);
      levelValue += level;
      rarityValue += item?.rarityPoints ?? 0;

      if (rule === 'invert') {
        invertSign *= -1;
        materialContributions.push({
          itemId: material.itemId,
          itemName: item?.name ?? material.itemId,
          source,
          behavior: 'invert',
          level,
          stats: {},
          resistances: {},
        });
        return;
      }

      if (rule === 'lightOre') {
        if (
          slotConfig.key === 'weapon' &&
          appearanceItem &&
          baseItem &&
          getWeaponClass(appearanceItem, data) !== getWeaponClass(baseItem, data)
        ) {
          warnings.push({
            code: 'light-ore-weapon-mismatch',
            severity: 'warning',
            slot: 'weapon',
            message: 'Light Ore can only safely copy between matching weapon classes.',
          });
        }
        materialContributions.push({
          itemId: material.itemId,
          itemName: item?.name ?? material.itemId,
          source,
          behavior: 'lightOre',
          level,
          stats: {},
          resistances: {},
        });
        return;
      }

      if ((rule === 'doublePrevious' || rule === 'tenFoldPrevious') && previousRegular) {
        const factor = rule === 'doublePrevious' ? 2 : 8;
        const contribution: CrafterContribution = {
          itemId: material.itemId,
          itemName: item?.name ?? material.itemId,
          source,
          behavior: rule,
          level,
          stats: scaleStats(previousRegular.stats, factor),
          resistances: scaleResistances(previousRegular.resistances, factor),
        };
        pushContribution(contribution);
        return;
      }

      const base = getItemContribution(item);
      const repeatCount = repeatCounts.get(material.itemId) ?? 0;
      const repeatFactor = source === 'upgrade' ? 1 / 2 ** repeatCount : 1;
      repeatCounts.set(material.itemId, repeatCount + 1);
      const levelFactor = level / 10;
      const totalFactor = invertSign * repeatFactor * levelFactor;

      const contribution: CrafterContribution = {
        itemId: material.itemId,
        itemName: item?.name ?? material.itemId,
        source,
        level,
        stats: scaleStats(base.stats, totalFactor),
        resistances: scaleResistances(base.resistances, totalFactor),
      };
      pushContribution(contribution);
      previousRegular = contribution;
    };

    selection.inherits.forEach((material) => processMaterial('inherit', material));
    selection.upgrades.forEach((material) => processMaterial('upgrade', material));

    slotResults[slotConfig.key] = {
      slot: slotConfig.key,
      label: slotConfig.label,
      appearanceName: appearanceItem?.name,
      baseName: baseItem?.name,
      recipeIngredients,
      stats: slotStats,
      resistances: slotResistances,
      materialContributions,
    };

    const inheritNames = selection.inherits
      .map((material) => describeMaterial(material, items))
      .filter(Boolean) as string[];
    const upgradeNames = selection.upgrades
      .map((material) => describeMaterial(material, items))
      .filter(Boolean) as string[];

    const craftLine = joinCraftSteps(appearanceItem?.name ?? baseItem?.name, recipeIngredients, 'Craft');
    if (craftLine) craftSteps.push(craftLine);
    if (inheritNames.length) {
      craftSteps.push(`Inherit into ${appearanceItem?.name ?? baseItem?.name}: ${inheritNames.join(', ')}.`);
    }
    if (upgradeNames.length) {
      craftSteps.push(`Upgrade ${appearanceItem?.name ?? baseItem?.name} with ${upgradeNames.join(', ')}.`);
    }
  }

  const weaponItem = build.weapon.baseId ? items[build.weapon.baseId] : undefined;
  const weaponClass = getWeaponClass(weaponItem, data);
  const shieldCoverage = data.shieldCoverageByWeaponClass[weaponClass] ?? 'full';
  const shieldFactor = shieldCoverage === 'full' ? 1 : shieldCoverage === 'partial' ? 0.5 : 0;
  if (shieldFactor !== 1) {
    const shieldResult = slotResults.shield;
    const currentShieldStats = cloneStats(shieldResult.stats);
    const currentShieldResistances = { ...shieldResult.resistances };
    addStats(equipmentStats, currentShieldStats, shieldFactor - 1);
    addResistances(totalResistances, currentShieldResistances, shieldFactor - 1);
    shieldResult.stats = scaleStats(currentShieldStats, shieldFactor);
    shieldResult.resistances = scaleResistances(currentShieldResistances, shieldFactor);
  }

  const levelBonus = getTier(levelValue, data.levelBonusTiers);
  const rarityBonus = getTier(rarityValue, data.rarityBonusTiers);
  addStats(equipmentStats, levelBonus.stats);
  addStats(equipmentStats, rarityBonus.stats);

  const foodItem = build.food.baseId ? items[build.food.baseId] : undefined;
  const foodBase = getItemContribution(foodItem);
  const foodAdditive = cloneStats(foodBase.stats);
  const foodMultipliers = emptyStats();
  const foodResistance = { ...foodBase.resistances };

  for (const ingredient of build.food.ingredients) {
    if (!ingredient.itemId) continue;
    const item = items[ingredient.itemId];
    const contribution = getItemContribution(item);
    addStats(foodAdditive, contribution.stats);
    addResistances(foodResistance, contribution.resistances);

    const override = data.foodOverrides[ingredient.itemId];
    addStats(foodAdditive, override?.additive);
    addStats(foodMultipliers, override?.multipliers);
  }

  const totalStats = cloneStats(equipmentStats);
  addStats(totalStats, foodAdditive);
  for (const key of STAT_KEYS) {
    const multiplier = foodMultipliers[key];
    if (multiplier == null || multiplier === 0) continue;
    totalStats[key] = (totalStats[key] ?? 0) * (1 + multiplier);
  }
  addResistances(totalResistances, foodResistance);

  if (foodItem?.name) {
    const ingredientNames = build.food.ingredients
      .map((ingredient) => describeMaterial(ingredient, items))
      .filter(Boolean) as string[];
    craftSteps.push(
      joinCraftSteps(foodItem.name, ingredientNames, 'Cook') ?? `Cook ${foodItem.name}.`,
    );
  }
  if (levelBonus.label) {
    craftSteps.push(`Barrett level assessment: ${levelBonus.label}`);
  }
  if (rarityBonus.label) {
    craftSteps.push(`Barrett rarity assessment: ${rarityBonus.label}`);
  }

  let chargeAttack = data.chargeAttackByWeaponClass[weaponClass] ?? 'Standard Attack';
  if (weaponClass === 'Staff') {
    const crystal = build.weapon.inherits.find((material) => material.itemId && data.staffChargeByCrystalId[material.itemId]);
    if (crystal?.itemId) {
      chargeAttack = `${chargeAttack} / ${data.staffChargeByCrystalId[crystal.itemId]}`;
    }
  }

  return {
    build,
    slotResults,
    equipmentStats,
    foodSummary: {
      additive: foodAdditive,
      multipliers: foodMultipliers,
    },
    totalStats,
    resistances: totalResistances,
    warnings,
    bonusSummary: {
      level: levelBonus,
      rarity: rarityBonus,
    },
    shieldSummary: {
      coverage: shieldCoverage,
      factor: shieldFactor,
    },
    attackSummary: {
      weaponClass,
      chargeAttack,
    },
    craftSteps,
  };
}
