import type {
  CrafterBonusSummary,
  CrafterData,
  CrafterDefaults,
  CrafterEquipmentPayload,
  CrafterFoodPayload,
  CrafterGeometry,
  CrafterMaterialSelection,
  CrafterResistanceBlock,
  CrafterSlotConfig,
  CrafterSlotKey,
  CrafterStatusAttackBlock,
  CrafterWarning,
  Item,
} from './schemas';

export type CrafterBuildState = CrafterDefaults;

type CrafterStatBlock = Partial<NonNullable<Item['stats']>>;
type ResistanceMap = CrafterResistanceBlock;
type StatusAttackMap = CrafterStatusAttackBlock;
type GeometryMap = CrafterGeometry;

export type CrafterContribution = {
  itemId: string;
  itemName: string;
  source: 'base' | 'recipe' | 'inherit' | 'upgrade' | 'food' | 'foodIngredient' | 'bonus';
  behavior?: string;
  label?: string;
  level: number;
  rarity: number;
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
  geometry: GeometryMap;
};

export type CrafterSlotResult = {
  slot: CrafterSlotKey;
  label: string;
  appearanceName?: string;
  baseName?: string;
  carrierName?: string;
  recipeIngredients: string[];
  itemLevel: number;
  level: number;
  rarity: number;
  tier: number;
  levelTier: number;
  rarityTier: number;
  levelBonusSummary: CrafterBonusSummary;
  rarityBonusSummary: CrafterBonusSummary;
  stats: CrafterStatBlock;
  resistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
  geometry: GeometryMap;
  effects: string[];
  attackType?: string;
  element?: string;
  damageType?: string;
  materialContributions: CrafterContribution[];
  craftSteps: string[];
};

export type CrafterCalculation = {
  build: CrafterBuildState;
  slotResults: Record<CrafterSlotKey, CrafterSlotResult>;
  equipmentStats: CrafterStatBlock;
  equipmentGeometry: GeometryMap;
  equipmentEffectiveStats: CrafterStatBlock;
  effectiveStats: CrafterStatBlock;
  geometry: GeometryMap;
  foodSummary: {
    healing: {
      hp: number;
      hpPercent: number;
      rp: number;
      rpPercent: number;
    };
    stats: {
      additive: CrafterStatBlock;
      multipliers: CrafterStatBlock;
    };
    additive: CrafterStatBlock;
    multipliers: CrafterStatBlock;
    resistances: ResistanceMap;
    statusAttacks: StatusAttackMap;
    totalLevel: number;
    finalLevel: number;
  };
  totalStats: CrafterStatBlock;
  resistances: ResistanceMap;
  equipmentResistances: ResistanceMap;
  statusAttacks: StatusAttackMap;
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
    attackType: string;
    element: string;
    damageType: string;
    chargeAttack: string;
    staffCharges?: {
      lv1?: string;
      lv2?: string;
      lv3?: string;
      maxCharge?: number;
      speed?: number;
    };
  };
  allEffects: string[];
  craftSteps: string[];
};

type StaffChargeState = {
  lv1?: string;
  lv2?: string;
  lv3?: string;
  maxCharge?: number;
  speed?: number;
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

const RESISTANCE_KEYS = [
  'fire',
  'water',
  'earth',
  'wind',
  'light',
  'dark',
  'love',
  'no',
  'diz',
  'crit',
  'knock',
  'psn',
  'seal',
  'par',
  'slp',
  'ftg',
  'sick',
  'fnt',
  'drain',
] as const;

const STATUS_ATTACK_KEYS = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'faint', 'drain'] as const;
const GEOMETRY_KEYS = ['depth', 'length', 'width'] as const;
const MULTIPLIER_STAT_KEYS = ['hp', 'rp', 'hpMax', 'rpMax', 'str', 'int', 'vit'] as const;
const COOKING_CAPPED_STAT_KEYS = ['crit'] as const;
const DASHBOARD_STATUS_RES_BASELINE_KEYS = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'fnt'] as const;
const DASHBOARD_STATUS_RES_BASELINE_VALUE = 0.49;
const SHIELD_PARTIAL_SCALING_STAT_KEYS = ['atk', 'matk', 'def', 'mdef', 'str', 'int', 'vit'] as const;
export const CRAFTER_RARITY_PLACEHOLDER_ID = 'crafter-rarity-placeholder-15';
export const CRAFTER_RARITY_PLACEHOLDER_NAME = 'Rarity +15';

