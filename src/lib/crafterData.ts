import {
  CrafterDataSchema,
  type CrafterConfig,
  type CrafterData,
  type CrafterEquipmentPayload,
  type CrafterFoodPayload,
  type CrafterSlotConfig,
  type Item,
} from './schemas';

const FRACTIONAL_STAT_KEYS = new Set(['crit', 'drain', 'knock', 'stun']);

const RESISTANCE_TARGET_TO_KEY = {
  fire: 'fire',
  water: 'water',
  earth: 'earth',
  wind: 'wind',
  light: 'light',
  dark: 'dark',
  love: 'love',
  dizzy: 'diz',
  crit: 'crit',
  drain: 'drain',
  knock: 'knock',
  poison: 'psn',
  seal: 'seal',
  paralysis: 'par',
  sleep: 'slp',
  fatigue: 'ftg',
  sickness: 'sick',
  faint: 'fnt',
} as const;

const STATUS_TARGET_TO_KEY = {
  poison: 'psn',
  seal: 'seal',
  paralysis: 'par',
  sleep: 'slp',
  fatigue: 'ftg',
  sickness: 'sick',
  faint: 'faint',
} as const;

function mapValues<T extends Record<string, number | undefined>>(
  value: T | undefined,
  transform: (entry: number, key: string) => number,
) {
  if (!value) return {};
  const entries = Object.entries(value)
    .filter(([, entry]) => entry != null)
    .map(([key, entry]) => [key, transform(entry as number, key)]);
  return Object.fromEntries(entries);
}

function mergeNumberRecords<T extends Record<string, number | undefined>>(
  preferred: T | undefined,
  fallback: T | undefined,
) {
  return {
    ...(fallback ?? {}),
    ...(preferred ?? {}),
  } as T;
}

function hasData(value: object | undefined) {
  return Boolean(value && Object.keys(value).length > 0);
}

function convertStatValueToCrafter(key: string, value: number) {
  return FRACTIONAL_STAT_KEYS.has(key) ? value / 100 : value;
}

function convertHumanStatsToCrafter(stats: Item['stats'] | Item['statMultipliers'] | undefined) {
  return mapValues(stats ?? {}, (value, key) => convertStatValueToCrafter(key, value)) as NonNullable<
    Item['stats']
  >;
}

function convertHumanStatMultipliersToCrafter(stats: Item['statMultipliers'] | undefined) {
  return mapValues(stats ?? {}, (value) => value / 100) as NonNullable<Item['statMultipliers']>;
}

function convertHumanPercentToCrafter(value: number | undefined) {
  if (value == null) return undefined;
  return value / 100;
}

function buildResistancesFromEffects(effects: Item['effects'] | undefined) {
  const entries: Array<readonly [string, number]> = [];

  for (const effect of effects ?? []) {
    if (effect.type !== 'resistance') continue;
    const key = RESISTANCE_TARGET_TO_KEY[effect.target as keyof typeof RESISTANCE_TARGET_TO_KEY];
    if (!key) continue;
    entries.push([key, effect.value / 100] as const);
  }

  return Object.fromEntries(entries);
}

function buildStatusAttacksFromEffects(
  effects: Item['effects'] | undefined,
  trigger: 'attack' | 'consume',
) {
  const entries: Array<readonly [string, number]> = [];

  for (const effect of effects ?? []) {
    if (effect.type !== 'inflict' || effect.trigger !== trigger || effect.chance == null) continue;
    const key = STATUS_TARGET_TO_KEY[effect.target as keyof typeof STATUS_TARGET_TO_KEY];
    if (!key) continue;
    entries.push([key, effect.chance / 100] as const);
  }

  return Object.fromEntries(entries);
}

function buildFoodMultipliers(item: Item) {
  const multipliers = convertHumanStatMultipliersToCrafter(item.statMultipliers);
  const hp = convertHumanPercentToCrafter(item.healing?.hpPercent);
  const rp = convertHumanPercentToCrafter(item.healing?.rpPercent);

  if (hp != null) {
    multipliers.hp = hp;
  }

  if (rp != null) {
    multipliers.rp = rp;
  }

  return multipliers;
}

function buildDerivedEquipmentPayload(item: Item): Omit<CrafterEquipmentPayload, 'itemName'> | undefined {
  const stats = convertHumanStatsToCrafter(item.stats);
  const resistances = buildResistancesFromEffects(item.effects);
  const statusAttacks = buildStatusAttacksFromEffects(item.effects, 'attack');
  const geometry = item.combat?.geometry ?? {};
  const rarity = item.rarityPoints ?? 0;

  if (
    !hasData(stats) &&
    !hasData(resistances) &&
    !hasData(statusAttacks) &&
    !hasData(geometry) &&
    item.combat?.weaponClass == null &&
    item.combat?.attackType == null &&
    item.combat?.element == null &&
    item.combat?.damageType == null &&
    rarity === 0
  ) {
    return undefined;
  }

  return {
    weaponClass: item.combat?.weaponClass ?? undefined,
    stats,
    resistances,
    statusAttacks,
    geometry,
    attackType: item.combat?.attackType ?? undefined,
    element: item.combat?.element ?? undefined,
    damageType: item.combat?.damageType ?? undefined,
    rarity,
    bonusType: undefined,
    bonusType2: undefined,
  };
}

