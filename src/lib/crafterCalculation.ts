import type {
  CrafterCalculation,
  CrafterContribution,
  CrafterSlotResult,
} from './crafter';
import {
  addNumericRecord,
  capNumericRecord,
  cloneNumericRecord,
  COOKING_CAPPED_STAT_KEYS,
  createNumericRecord,
  DASHBOARD_STATUS_RES_BASELINE_KEYS,
  FOOD_RECIPE_SLOTS,
  GEOMETRY_KEYS,
  MULTIPLIER_STAT_KEYS,
  RESISTANCE_KEYS,
  scaleNumericRecord,
  SHIELD_PARTIAL_SCALING_STAT_KEYS,
  SLOT_KEYS,
  STAT_KEYS,
  STATUS_ATTACK_KEYS,
  type CrafterBuild,
  type CrafterStatBlock,
  type GeometryMap,
  type ResistanceMap,
  type StatusAttackMap,
} from './crafterMath';
import {
  getDerivedRecipeBase,
  getEquipmentPayload,
  getFoodBasePayload,
  getFoodIngredientPayload,
  getItemName,
  getMaterialPayload,
  getMaterialRarity,
  getWeaponClass,
} from './crafterCommon';
import { buildCraftStepsForSlot } from './crafterCraftSteps';
import { itemMatchesCrafterSlot } from './crafterData';
import {
  shouldCountForRarityBonus,
  type CrafterRarityContributionSource,
} from './crafterRarity';
import {
  applyDefaultRecipeSelections,
  getFoodRecipeDefinition,
  getRecipeDefinition,
  getSlotConfigByKey,
  normalizeMaterialLevel,
} from './crafterRecipeSelections';
import { normalizeCrafterBuild } from './crafterSerialization';
import type {
  CrafterBonusSummary,
  CrafterData,
  CrafterFoodPayload,
  CrafterMaterialSelection,
  CrafterSlotConfig,
  CrafterSlotKey,
  CrafterWarning,
  Item,
} from './schemas';

type StaffChargeState = {
  lv1?: string;
  lv2?: string;
  lv3?: string;
  maxCharge?: number;
  speed?: number;
};

type CrafterCalculationContext = {
  slotConfigByKey: Record<CrafterSlotKey, CrafterSlotConfig>;
  specialRuleMap: Map<string, string>;
};

const DASHBOARD_STATUS_RES_BASELINE_VALUE = 0.49;
const FOOD_OVERWRITE_BASE_PAYLOAD: CrafterFoodPayload = {
  itemName: 'Overwrite',
  additive: {},
  multipliers: {
    hp: -0.2,
    rpMax: -0.1,
    str: -0.1,
    int: -0.1,
    vit: -0.1,
  },
  resistances: {},
  statusAttacks: {},
};

function getAppearanceId(slotKey: CrafterSlotKey, build: CrafterBuild) {
  return build[slotKey].appearanceId;
}

function getTier(value: number, tiers: CrafterData['levelBonusTiers']): CrafterBonusSummary {
  let active = tiers[0] ?? { threshold: 0, tier: 0, label: '', stats: {} };

  for (const tier of tiers) {
    if (value >= tier.threshold) active = tier;
  }

  const currentThreshold = active.threshold;
  const nextThreshold = tiers.find((tier) => tier.threshold > active.threshold)?.threshold;
  const overflow = nextThreshold == null ? Math.max(0, value - currentThreshold) : value - currentThreshold;
  const remainingToNext = nextThreshold == null ? 0 : Math.max(0, nextThreshold - value);
  const range = nextThreshold == null ? 0 : nextThreshold - currentThreshold;
  const progressRatio =
    nextThreshold == null ? 1 : range <= 0 ? 0 : Math.min(1, Math.max(0, (value - currentThreshold) / range));

  return {
    value,
    tier: active.tier,
    overflow,
    label: active.label,
    stats: cloneNumericRecord(active.stats) as CrafterStatBlock,
    currentThreshold,
    nextThreshold,
    remainingToNext,
    isMaxTier: nextThreshold == null,
    progressRatio,
  };
}

function addEffect(effects: string[], effect: string | undefined) {
  if (!effect) return;
  if (!effects.includes(effect)) effects.push(effect);
}