function isCrafterRarityPlaceholder(itemId: string | undefined) {
  return itemId === CRAFTER_RARITY_PLACEHOLDER_ID;
}

function cloneSelection(selection?: CrafterMaterialSelection): CrafterMaterialSelection {
  return {
    itemId: selection?.itemId,
    level: selection?.level ?? (selection?.itemId ? 10 : 1),
  };
}

function emptyStats(): CrafterStatBlock {
  return {};
}

function emptyResistances(): ResistanceMap {
  return {};
}

function emptyStatusAttacks(): StatusAttackMap {
  return {};
}

function emptyGeometry(): GeometryMap {
  return {};
}

function cloneStats(stats?: CrafterStatBlock): CrafterStatBlock {
  return { ...(stats ?? {}) };
}

function cloneResistances(resistances?: ResistanceMap): ResistanceMap {
  return { ...(resistances ?? {}) };
}

function cloneStatusAttacks(statusAttacks?: StatusAttackMap): StatusAttackMap {
  return { ...(statusAttacks ?? {}) };
}

function cloneGeometry(geometry?: GeometryMap): GeometryMap {
  return { ...(geometry ?? {}) };
}

function addStats(target: CrafterStatBlock, source?: CrafterStatBlock, scale = 1) {
  if (!source) return;
  for (const key of STAT_KEYS) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

function addResistances(target: ResistanceMap, source?: ResistanceMap, scale = 1) {
  if (!source) return;
  for (const key of RESISTANCE_KEYS) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

function addStatusAttacks(target: StatusAttackMap, source?: StatusAttackMap, scale = 1) {
  if (!source) return;
  for (const key of STATUS_ATTACK_KEYS) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

function addGeometry(target: GeometryMap, source?: GeometryMap, scale = 1) {
  if (!source) return;
  for (const key of GEOMETRY_KEYS) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

function scaleStats(source?: CrafterStatBlock, scale = 1): CrafterStatBlock {
  const next = emptyStats();
  addStats(next, source, scale);
  return next;
}

function scaleResistances(source?: ResistanceMap, scale = 1): ResistanceMap {
  const next = emptyResistances();
  addResistances(next, source, scale);
  return next;
}

function scaleStatusAttacks(source?: StatusAttackMap, scale = 1): StatusAttackMap {
  const next = emptyStatusAttacks();
  addStatusAttacks(next, source, scale);
  return next;
}

function scaleGeometry(source?: GeometryMap, scale = 1): GeometryMap {
  const next = emptyGeometry();
  addGeometry(next, source, scale);
  return next;
}

function normalizeMaterialLevel(level?: number) {
  return Math.max(1, Math.min(10, level ?? 1));
}

function getSlotConfigByKey(data: CrafterData): Record<CrafterSlotKey, CrafterSlotConfig> {
  return Object.fromEntries(data.slotConfigs.map((slot) => [slot.key, slot])) as Record<
    CrafterSlotKey,
    CrafterSlotConfig
  >;
}

function padSelections(
  selections: CrafterMaterialSelection[] | undefined,
  count: number,
): CrafterMaterialSelection[] {
  return Array.from({ length: count }, (_, index) => cloneSelection(selections?.[index]));
}

function getAppearanceId(slotKey: CrafterSlotKey, build: CrafterBuildState) {
  return build[slotKey].appearanceId;
}

function getRecipeDefinition(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
) {
  if (!itemId) return undefined;
  return data.recipes.equipment[slotKey]?.[itemId];
}

function getFoodRecipeDefinition(baseId: string | undefined, data: CrafterData) {
  if (!baseId) return undefined;
  return data.recipes.food[baseId];
}

function applyDefaultRecipeSelections(
  current: CrafterMaterialSelection[] | undefined,
  defaults: (string | null)[] | undefined,
  slotCount: number,
): CrafterMaterialSelection[] {
  const padded = padSelections(current, slotCount);
  return padded.map((selection, index) => {
    const rawItemId = selection.itemId;
    return {
      itemId: rawItemId === '' ? undefined : rawItemId ?? defaults?.[index] ?? undefined,
      level: rawItemId && rawItemId !== '' ? selection.level : rawItemId === '' ? 1 : defaults?.[index] ? 10 : selection.level,
    };
  });
}

export function createDefaultCrafterBuild(data: CrafterData): CrafterBuildState {
  const build = structuredClone(data.defaults) as CrafterBuildState;
  const slotConfigByKey = getSlotConfigByKey(data);

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
    build[slotKey].appearanceId = undefined;
    build[slotKey].baseId = undefined;
    build[slotKey].recipe = padSelections(build[slotKey].recipe, slotConfig.recipeSlots);
    build[slotKey].inherits = padSelections(build[slotKey].inherits, slotConfig.inheritSlots);
    build[slotKey].upgrades = padSelections(build[slotKey].upgrades, slotConfig.upgradeSlots);
  }

  build.food.baseId = undefined;
  build.food.recipe = padSelections(build.food.recipe, 6);
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
    const slotConfigByKey = getSlotConfigByKey(data);
    const rawParsed = parsed as Record<string, unknown>;

    for (const slotKey of SLOT_KEYS) {
      const slotConfig = slotConfigByKey[slotKey];
      const incoming = parsed[slotKey] as
        | (Partial<CrafterBuildState[CrafterSlotKey]> & { appearanceId?: string })
        | undefined;
      if (!incoming) continue;

      merged[slotKey].appearanceId = incoming.appearanceId ?? incoming.baseId ?? merged[slotKey].appearanceId;
      merged[slotKey].baseId = incoming.appearanceId ? incoming.baseId ?? merged[slotKey].baseId : undefined;

      merged[slotKey].recipe = padSelections(incoming.recipe, slotConfig.recipeSlots);
      merged[slotKey].inherits = padSelections(incoming.inherits, slotConfig.inheritSlots);
      merged[slotKey].upgrades = padSelections(incoming.upgrades, slotConfig.upgradeSlots);
    }

    if (parsed.food) {
      const incomingFood = rawParsed.food as
        | (Partial<CrafterBuildState['food']> & { ingredients?: CrafterMaterialSelection[] })
        | undefined;
      merged.food.baseId = parsed.food.baseId ?? merged.food.baseId;
      merged.food.recipe = padSelections(incomingFood?.recipe ?? incomingFood?.ingredients, 6);
    }

    return merged;
  } catch {
    return fallback;
  }
}

export function serializeCrafterBuild(build: CrafterBuildState): string {
  return JSON.stringify(build);
}

function getTier(value: number, tiers: CrafterData['levelBonusTiers']): CrafterBonusSummary {
  const sorted = [...tiers].sort((left, right) => left.threshold - right.threshold);
  let active = sorted[0] ?? { threshold: 0, tier: 0, label: '', stats: {} };
  for (const tier of sorted) {
    if (value >= tier.threshold) active = tier;
  }

  const currentThreshold = active.threshold;
  const nextThreshold = sorted.find((tier) => tier.threshold > active.threshold)?.threshold;
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
    stats: cloneStats(active.stats),
    currentThreshold,
    nextThreshold,
    remainingToNext,
    isMaxTier: nextThreshold == null,
    progressRatio,
  };
}

function getItemName(itemId: string | undefined, items: Record<string, Item>, fallback?: string) {
  if (!itemId) return fallback;
  if (isCrafterRarityPlaceholder(itemId)) return CRAFTER_RARITY_PLACEHOLDER_NAME;
  return items[itemId]?.name ?? fallback ?? itemId;
}

function getEquipmentPayload(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
): CrafterEquipmentPayload | undefined {
  if (!itemId) return undefined;
  if (slotKey === 'weapon') return data.stats.weapon[itemId];
  return data.stats.armor[itemId];
}

function getMaterialPayload(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
): CrafterEquipmentPayload | undefined {
  if (!itemId) return undefined;
  if (isCrafterRarityPlaceholder(itemId)) {
    return {
      itemName: CRAFTER_RARITY_PLACEHOLDER_NAME,
      weaponClass: undefined,
      stats: {},
      resistances: {},
      statusAttacks: {},
      geometry: {},
      attackType: undefined,
      element: undefined,
      damageType: undefined,
      rarity: 15,
      bonusType: undefined,
      bonusType2: undefined,
    };
  }
  if (slotKey === 'weapon') return data.materials.weapon[itemId];
  return data.materials.armor[itemId];
}

function getMaterialRarity(
  slotKey: CrafterSlotKey,
  itemId: string | undefined,
  data: CrafterData,
) {
  if (!itemId) return 0;
  if (isCrafterRarityPlaceholder(itemId)) return 15;
  if (itemId === 'item-turnip-heaven') return 0;
  return getMaterialPayload(slotKey, itemId, data)?.rarity ?? 0;
}

function matchesSlotCraft(
  item: Item | undefined,
  slotConfig: CrafterSlotConfig,
) {
  return Boolean(
    item?.craft?.some(
      (craft) =>
        craft.stationType === slotConfig.stationType &&
        (slotConfig.stations.length === 0 || slotConfig.stations.includes(craft.station ?? '')),
    ),
  );
}

function getDerivedRecipeBase(
  slotKey: CrafterSlotKey,
  appearanceId: string | undefined,
  recipeSelections: CrafterMaterialSelection[],
  items: Record<string, Item>,
  data: CrafterData,
  slotConfig: CrafterSlotConfig,
) {
  const candidateIds = recipeSelections
    .map((selection) => selection.itemId)
    .filter((itemId): itemId is string => Boolean(itemId))
    .filter((itemId) => matchesSlotCraft(items[itemId], slotConfig));

  if (candidateIds.length === 0) {
    return {
      baseId: undefined,
      hasCraftCandidate: false,
    };
  }

  const lightOrePresent = recipeSelections.some((selection) => selection.itemId === 'item-light-ore');
  const appearanceWeaponClass = getWeaponClass(appearanceId, items, data);
  const validCandidates = candidateIds.filter((candidateId) => {
    if (slotKey !== 'weapon') return true;
    if (!appearanceId) return false;
    const candidateWeaponClass = getWeaponClass(candidateId, items, data);
    return lightOrePresent || candidateWeaponClass === appearanceWeaponClass;
  });

  return {
    baseId: validCandidates[0],
    hasCraftCandidate: true,
  };
}

export function normalizeCrafterBuild(
  build: CrafterBuildState,
  items: Record<string, Item>,
  data: CrafterData,
): CrafterBuildState {
  const normalized = createDefaultCrafterBuild(data);
  const slotConfigByKey = getSlotConfigByKey(data);

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
    const incoming = build[slotKey];
    const appearanceId = incoming.appearanceId ?? incoming.baseId;
    const recipeSelections = applyDefaultRecipeSelections(
      incoming.recipe,
      getRecipeDefinition(slotKey, appearanceId, data)?.materials,
      slotConfig.recipeSlots,
    );

    normalized[slotKey].appearanceId = appearanceId;
    normalized[slotKey].recipe = recipeSelections;
    normalized[slotKey].inherits = padSelections(incoming.inherits, slotConfig.inheritSlots);
    normalized[slotKey].upgrades = padSelections(incoming.upgrades, slotConfig.upgradeSlots);
    normalized[slotKey].baseId = getDerivedRecipeBase(
      slotKey,
      appearanceId,
      recipeSelections,
      items,
      data,
      slotConfig,
    ).baseId;
  }

  normalized.food.baseId = build.food.baseId;
  normalized.food.recipe = applyDefaultRecipeSelections(
    build.food.recipe,
    getFoodRecipeDefinition(build.food.baseId, data)?.materials,
    6,
  );

  return normalized;
}