function buildDerivedFoodPayload(item: Item): Omit<CrafterFoodPayload, 'itemName'> | undefined {
  const additive = convertHumanStatsToCrafter(item.stats);
  const multipliers = buildFoodMultipliers(item);
  const resistances = buildResistancesFromEffects(item.effects);
  const statusAttacks = buildStatusAttacksFromEffects(item.effects, 'consume');

  if (!hasData(additive) && !hasData(multipliers) && !hasData(resistances) && !hasData(statusAttacks)) {
    return undefined;
  }

  return {
    additive,
    multipliers,
    resistances,
    statusAttacks,
    status: undefined,
    lightRes: undefined,
  };
}

function addItemName<T extends object>(itemName: string, payload: T | undefined): (T & { itemName: string }) | undefined {
  if (!payload) return undefined;
  return {
    ...payload,
    itemName,
  };
}

function mergeFoodPayload(
  preferred: Omit<CrafterFoodPayload, 'itemName'> | undefined,
  fallback: Omit<CrafterFoodPayload, 'itemName'> | undefined,
) {
  if (!preferred && !fallback) return undefined;
  return {
    additive: mergeNumberRecords(preferred?.additive, fallback?.additive),
    multipliers: mergeNumberRecords(preferred?.multipliers, fallback?.multipliers),
    resistances: mergeNumberRecords(preferred?.resistances, fallback?.resistances),
    statusAttacks: mergeNumberRecords(preferred?.statusAttacks, fallback?.statusAttacks),
    status: fallback?.status,
    lightRes: fallback?.lightRes,
  } satisfies Omit<CrafterFoodPayload, 'itemName'>;
}

function hasWeaponRole(item: Item, slotConfigs: CrafterConfig['slotConfigs']) {
  const slotConfig = slotConfigs.find((entry) => entry.key === 'weapon');
  return slotConfig ? itemMatchesCrafterSlot(item, slotConfig) : false;
}

function hasArmorRole(item: Item, slotConfigs: CrafterConfig['slotConfigs']) {
  return slotConfigs
    .filter((entry) => entry.key !== 'weapon')
    .some((slotConfig) => itemMatchesCrafterSlot(item, slotConfig));
}

function hasFoodRole(item: Item) {
  return Boolean(item.craft?.some((craft) => craft.stationType === 'Cooking') || item.crafter?.foodBase);
}

export function normalizeCrafterStation(station: string | null | undefined) {
  switch (station ?? undefined) {
    case 'Axe':
    case 'Hammer':
      return 'Axe/Hammer';
    case 'Pole':
      return 'Spear';
    case 'Hoe':
    case 'Sickle':
    case 'Waterpot':
      return 'Farm';
    case 'No Tool':
      return 'Handmade';
    case 'Steamed':
      return 'Steamer';
    default:
      return station ?? undefined;
  }
}

export function craftMatchesCrafterSlot(
  craft: NonNullable<Item['craft']>[number],
  slotConfig: CrafterSlotConfig,
) {
  if (craft.stationType !== slotConfig.stationType) return false;
  if (slotConfig.stations.length === 0) return true;

  const station = normalizeCrafterStation(craft.station) ?? '';
  return slotConfig.stations.some((candidate) => normalizeCrafterStation(candidate) === station);
}

export function itemMatchesCrafterSlot(item: Item | undefined, slotConfig: CrafterSlotConfig) {
  return Boolean(item?.craft?.some((craft) => craftMatchesCrafterSlot(craft, slotConfig)));
}

function buildRecipeDefinition(craft: NonNullable<Item['craft']>[number] | undefined) {
  if (!craft) return undefined;
  return {
    station: normalizeCrafterStation(craft.station) ?? craft.station ?? craft.stationType,
    materials: [...craft.ingredients],
  };
}

function buildEquipmentRecipes(items: Record<string, Item>, slotConfigs: CrafterConfig['slotConfigs']) {
  const recipes: CrafterData['recipes']['equipment'] = {
    weapon: {},
    armor: {},
    headgear: {},
    shield: {},
    accessory: {},
    shoes: {},
  };

  for (const slotConfig of slotConfigs) {
    for (const [itemId, item] of Object.entries(items)) {
      const craft = item.craft?.find((candidate) => craftMatchesCrafterSlot(candidate, slotConfig));
      const recipe = buildRecipeDefinition(craft);
      if (!recipe) continue;
      recipes[slotConfig.key][itemId] = recipe;
    }
  }

  return recipes;
}