function payloadToContribution(
  itemId: string,
  itemName: string,
  source: CrafterContribution['source'],
  level: number,
  rarity: number,
  payload: ReturnType<typeof getMaterialPayload>,
  scale = 1,
  behavior?: string,
  label?: string,
): CrafterContribution {
  return {
    itemId,
    itemName,
    source,
    behavior,
    label,
    level,
    rarity,
    stats: scaleNumericRecord(payload?.stats, STAT_KEYS, scale) as CrafterStatBlock,
    resistances: scaleNumericRecord(payload?.resistances, RESISTANCE_KEYS, scale) as ResistanceMap,
    statusAttacks: scaleNumericRecord(payload?.statusAttacks, STATUS_ATTACK_KEYS, scale) as StatusAttackMap,
    geometry: scaleNumericRecord(payload?.geometry, GEOMETRY_KEYS, scale) as GeometryMap,
  };
}

function foodPayloadScale(payload: CrafterFoodPayload | undefined, scale: number) {
  return {
    additive: scaleNumericRecord(payload?.additive, STAT_KEYS, scale) as CrafterStatBlock,
    multipliers: scaleNumericRecord(payload?.multipliers, STAT_KEYS, scale) as CrafterStatBlock,
    resistances: scaleNumericRecord(payload?.resistances, RESISTANCE_KEYS, scale) as ResistanceMap,
    statusAttacks: scaleNumericRecord(payload?.statusAttacks, STATUS_ATTACK_KEYS, scale) as StatusAttackMap,
  };
}

function addRarityBonus(
  slotConfig: CrafterSlotConfig,
  target: CrafterStatBlock,
  rarityBonus: CrafterBonusSummary,
  weaponClass: string,
) {
  if (slotConfig.key === 'weapon') {
    if (weaponClass === 'Staff') {
      target.matk = (target.matk ?? 0) + (rarityBonus.stats.matk ?? 0);
      return;
    }

    target.atk = (target.atk ?? 0) + (rarityBonus.stats.atk ?? 0);
    return;
  }

  const value =
    slotConfig.rarityBonusTarget === 'mdef'
      ? rarityBonus.stats.mdef ?? 0
      : rarityBonus.stats.def ?? 0;

  if (slotConfig.rarityBonusTarget === 'mdef') {
    target.mdef = (target.mdef ?? 0) + value;
    return;
  }

  target.def = (target.def ?? 0) + value;
}

function applyLevelBonus(slotConfig: CrafterSlotConfig, target: CrafterStatBlock, levelBonus: CrafterBonusSummary) {
  if (slotConfig.key === 'weapon') {
    target.atk = (target.atk ?? 0) + (levelBonus.stats.atk ?? 0);
    target.matk = (target.matk ?? 0) + (levelBonus.stats.matk ?? 0);
    return;
  }

  target.def = (target.def ?? 0) + (levelBonus.stats.def ?? 0);
  target.mdef = (target.mdef ?? 0) + (levelBonus.stats.mdef ?? 0);
}

function applyDashboardStatusResistanceBaseline(resistances: ResistanceMap) {
  const next = cloneNumericRecord(resistances) as ResistanceMap;

  for (const key of DASHBOARD_STATUS_RES_BASELINE_KEYS) {
    next[key] = Math.min((next[key] ?? 0) + DASHBOARD_STATUS_RES_BASELINE_VALUE, 1);
  }

  return next;
}

function deriveEffectiveStats(stats: CrafterStatBlock) {
  return {
    atk: (stats.atk ?? 0) + (stats.str ?? 0),
    matk: (stats.matk ?? 0) + (stats.int ?? 0),
    def: (stats.def ?? 0) + (stats.vit ?? 0) / 2,
    mdef: (stats.mdef ?? 0) + (stats.vit ?? 0) / 2,
  } satisfies CrafterStatBlock;
}

function clampWeaponGeometry(slotKey: CrafterSlotKey, geometry: GeometryMap) {
  if (slotKey !== 'weapon' || geometry.length == null) return geometry;
  return {
    ...geometry,
    length: Math.min(geometry.length, 4),
  };
}

function shouldCapSlotPercentages(slotKey: CrafterSlotKey) {
  return slotKey === 'weapon' || slotKey === 'shoes';
}

function scaleShieldAggregateStats(stats: CrafterStatBlock, factor: number) {
  const next = cloneNumericRecord(stats) as CrafterStatBlock;

  for (const key of SHIELD_PARTIAL_SCALING_STAT_KEYS) {
    if (next[key] == null) continue;
    next[key] = next[key]! * factor;
  }

  return next;
}