function getFoodBasePayload(itemId: string | undefined, data: CrafterData): CrafterFoodPayload | undefined {
  if (!itemId) return undefined;
  return data.food.baseStats[itemId];
}

function getFoodIngredientPayload(itemId: string | undefined, data: CrafterData): CrafterFoodPayload | undefined {
  if (!itemId) return undefined;
  return data.materials.food[itemId];
}

function getWeaponClass(itemId: string | undefined, items: Record<string, Item>, data: CrafterData): string {
  if (!itemId) return 'Unknown';
  const payload = data.stats.weapon[itemId];
  if (payload?.weaponClass) return payload.weaponClass;
  const station = items[itemId]?.craft?.[0]?.station;
  if (!station) return 'Unknown';
  return data.weaponClassByStation[station] ?? station;
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
  payload: CrafterEquipmentPayload | undefined,
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
    stats: scaleStats(payload?.stats, scale),
    resistances: scaleResistances(payload?.resistances, scale),
    statusAttacks: scaleStatusAttacks(payload?.statusAttacks, scale),
    geometry: scaleGeometry(payload?.geometry, scale),
  };
}

function foodPayloadScale(payload: CrafterFoodPayload | undefined, scale: number) {
  return {
    additive: scaleStats(payload?.additive, scale),
    multipliers: scaleStats(payload?.multipliers, scale),
    resistances: scaleResistances(payload?.resistances, scale),
    statusAttacks: scaleStatusAttacks(payload?.statusAttacks, scale),
  };
}