function buildFoodRecipes(items: Record<string, Item>) {
  const recipes: CrafterData['recipes']['food'] = {};

  for (const [itemId, item] of Object.entries(items)) {
    const craft = item.craft?.find((candidate) => candidate.stationType === 'Cooking');
    const recipe = buildRecipeDefinition(craft);
    if (!recipe) continue;
    recipes[itemId] = recipe;
  }

  return recipes;
}

export function buildCrafterData(items: Record<string, Item>, crafterConfig: CrafterConfig): CrafterData {
  const stats: CrafterData['stats'] = { weapon: {}, armor: {} };
  const materials: CrafterData['materials'] = { weapon: {}, armor: {}, food: {} };
  const food: CrafterData['food'] = { baseStats: {} };
  const bonusEffects: CrafterData['bonusEffects'] = {};
  const staff: CrafterData['staff'] = { chargeAttacks: {}, bases: {} };
  const specialMaterialRules: CrafterData['specialMaterialRules'] = [];

  for (const [itemId, item] of Object.entries(items)) {
    const derivedEquipmentPayload = buildDerivedEquipmentPayload(item);
    const derivedFoodPayload = buildDerivedFoodPayload(item);
    const hasWeaponEquipmentRole = hasWeaponRole(item, crafterConfig.slotConfigs);
    const hasArmorEquipmentRole = hasArmorRole(item, crafterConfig.slotConfigs);

    if (hasWeaponEquipmentRole) {
      const payload = addItemName(item.name, item.crafter?.equipment?.weapon ?? derivedEquipmentPayload);

      if (payload) {
        stats.weapon[itemId] = payload;
      }
    }

    if (hasArmorEquipmentRole) {
      const payload = addItemName(item.name, item.crafter?.equipment?.armor ?? derivedEquipmentPayload);

      if (payload) {
        stats.armor[itemId] = payload;
      }
    }

    const resolvedFoodBasePayload = hasFoodRole(item)
      ? addItemName(item.name, mergeFoodPayload(derivedFoodPayload, item.crafter?.foodBase))
      : undefined;
    if (resolvedFoodBasePayload) {
      food.baseStats[itemId] = resolvedFoodBasePayload;
    }

    const materialWeaponPayload = addItemName(item.name, item.crafter?.material?.weapon);
    if (materialWeaponPayload) {
      materials.weapon[itemId] = materialWeaponPayload;
    }

    const materialArmorPayload = addItemName(item.name, item.crafter?.material?.armor);
    if (materialArmorPayload) {
      materials.armor[itemId] = materialArmorPayload;
    }

    const materialFoodPayload = addItemName(item.name, item.crafter?.material?.food);
    if (materialFoodPayload) {
      materials.food[itemId] = materialFoodPayload;
    }

    if (item.crafter?.specialMaterialRule) {
      specialMaterialRules.push({
        itemId,
        behavior: item.crafter.specialMaterialRule.behavior,
      });
    }

    if (item.crafter?.bonusEffect) {
      bonusEffects[itemId] = {
        itemName: item.name,
        kind: item.crafter.bonusEffect.kind,
      };
    }

    if (item.crafter?.staff?.chargeAttack) {
      staff.chargeAttacks[itemId] = {
        itemName: item.name,
        ...item.crafter.staff.chargeAttack,
      };
    }

    if (item.crafter?.staff?.base) {
      staff.bases[itemId] = {
        itemName: item.name,
        ...item.crafter.staff.base,
      };
    }
  }

  return CrafterDataSchema.parse({
    schemaVersion: crafterConfig.schemaVersion,
    slotConfigs: crafterConfig.slotConfigs,
    defaults: crafterConfig.defaults,
    specialMaterialRules,
    weaponClassByStation: crafterConfig.weaponClassByStation,
    shieldCoverageByWeaponClass: crafterConfig.shieldCoverageByWeaponClass,
    starterWeaponByClass: crafterConfig.starterWeaponByClass,
    chargeAttackByWeaponClass: crafterConfig.chargeAttackByWeaponClass,
    staffChargeByCrystalId: crafterConfig.staffChargeByCrystalId,
    levelBonusTiers: crafterConfig.levelBonusTiers,
    rarityBonusTiers: crafterConfig.rarityBonusTiers,
    foodOverrides: crafterConfig.foodOverrides,
    recipes: {
      equipment: buildEquipmentRecipes(items, crafterConfig.slotConfigs),
      food: buildFoodRecipes(items),
    },
    stats,
    materials,
    food,
    bonusEffects,
    staff,
    fixtures: crafterConfig.fixtures,
  });
}