function createCalculationContext(data: CrafterData): CrafterCalculationContext {
  return {
    slotConfigByKey: getSlotConfigByKey(data),
    specialRuleMap: new Map(data.specialMaterialRules.map((rule) => [rule.itemId, rule.behavior])),
  };
}

function cloneChargeState(payload: CrafterData['staff']['chargeAttacks'][string] | undefined) {
  if (!payload) return undefined;
  return {
    lv1: payload.lv1,
    lv2: payload.lv2,
    lv3: payload.lv3,
    speed: payload.speed,
  } satisfies StaffChargeState;
}

function foodIngredientTriggersOverwrite(payload: CrafterFoodPayload | undefined) {
  return Boolean(payload?.status?.overwrite);
}

function areSelectionsEqual(
  left: CrafterMaterialSelection[] | undefined,
  right: CrafterMaterialSelection[] | undefined,
) {
  if (left === right) return true;
  if (!left || !right) return false;
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    if (left[index]?.itemId !== right[index]?.itemId) return false;
    if (normalizeMaterialLevel(left[index]?.level) !== normalizeMaterialLevel(right[index]?.level)) return false;
  }

  return true;
}

function areEquipmentSlotsEqual(left: CrafterBuild[CrafterSlotKey], right: CrafterBuild[CrafterSlotKey] | undefined) {
  if (!right) return false;

  return left.appearanceId === right.appearanceId
    && left.baseId === right.baseId
    && areSelectionsEqual(left.recipe, right.recipe)
    && areSelectionsEqual(left.inherits, right.inherits)
    && areSelectionsEqual(left.upgrades, right.upgrades);
}