function addRarityBonus(slotConfig: CrafterSlotConfig, target: CrafterStatBlock, rarityBonus: CrafterBonusSummary, weaponClass: string) {
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

function capResistances(resistances: ResistanceMap) {
  const next = cloneResistances(resistances);
  for (const key of RESISTANCE_KEYS) {
    if (next[key] == null) continue;
    next[key] = Math.min(next[key]!, 1);
  }
  return next;
}

function capStatusAttacks(statusAttacks: StatusAttackMap) {
  const next = cloneStatusAttacks(statusAttacks);
  for (const key of STATUS_ATTACK_KEYS) {
    if (next[key] == null) continue;
    next[key] = Math.min(next[key]!, 1);
  }
  return next;
}

function capStatsByKeys(stats: CrafterStatBlock, keys: readonly (keyof CrafterStatBlock)[]) {
  const next = cloneStats(stats);
  for (const key of keys) {
    if (next[key] == null) continue;
    next[key] = Math.min(next[key]!, 1);
  }
  return next;
}

function applyDashboardStatusResistanceBaseline(resistances: ResistanceMap) {
  const next = cloneResistances(resistances);
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
  const next = cloneStats(stats);
  for (const key of SHIELD_PARTIAL_SCALING_STAT_KEYS) {
    if (next[key] == null) continue;
    next[key] = next[key]! * factor;
  }
  return next;
}

function buildCraftStepsForSlot(
  slotResult: CrafterSlotResult,
  slotConfig: CrafterSlotConfig,
  data: CrafterData,
  items: Record<string, Item>,
  weaponClass: string,
) {
  if (!slotResult.baseName) return [];

  const carrierId =
    slotConfig.key === 'weapon'
      ? data.starterWeaponByClass[weaponClass]
      : slotConfig.carrierId ?? undefined;
  const carrierName = getItemName(carrierId ?? undefined, items, slotResult.carrierName);
  const inheritNames = slotResult.materialContributions
    .filter((contribution) => contribution.source === 'inherit')
    .map((contribution) => contribution.itemName);
  const upgradeNames = slotResult.materialContributions
    .filter((contribution) => contribution.source === 'upgrade')
    .map((contribution) => contribution.itemName);
  const recipeLabels = slotResult.recipeIngredients.map((name) => `Lv.10 ${name}`);

  const steps: string[] = [];

  if (carrierName && inheritNames.length > 0) {
    steps.push(`Craft ${carrierName} using ${inheritNames.join(', ')}.`);
  }

  if (carrierName && inheritNames.length > 0) {
    steps.push(`Upgrade ${carrierName} with any materials to reach Lv.10.`);
  }
  if (recipeLabels.length > 0) {
    steps.push(`Craft ${slotResult.baseName} using ${recipeLabels.join(', ')}.`);
  } else {
    steps.push(`Craft ${slotResult.baseName}.`);
  }
  if (inheritNames.length > 0) {
    steps.push(`Talk to Barrett and verify ${inheritNames.join(', ')} were used in creating ${slotResult.baseName}.`);
  }

  if (upgradeNames.length > 0) {
    const firstBatch = upgradeNames.slice(0, 5);
    const secondBatch = upgradeNames.slice(5);
    steps.push(`Upgrade ${slotResult.baseName} using ${firstBatch.map((name) => `Lv.10 ${name}`).join(', ')}.`);
    if (secondBatch.length > 0) {
      steps.push(`Continue upgrading ${slotResult.baseName} using ${secondBatch.map((name) => `Lv.10 ${name}`).join(', ')}.`);
    }
  }

  return steps;
}

export function calculateCrafterBuild(
  rawBuild: CrafterBuildState,
  items: Record<string, Item>,
  data: CrafterData,
): CrafterCalculation {
  const build = normalizeCrafterBuild(rawBuild, items, data);
  const slotConfigByKey = getSlotConfigByKey(data);
  const warnings: CrafterWarning[] = [];
  const slotResults = {} as Record<CrafterSlotKey, CrafterSlotResult>;
  const specialRuleMap = new Map(data.specialMaterialRules.map((rule) => [rule.itemId, rule.behavior]));
  const craftSteps: string[] = [];

  for (const slotKey of SLOT_KEYS) {
    const slotConfig = slotConfigByKey[slotKey];
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
    const slotStats = cloneStats(basePayload?.stats);
    const slotResistances = cloneResistances(basePayload?.resistances);
    const slotStatusAttacks = cloneStatusAttacks(basePayload?.statusAttacks);
    const slotGeometry = cloneGeometry(basePayload?.geometry);
    const effects: string[] = [];
    const materialContributions: CrafterContribution[] = [];

    if ((slotKey === 'accessory' || slotKey === 'shoes') && appearanceName) {
      addEffect(effects, appearanceName);
    }

    const recipeIngredients = recipeSelections
      .map((recipeSelection) => getItemName(recipeSelection.itemId, items))
      .filter((name): name is string => Boolean(name));

    const baseLevel = baseId ? Math.min(10, 1 + selection.upgrades.filter((material) => Boolean(material.itemId)).length) : 0;
    let levelValue = baseLevel;
    let rarityValue = 0;
    for (const material of recipeSelections) {
      if (!material.itemId) continue;
      const rarity = getMaterialRarity(slotKey, material.itemId, data);
      levelValue += normalizeMaterialLevel(material.level);
      rarityValue += rarity;
      materialContributions.push({
        itemId: material.itemId,
        itemName: getItemName(material.itemId, items)!,
        source: 'recipe',
        level: normalizeMaterialLevel(material.level),
        rarity,
        behavior: specialRuleMap.get(material.itemId),
        stats: {},
        resistances: {},
        statusAttacks: {},
        geometry: {},
      });
    }

    let invertSign = 1;
    const repeatCounts = new Map<string, number>();
    let previousRegularUpgrade: CrafterContribution | undefined;
    let previousUnsignedRegularUpgrade: CrafterContribution | undefined;

    const pushContribution = (contribution: CrafterContribution) => {
      materialContributions.push(contribution);
      addStats(slotStats, contribution.stats);
      addResistances(slotResistances, contribution.resistances);
      addStatusAttacks(slotStatusAttacks, contribution.statusAttacks);
      addGeometry(slotGeometry, contribution.geometry);
    };

    const processMaterial = (source: 'inherit' | 'upgrade', material: CrafterMaterialSelection) => {
      if (!material.itemId) return;
      const itemName = getItemName(material.itemId, items)!;
      const payload = getMaterialPayload(slotKey, material.itemId, data);
      const behavior = specialRuleMap.get(material.itemId);
      const level = normalizeMaterialLevel(material.level);
      const rarity = getMaterialRarity(slotKey, material.itemId, data);

      if (source === 'upgrade') {
        levelValue += level;
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
          stats: {},
          resistances: {},
          statusAttacks: {},
          geometry: {},
        });
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
          stats: {},
          resistances: {},
          statusAttacks: {},
          geometry: {},
        });
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
          stats: scaleStats(previousUnsignedRegularUpgrade?.stats ?? previousRegularUpgrade.stats, factor),
          resistances: scaleResistances(
            previousUnsignedRegularUpgrade?.resistances ?? previousRegularUpgrade.resistances,
            factor,
          ),
          statusAttacks: scaleStatusAttacks(
            previousUnsignedRegularUpgrade?.statusAttacks ?? previousRegularUpgrade.statusAttacks,
            factor,
          ),
          geometry: scaleGeometry(previousUnsignedRegularUpgrade?.geometry ?? previousRegularUpgrade.geometry, factor),
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
      slotKey !== 'weapon' &&
      ['item-green-core', 'item-red-core', 'item-yellow-core', 'item-blue-core'].every((coreId) =>
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
        stats: {},
        resistances: { no: 0.1 },
        statusAttacks: {},
        geometry: {},
      });
    }

    const baseWeaponClass = getWeaponClass(baseId, items, data);

    const levelBonus = getTier(levelValue, data.levelBonusTiers);
    const rarityBonus = getTier(rarityValue, data.rarityBonusTiers);
    applyLevelBonus(slotConfig, slotStats, levelBonus);
    addRarityBonus(slotConfig, slotStats, rarityBonus, baseWeaponClass);

    const attackType = slotKey === 'weapon' ? baseWeaponClass : undefined;
    const element =
      slotKey === 'weapon'
        ? basePayload?.element ?? 'None'
        : undefined;
    const damageType =
      slotKey === 'weapon'
        ? basePayload?.damageType ?? 'Physical'
        : undefined;

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
      level: levelValue,
      rarity: rarityValue,
      tier: rarityBonus.tier,
      levelTier: levelBonus.tier,
      rarityTier: rarityBonus.tier,
      levelBonusSummary: levelBonus,
      rarityBonusSummary: rarityBonus,
      stats: slotStats,
      resistances: shouldCapSlotPercentages(slotKey) ? capResistances(slotResistances) : cloneResistances(slotResistances),
      statusAttacks: shouldCapSlotPercentages(slotKey) ? capStatusAttacks(slotStatusAttacks) : cloneStatusAttacks(slotStatusAttacks),
      geometry: clampWeaponGeometry(slotKey, slotGeometry),
      effects,
      attackType,
      element,
      damageType,
      materialContributions,
      craftSteps: [],
    };

    slotResult.craftSteps = buildCraftStepsForSlot(slotResult, slotConfig, data, items, baseWeaponClass);
    craftSteps.push(...slotResult.craftSteps);
    slotResults[slotKey] = slotResult;
  }

  const weaponBaseId = slotResults.weapon.baseName ? build.weapon.baseId ?? build.weapon.appearanceId : build.weapon.appearanceId;
  const weaponClass = getWeaponClass(weaponBaseId, items, data);
  const shieldCoverage = data.shieldCoverageByWeaponClass[weaponClass] ?? 'full';
  const shieldFactor = shieldCoverage === 'full' ? 1 : shieldCoverage === 'partial' ? 0.5 : 0;

  const equipmentStats = emptyStats();
  const equipmentResistances = emptyResistances();
  const equipmentStatusAttacks = emptyStatusAttacks();
  const equipmentGeometry = emptyGeometry();

  for (const slotKey of SLOT_KEYS) {
    const scaledStats = slotKey === 'shield' ? scaleShieldAggregateStats(slotResults[slotKey].stats, shieldFactor) : slotResults[slotKey].stats;

    addStats(equipmentStats, scaledStats);
    addResistances(equipmentResistances, slotResults[slotKey].resistances);
    addStatusAttacks(equipmentStatusAttacks, slotResults[slotKey].statusAttacks);
    addGeometry(equipmentGeometry, slotResults[slotKey].geometry);
  }

  const foodRecipeDefinition = getFoodRecipeDefinition(build.food.baseId, data);
  const foodSelections = applyDefaultRecipeSelections(build.food.recipe, foodRecipeDefinition?.materials, 6);
  const actualFoodSelections = foodSelections.filter((selection) => selection.itemId);
  const foodTotalLevel = actualFoodSelections.reduce((sum, selection) => sum + normalizeMaterialLevel(selection.level), 0);
  const foodFinalLevel =
    actualFoodSelections.length === 0 ? 0 : Math.floor(foodTotalLevel / actualFoodSelections.length);
  const foodScale = actualFoodSelections.length === 0 ? 0 : (7 + foodFinalLevel) / 8;
  const foodBasePayload = getFoodBasePayload(build.food.baseId, data);
  const scaledFoodBase = foodPayloadScale(foodBasePayload, foodScale);
  const foodAdditive = cloneStats(scaledFoodBase.additive);
  const foodMultipliers = cloneStats(scaledFoodBase.multipliers);
  const foodResistances = cloneResistances(scaledFoodBase.resistances);
  const foodStatusAttacks = cloneStatusAttacks(scaledFoodBase.statusAttacks);

  for (const ingredient of actualFoodSelections) {
    const payload = getFoodIngredientPayload(ingredient.itemId, data);
    addStats(foodAdditive, payload?.additive);
    addStats(foodMultipliers, payload?.multipliers);
    addResistances(foodResistances, payload?.resistances);
    addStatusAttacks(foodStatusAttacks, payload?.statusAttacks);
  }

  const cappedFoodAdditive = capStatsByKeys(foodAdditive, COOKING_CAPPED_STAT_KEYS);
  const cappedFoodResistances = capResistances(foodResistances);
  const cappedFoodStatusAttacks = capStatusAttacks(foodStatusAttacks);

  const totalStats = cloneStats(equipmentStats);
  addStats(totalStats, cappedFoodAdditive);
  for (const key of MULTIPLIER_STAT_KEYS) {
    const multiplier = foodMultipliers[key];
    if (multiplier == null) continue;
    totalStats[key] = (totalStats[key] ?? 0) * (1 + multiplier);
  }

  const totalResistances = cloneResistances(equipmentResistances);
  addResistances(totalResistances, cappedFoodResistances);
  const totalStatusAttacks = cloneStatusAttacks(equipmentStatusAttacks);
  addStatusAttacks(totalStatusAttacks, cappedFoodStatusAttacks);
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
          seed.maxCharge =
            data.staff.bases[weaponBaseId ?? '']?.maxCharge;
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
    geometry: cloneGeometry(equipmentGeometry),
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
      resistances: cloneResistances(cappedFoodResistances),
      statusAttacks: cloneStatusAttacks(cappedFoodStatusAttacks),
      totalLevel: foodTotalLevel,
      finalLevel: foodFinalLevel,
    },
    totalStats,
    resistances: dashboardResistances,
    equipmentResistances: cloneResistances(equipmentResistances),
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

function cloneChargeState(payload: CrafterData['staff']['chargeAttacks'][string] | undefined) {
  if (!payload) return undefined;
  return {
    lv1: payload.lv1,
    lv2: payload.lv2,
    lv3: payload.lv3,
    speed: payload.speed,
  } satisfies StaffChargeState;
}