export function calculateCrafterSlotResult(
  slotKey: CrafterSlotKey,
  build: CrafterBuild,
  items: Record<string, Item>,
  data: CrafterData,
  context = createCalculationContext(data),
): CrafterSlotResult {
  const slotConfig = context.slotConfigByKey[slotKey];
  const selection = build[slotKey];
  const appearanceId = getAppearanceId(slotKey, build);
  const { hasCraftCandidate } = getDerivedRecipeBase(
    slotKey,
    appearanceId,
    selection.recipe,
    items,
    data,
    slotConfig,
  );
  const baseId = selection.baseId ?? (!hasCraftCandidate ? appearanceId : undefined);
  const appearanceName = getItemName(
    appearanceId,
    items,
    (slotKey === 'weapon' ? data.stats.weapon[appearanceId ?? ''] : data.stats.armor[appearanceId ?? ''])?.itemName,
  );
  const baseName = getItemName(baseId, items, data.stats.armor[baseId ?? '']?.itemName);
  const recipeDefinition = getRecipeDefinition(slotKey, appearanceId, data);
  const recipeSelections = applyDefaultRecipeSelections(
    selection.recipe,
    recipeDefinition?.materials,
    slotConfig.recipeSlots,
  );

  const basePayload = getEquipmentPayload(slotKey, baseId, data);
  const slotStats = cloneNumericRecord(basePayload?.stats) as CrafterStatBlock;
  const slotResistances = cloneNumericRecord(basePayload?.resistances) as ResistanceMap;
  const slotStatusAttacks = cloneNumericRecord(basePayload?.statusAttacks) as StatusAttackMap;
  const slotGeometry = cloneNumericRecord(basePayload?.geometry) as GeometryMap;
  const effects: string[] = [];
  const materialContributions: CrafterContribution[] = [];

  if ((slotKey === 'accessory' || slotKey === 'shoes') && appearanceName) {
    addEffect(effects, appearanceName);
  }

  const recipeIngredients = recipeSelections
    .map((recipeSelection) => getItemName(recipeSelection.itemId, items))
    .filter((name): name is string => Boolean(name));

  const baseLevel = baseId ? Math.min(10, 1 + selection.upgrades.filter((material) => Boolean(material.itemId)).length) : 0;
  let levelBonusValue = 0;
  let rarityValue = 0;

  for (const material of recipeSelections) {
    if (!material.itemId) continue;

    const rarity = getMaterialRarity(slotKey, material.itemId, data);
    const effectiveRarity = itemMatchesCrafterSlot(items[material.itemId], slotConfig) ? 0 : rarity;
    levelBonusValue += normalizeMaterialLevel(material.level);

    if (shouldCountForRarityBonus('recipe')) {
      rarityValue += effectiveRarity;
    }

    materialContributions.push({
      itemId: material.itemId,
      itemName: getItemName(material.itemId, items)!,
      source: 'recipe',
      level: normalizeMaterialLevel(material.level),
      rarity: effectiveRarity,
      behavior: context.specialRuleMap.get(material.itemId),
      stats: createNumericRecord(),
      resistances: createNumericRecord(),
      statusAttacks: createNumericRecord(),
      geometry: createNumericRecord(),
    } satisfies CrafterContribution);
  }

  let invertSign = 1;
  const repeatCounts = new Map<string, number>();
  let previousRegularUpgrade: CrafterContribution | undefined;
  let previousUnsignedRegularUpgrade: CrafterContribution | undefined;

  const pushContribution = (contribution: CrafterContribution) => {
    materialContributions.push(contribution);
    addNumericRecord(slotStats, contribution.stats, STAT_KEYS);
    addNumericRecord(slotResistances, contribution.resistances, RESISTANCE_KEYS);
    addNumericRecord(slotStatusAttacks, contribution.statusAttacks, STATUS_ATTACK_KEYS);
    addNumericRecord(slotGeometry, contribution.geometry, GEOMETRY_KEYS);
  };

  const processMaterial = (source: CrafterRarityContributionSource, material: CrafterMaterialSelection) => {
    if (!material.itemId || (source !== 'inherit' && source !== 'upgrade')) return;

    const itemName = getItemName(material.itemId, items)!;
    const payload = getMaterialPayload(slotKey, material.itemId, data);
    const behavior = context.specialRuleMap.get(material.itemId);
    const level = normalizeMaterialLevel(material.level);
    const rarity = getMaterialRarity(slotKey, material.itemId, data);

    if (source === 'upgrade') {
      levelBonusValue += level;
    }

    if (shouldCountForRarityBonus(source)) {
      rarityValue += rarity;
    }

    if ((slotKey === 'accessory' || slotKey === 'shoes') && source === 'inherit' && data.bonusEffects[material.itemId]) {
      addEffect(effects, itemName);
      pushContribution({
        itemId: material.itemId,
        itemName,
        source,
        level,
        rarity,
        behavior: 'bonusEffect',
        stats: createNumericRecord(),
        resistances: createNumericRecord(),
        statusAttacks: createNumericRecord(),
        geometry: createNumericRecord(),
      } satisfies CrafterContribution);
      return;
    }

    if (behavior === 'invert') {
      invertSign *= -1;
      pushContribution({
        itemId: material.itemId,
        itemName,
        source,
        level,
        rarity,
        behavior,
        stats: createNumericRecord(),
        resistances: createNumericRecord(),
        statusAttacks: createNumericRecord(),
        geometry: createNumericRecord(),
      } satisfies CrafterContribution);
      return;
    }

    if (source === 'upgrade' && (behavior === 'doublePrevious' || behavior === 'tenFoldPrevious') && previousRegularUpgrade) {
      const factor = behavior === 'doublePrevious' ? 2 : 8;
      invertSign = 1;
      pushContribution({
        itemId: material.itemId,
        itemName,
        source,
        level,
        rarity,
        behavior,
        stats: scaleNumericRecord(previousUnsignedRegularUpgrade?.stats ?? previousRegularUpgrade.stats, STAT_KEYS, factor) as CrafterStatBlock,
        resistances: scaleNumericRecord(
          previousUnsignedRegularUpgrade?.resistances ?? previousRegularUpgrade.resistances,
          RESISTANCE_KEYS,
          factor,
        ) as ResistanceMap,
        statusAttacks: scaleNumericRecord(
          previousUnsignedRegularUpgrade?.statusAttacks ?? previousRegularUpgrade.statusAttacks,
          STATUS_ATTACK_KEYS,
          factor,
        ) as StatusAttackMap,
        geometry: scaleNumericRecord(
          previousUnsignedRegularUpgrade?.geometry ?? previousRegularUpgrade.geometry,
          GEOMETRY_KEYS,
          factor,
        ) as GeometryMap,
      });
      return;
    }

    const repeatCount = source === 'upgrade' ? (repeatCounts.get(material.itemId) ?? 0) : 0;
    const repeatFactor = source === 'upgrade' ? 1 / 2 ** repeatCount : 1;
    if (source === 'upgrade') {
      repeatCounts.set(material.itemId, repeatCount + 1);
    }

    const scale = invertSign * repeatFactor * (level / 10);
    const contribution = payloadToContribution(
      material.itemId,
      itemName,
      source,
      level,
      rarity,
      payload,
      scale,
    );
    pushContribution(contribution);

    if (source === 'upgrade') {
      previousRegularUpgrade = contribution;
      previousUnsignedRegularUpgrade = payloadToContribution(
        material.itemId,
        itemName,
        source,
        level,
        rarity,
        payload,
        level / 10,
      );
    }
  };

  selection.inherits.forEach((material) => processMaterial('inherit', material));
  selection.upgrades.forEach((material) => processMaterial('upgrade', material));

  if (
    slotKey !== 'weapon'
    && ['item-green-core', 'item-red-core', 'item-yellow-core', 'item-blue-core'].every((coreId) =>
      selection.upgrades.some((upgrade) => upgrade.itemId === coreId),
    )
  ) {
    slotResistances.no = (slotResistances.no ?? 0) + 0.1;
    materialContributions.push({
      itemId: 'core-bonus',
      itemName: 'Core Bonus',
      source: 'bonus',
      label: 'Core Bonus',
      level: 0,
      rarity: 0,
      stats: createNumericRecord(),
      resistances: { no: 0.1 },
      statusAttacks: createNumericRecord(),
      geometry: createNumericRecord(),
    } satisfies CrafterContribution);
  }

  const baseWeaponClass = getWeaponClass(baseId, items, data);
  const levelBonus = getTier(levelBonusValue, data.levelBonusTiers);
  const rarityBonus = getTier(rarityValue, data.rarityBonusTiers);
  applyLevelBonus(slotConfig, slotStats, levelBonus);
  addRarityBonus(slotConfig, slotStats, rarityBonus, baseWeaponClass);

  const attackType = slotKey === 'weapon' ? baseWeaponClass : undefined;
  const element = slotKey === 'weapon' ? basePayload?.element ?? 'None' : undefined;
  const damageType = slotKey === 'weapon' ? basePayload?.damageType ?? 'Physical' : undefined;

  const slotResult: CrafterSlotResult = {
    slot: slotKey,
    label: slotConfig.label,
    appearanceName,
    baseName,
    carrierName:
      slotKey === 'weapon'
        ? getItemName(data.starterWeaponByClass[baseWeaponClass] ?? undefined, items)
        : getItemName(slotConfig.carrierId ?? undefined, items),
    recipeIngredients,
    itemLevel: baseLevel,
    level: levelBonusValue,
    rarity: rarityValue,
    tier: rarityBonus.tier,
    levelTier: levelBonus.tier,
    rarityTier: rarityBonus.tier,
    levelBonusSummary: levelBonus,
    rarityBonusSummary: rarityBonus,
    stats: slotStats,
    resistances: shouldCapSlotPercentages(slotKey)
      ? capNumericRecord(slotResistances, RESISTANCE_KEYS) as ResistanceMap
      : cloneNumericRecord(slotResistances) as ResistanceMap,
    statusAttacks: shouldCapSlotPercentages(slotKey)
      ? capNumericRecord(slotStatusAttacks, STATUS_ATTACK_KEYS) as StatusAttackMap
      : cloneNumericRecord(slotStatusAttacks) as StatusAttackMap,
    geometry: clampWeaponGeometry(slotKey, slotGeometry),
    effects,
    attackType,
    element,
    damageType,
    materialContributions,
    craftSteps: [],
  };

  slotResult.craftSteps = buildCraftStepsForSlot(slotResult, slotConfig, data, items, baseWeaponClass);
  return slotResult;
}

export function calculateCrafterBuild(
  rawBuild: CrafterBuild,
  items: Record<string, Item>,
  data: CrafterData,
  previousCalculation?: CrafterCalculation,
): CrafterCalculation {
  const build = normalizeCrafterBuild(rawBuild, items, data);
  const context = createCalculationContext(data);
  const warnings: CrafterWarning[] = [];
  const slotResults = {} as Record<CrafterSlotKey, CrafterSlotResult>;
  const craftSteps: string[] = [];
  const previousBuild = previousCalculation?.build;

  for (const slotKey of SLOT_KEYS) {
    const previousSlotResult = previousCalculation?.slotResults[slotKey];
    const slotResult =
      previousSlotResult && previousBuild && areEquipmentSlotsEqual(build[slotKey], previousBuild[slotKey])
        ? previousSlotResult
        : calculateCrafterSlotResult(slotKey, build, items, data, context);

    craftSteps.push(...slotResult.craftSteps);
    slotResults[slotKey] = slotResult;
  }

  const weaponBaseId = slotResults.weapon.baseName ? build.weapon.baseId ?? build.weapon.appearanceId : build.weapon.appearanceId;
  const weaponClass = getWeaponClass(weaponBaseId, items, data);
  const shieldCoverage = data.shieldCoverageByWeaponClass[weaponClass] ?? 'full';
  const shieldFactor = shieldCoverage === 'full' ? 1 : shieldCoverage === 'partial' ? 0.5 : 0;

  const equipmentStats = createNumericRecord<(typeof STAT_KEYS)[number]>() as CrafterStatBlock;
  const equipmentResistances = createNumericRecord<(typeof RESISTANCE_KEYS)[number]>() as ResistanceMap;
  const equipmentStatusAttacks = createNumericRecord<(typeof STATUS_ATTACK_KEYS)[number]>() as StatusAttackMap;
  const equipmentGeometry = createNumericRecord<(typeof GEOMETRY_KEYS)[number]>() as GeometryMap;

  for (const slotKey of SLOT_KEYS) {
    const scaledStats =
      slotKey === 'shield'
        ? scaleShieldAggregateStats(slotResults[slotKey].stats, shieldFactor)
        : slotResults[slotKey].stats;

    addNumericRecord(equipmentStats, scaledStats, STAT_KEYS);
    addNumericRecord(equipmentResistances, slotResults[slotKey].resistances, RESISTANCE_KEYS);
    addNumericRecord(equipmentStatusAttacks, slotResults[slotKey].statusAttacks, STATUS_ATTACK_KEYS);
    addNumericRecord(equipmentGeometry, slotResults[slotKey].geometry, GEOMETRY_KEYS);
  }

  const foodRecipeDefinition = getFoodRecipeDefinition(build.food.baseId, data);
  const foodSelections = applyDefaultRecipeSelections(build.food.recipe, foodRecipeDefinition?.materials, FOOD_RECIPE_SLOTS);
  const actualFoodSelections = foodSelections.filter((selection) => selection.itemId);
  const foodTotalLevel = actualFoodSelections.reduce((sum, selection) => sum + normalizeMaterialLevel(selection.level), 0);
  const foodFinalLevel =
    actualFoodSelections.length === 0 ? 0 : Math.floor(foodTotalLevel / actualFoodSelections.length);
  const foodScale = actualFoodSelections.length === 0 ? 0 : (7 + foodFinalLevel) / 8;
  const foodBasePayload = getFoodBasePayload(build.food.baseId, data);
  const shouldOverwriteFoodBase = actualFoodSelections.some((selection) =>
    foodIngredientTriggersOverwrite(getFoodIngredientPayload(selection.itemId, data)),
  );
  const scaledFoodBase = foodPayloadScale(
    shouldOverwriteFoodBase ? FOOD_OVERWRITE_BASE_PAYLOAD : foodBasePayload,
    foodScale,
  );
  const foodAdditive = cloneNumericRecord(scaledFoodBase.additive) as CrafterStatBlock;
  const foodMultipliers = cloneNumericRecord(scaledFoodBase.multipliers) as CrafterStatBlock;
  const foodResistances = cloneNumericRecord(scaledFoodBase.resistances) as ResistanceMap;
  const foodStatusAttacks = cloneNumericRecord(scaledFoodBase.statusAttacks) as StatusAttackMap;

  for (const ingredient of actualFoodSelections) {
    const payload = getFoodIngredientPayload(ingredient.itemId, data);
    addNumericRecord(foodAdditive, payload?.additive, STAT_KEYS);
    addNumericRecord(foodMultipliers, payload?.multipliers, STAT_KEYS);
    addNumericRecord(foodResistances, payload?.resistances, RESISTANCE_KEYS);
    addNumericRecord(foodStatusAttacks, payload?.statusAttacks, STATUS_ATTACK_KEYS);
  }

  const cappedFoodAdditive = capNumericRecord(foodAdditive, COOKING_CAPPED_STAT_KEYS) as CrafterStatBlock;
  const cappedFoodResistances = capNumericRecord(foodResistances, RESISTANCE_KEYS) as ResistanceMap;
  const cappedFoodStatusAttacks = capNumericRecord(foodStatusAttacks, STATUS_ATTACK_KEYS) as StatusAttackMap;

  const totalStats = cloneNumericRecord(equipmentStats) as CrafterStatBlock;
  addNumericRecord(totalStats, cappedFoodAdditive, STAT_KEYS);

  for (const key of MULTIPLIER_STAT_KEYS) {
    const multiplier = foodMultipliers[key];
    if (multiplier == null) continue;
    totalStats[key] = (totalStats[key] ?? 0) * (1 + multiplier);
  }

  const totalResistances = cloneNumericRecord(equipmentResistances) as ResistanceMap;
  addNumericRecord(totalResistances, cappedFoodResistances, RESISTANCE_KEYS);
  const totalStatusAttacks = cloneNumericRecord(equipmentStatusAttacks) as StatusAttackMap;
  addNumericRecord(totalStatusAttacks, cappedFoodStatusAttacks, STATUS_ATTACK_KEYS);
  const dashboardResistances = applyDashboardStatusResistanceBaseline(totalResistances);

  if (build.food.baseId) {
    const ingredientNames = actualFoodSelections
      .map((selection) => getItemName(selection.itemId, items))
      .filter((name): name is string => Boolean(name));
    craftSteps.push(`Cook ${getItemName(build.food.baseId, items)} using ${ingredientNames.join(', ')}.`);
  }

  const allEffects = Array.from(
    new Set(
      SLOT_KEYS.flatMap((slotKey) => slotResults[slotKey].effects),
    ),
  );

  const staffChargeState: StaffChargeState | undefined =
    weaponClass === 'Staff'
      ? (() => {
          const seed: StaffChargeState =
            cloneChargeState(data.staff.chargeAttacks[weaponBaseId ?? '']) ??
            {};
          const sequence = [...build.weapon.inherits, ...build.weapon.upgrades];

          for (const selection of sequence) {
            if (!selection.itemId) continue;
            const payload = data.staff.chargeAttacks[selection.itemId];
            if (!payload) continue;
            if (payload.lv1) seed.lv1 = payload.lv1;
            if (payload.lv2) seed.lv2 = payload.lv2;
            if (payload.lv3) seed.lv3 = payload.lv3;
            if (payload.speed != null) seed.speed = payload.speed;
          }

          seed.maxCharge = data.staff.bases[weaponBaseId ?? '']?.maxCharge;
          return seed;
        })()
      : undefined;

  const attackType = slotResults.weapon.attackType ?? weaponClass;
  const element = slotResults.weapon.element ?? 'None';
  const damageType = slotResults.weapon.damageType ?? 'Physical';
  const chargeAttack =
    weaponClass === 'Staff'
      ? [staffChargeState?.lv1, staffChargeState?.lv2, staffChargeState?.lv3].filter(Boolean).join(' / ') || 'Basic'
      : attackType;

  return {
    build,
    slotResults,
    equipmentStats,
    equipmentGeometry,
    equipmentEffectiveStats: deriveEffectiveStats(equipmentStats),
    effectiveStats: deriveEffectiveStats(totalStats),
    geometry: cloneNumericRecord(equipmentGeometry) as GeometryMap,
    foodSummary: {
      healing: {
        hp: foodAdditive.hp ?? 0,
        hpPercent: foodMultipliers.hp ?? 0,
        rp: foodAdditive.rp ?? 0,
        rpPercent: foodMultipliers.rp ?? 0,
      },
      stats: {
        additive: cappedFoodAdditive,
        multipliers: foodMultipliers,
      },
      additive: cappedFoodAdditive,
      multipliers: foodMultipliers,
      resistances: cloneNumericRecord(cappedFoodResistances) as ResistanceMap,
      statusAttacks: cloneNumericRecord(cappedFoodStatusAttacks) as StatusAttackMap,
      totalLevel: foodTotalLevel,
      finalLevel: foodFinalLevel,
    },
    totalStats,
    resistances: dashboardResistances,
    equipmentResistances: cloneNumericRecord(equipmentResistances) as ResistanceMap,
    statusAttacks: totalStatusAttacks,
    warnings,
    bonusSummary: {
      level: slotResults.weapon.levelBonusSummary,
      rarity: slotResults.weapon.rarityBonusSummary,
    },
    shieldSummary: {
      coverage: shieldCoverage,
      factor: shieldFactor,
    },
    attackSummary: {
      weaponClass,
      attackType,
      element,
      damageType,
      chargeAttack,
      staffCharges: staffChargeState,
    },
    allEffects,
    craftSteps,
  };
}
