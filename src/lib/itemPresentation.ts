import type { CrafterEquipmentPayload, CrafterFoodPayload, Item } from './schemas';
import { normalizeCrafterStation } from './crafterData';

export type DisplayEffect =
  | NonNullable<Item['effects']>[number]
  | {
      type: 'label';
      label: string;
    };

type DisplayRole = 'weapon' | 'armor' | 'food';

const FRACTIONAL_STAT_KEYS = new Set(['crit', 'drain', 'knock', 'stun']);

const WEAPON_STATIONS = new Set(['Short Sword', 'Long Sword', 'Spear', 'Axe/Hammer', 'Staff', 'Dual Blade', 'Fist', 'Farm']);
const ARMOR_STATIONS = new Set(['Armor', 'Headgear', 'Shield', 'Accessory', 'Shoes']);

const CATEGORY_TO_ROLE: Record<string, DisplayRole | undefined> = {
  shortSword: 'weapon',
  longSword: 'weapon',
  spear: 'weapon',
  axeHammer: 'weapon',
  dualBlade: 'weapon',
  fist: 'weapon',
  staff: 'weapon',
  tool: 'weapon',
  armor: 'armor',
  headgear: 'armor',
  shield: 'armor',
  accessory: 'armor',
  shoes: 'armor',
};

const RESISTANCE_TARGETS: Record<string, string> = {
  fire: 'fire',
  water: 'water',
  earth: 'earth',
  wind: 'wind',
  light: 'light',
  dark: 'dark',
  love: 'love',
  no: 'normal',
  diz: 'dizzy',
  crit: 'crit resist',
  knock: 'knock resist',
  psn: 'poison',
  seal: 'seal',
  par: 'paralysis',
  slp: 'sleep',
  ftg: 'fatigue',
  sick: 'illness',
  fnt: 'faint',
  drain: 'hp drain',
};

const STATUS_TARGETS: Record<string, string> = {
  psn: 'poison',
  seal: 'seal',
  par: 'paralysis',
  slp: 'sleep',
  ftg: 'fatigue',
  sick: 'illness',
  faint: 'faint',
  drain: 'hp drain',
};

const FOOD_CURE_FLAGS: Array<readonly [string, string]> = [
  ['psnHeal', 'poison'],
  ['parHeal', 'paralysis'],
  ['sealHeal', 'seal'],
  ['slpHeal', 'sleep'],
  ['ftgHeal', 'fatigue'],
  ['sickHeal', 'illness'],
];

const SPECIAL_RULE_LABELS: Record<string, string> = {
  invert: 'Inverts following upgrade effects',
  doublePrevious: 'Doubles the previous regular upgrade',
  tenFoldPrevious: 'Applies the previous regular upgrade eight extra times',
  lightOre: 'Transfers the base weapon class with Light Ore',
};

function roundDisplayValue(value: number) {
  return Number(value.toFixed(4));
}

function hasOwnKeys(value: object | undefined) {
  return Boolean(value && Object.keys(value).length > 0);
}

function toDisplayStats(stats: Item['stats'] | undefined) {
  if (!hasOwnKeys(stats)) return undefined;
  const entries = Object.entries(stats ?? {})
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => [key, FRACTIONAL_STAT_KEYS.has(key) ? roundDisplayValue((value as number) * 100) : value]);
  return entries.length > 0 ? (Object.fromEntries(entries) as NonNullable<Item['stats']>) : undefined;
}

function toDisplayFoodSummary(payload: Omit<CrafterFoodPayload, 'itemName'> | CrafterFoodPayload | undefined) {
  if (!payload) return undefined;
  const healingEntries = Object.entries(payload.multipliers ?? {})
    .filter(([key, value]) => (key === 'hp' || key === 'rp') && value != null && value !== 0)
    .map(([key, value]) => [`${key}Percent`, roundDisplayValue((value as number) * 100)]);
  const statMultiplierEntries = Object.entries(payload.multipliers ?? {})
    .filter(([key, value]) => key !== 'hp' && key !== 'rp' && value != null && value !== 0)
    .map(([key, value]) => [key, roundDisplayValue((value as number) * 100)]);

  if (healingEntries.length === 0 && statMultiplierEntries.length === 0) {
    return undefined;
  }

  return {
    healing: healingEntries.length > 0 ? (Object.fromEntries(healingEntries) as NonNullable<Item['healing']>) : undefined,
    statMultipliers:
      statMultiplierEntries.length > 0
        ? (Object.fromEntries(statMultiplierEntries) as NonNullable<Item['statMultipliers']>)
        : undefined,
  };
}

function effectsFromResistances(resistances: CrafterEquipmentPayload['resistances'] | CrafterFoodPayload['resistances'] | undefined) {
  return Object.entries(resistances ?? {})
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => ({
      type: 'resistance' as const,
      target: RESISTANCE_TARGETS[key] ?? key,
      value: roundDisplayValue((value as number) * 100),
    }));
}

function effectsFromStatusAttacks(
  statusAttacks: CrafterEquipmentPayload['statusAttacks'] | CrafterFoodPayload['statusAttacks'] | undefined,
  trigger: 'attack' | 'consume',
) {
  return Object.entries(statusAttacks ?? {})
    .filter(([, value]) => value != null && value !== 0)
    .map(([key, value]) => ({
      type: 'inflict' as const,
      target: STATUS_TARGETS[key] ?? key,
      trigger,
      chance: roundDisplayValue((value as number) * 100),
    }));
}

function effectsFromFoodStatus(status: CrafterFoodPayload['status']) {
  return FOOD_CURE_FLAGS.filter(([key]) => Number(status?.[key] ?? 0) !== 0).map(([, target]) => ({
    type: 'cure' as const,
    targets: [target],
  }));
}

function dedupeEffects(effects: DisplayEffect[]) {
  const seen = new Set<string>();
  return effects.filter((effect) => {
    const key = effect.type === 'label'
      ? `label:${effect.label}`
      : effect.type === 'cure'
        ? `cure:${effect.targets.join('|')}`
        : effect.type === 'resistance'
          ? `resistance:${effect.target}:${effect.value}`
          : `inflict:${effect.target}:${effect.trigger}:${effect.chance ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasNonZeroValues(value: Record<string, number | undefined> | undefined) {
  if (!value) {
    return false;
  }

  for (const entry of Object.values(value)) {
    if (entry != null && entry !== 0) {
      return true;
    }
  }

  return false;
}

function hasFoodStatusEffect(status: CrafterFoodPayload['status']) {
  return FOOD_CURE_FLAGS.some(([key]) => Number(status?.[key] ?? 0) !== 0);
}

function getRoleFromCraft(item: Item): DisplayRole | undefined {
  for (const craft of item.craft ?? []) {
    if (craft.stationType === 'Cooking') return 'food';
    const normalized = normalizeCrafterStation(craft.station);
    if (normalized && WEAPON_STATIONS.has(normalized)) return 'weapon';
    if (normalized && ARMOR_STATIONS.has(normalized)) return 'armor';
  }
  return undefined;
}

function getDisplayRole(item: Item): DisplayRole | undefined {
  if (item.crafter?.foodBase || item.craft?.some((craft) => craft.stationType === 'Cooking')) {
    return 'food';
  }

  if (item.category && CATEGORY_TO_ROLE[item.category]) {
    return CATEGORY_TO_ROLE[item.category];
  }

  const craftRole = getRoleFromCraft(item);
  if (craftRole) return craftRole;

  if (item.crafter?.equipment?.armor && !item.crafter?.equipment?.weapon) return 'armor';
  if (item.crafter?.equipment?.weapon) return 'weapon';
  if (item.crafter?.equipment?.armor) return 'armor';
  return undefined;
}

function mergeEquipmentStats(item: Item) {
  return {
    ...(item.crafter?.material?.armor?.stats ?? {}),
    ...(item.crafter?.material?.weapon?.stats ?? {}),
  };
}

function mergeEquipmentResistances(item: Item) {
  return {
    ...(item.crafter?.material?.armor?.resistances ?? {}),
    ...(item.crafter?.material?.weapon?.resistances ?? {}),
  };
}

function mergeEquipmentStatusAttacks(item: Item) {
  return {
    ...(item.crafter?.material?.armor?.statusAttacks ?? {}),
    ...(item.crafter?.material?.weapon?.statusAttacks ?? {}),
  };
}

function getLegacyFoodSummary(item: Item) {
  if (!item.healing && !item.statMultipliers) return undefined;
  return {
    healing: item.healing,
    statMultipliers: item.statMultipliers,
  };
}

function getDisplayStatsForRole(item: Item, role: DisplayRole | undefined) {
  if (role === 'weapon') {
    return toDisplayStats(item.crafter?.equipment?.weapon?.stats) ?? item.stats;
  }

  if (role === 'armor') {
    return toDisplayStats(item.crafter?.equipment?.armor?.stats) ?? item.stats;
  }

  if (role === 'food') {
    return toDisplayStats(item.crafter?.foodBase?.additive ?? item.crafter?.material?.food?.additive) ?? item.stats;
  }

  return (
    toDisplayStats(item.crafter?.material?.food?.additive)
    ?? toDisplayStats(mergeEquipmentStats(item))
    ?? item.stats
  );
}

export function getDisplayStats(item: Item) {
  return getDisplayStatsForRole(item, getDisplayRole(item));
}

function getDisplayCombatForRole(item: Item, role: DisplayRole | undefined) {
  if (role !== 'weapon') return item.combat;

  const payload = item.crafter?.equipment?.weapon;
  if (!payload) return item.combat;

  const weaponCraft = (item.craft ?? []).find((craft) => craft.stationType === 'Forging');
  const normalizedStation = normalizeCrafterStation(weaponCraft?.station);

  return {
    weaponClass: payload.weaponClass ?? normalizedStation ?? item.combat?.weaponClass,
    attackType: payload.attackType ?? normalizedStation ?? item.combat?.attackType,
    element: payload.element ?? item.combat?.element,
    damageType: payload.damageType ?? item.combat?.damageType,
    geometry: hasOwnKeys(payload.geometry) ? payload.geometry : item.combat?.geometry,
  };
}

export function getDisplayCombat(item: Item) {
  return getDisplayCombatForRole(item, getDisplayRole(item));
}

export function getDisplayFoodSummary(item: Item) {
  return toDisplayFoodSummary(item.crafter?.foodBase ?? item.crafter?.material?.food) ?? getLegacyFoodSummary(item);
}

function getDisplayEffectsForRole(item: Item, role: DisplayRole | undefined): DisplayEffect[] {
  const effects: DisplayEffect[] = [];

  if (role === 'weapon' && item.crafter?.equipment?.weapon) {
    effects.push(...effectsFromResistances(item.crafter.equipment.weapon.resistances));
    effects.push(...effectsFromStatusAttacks(item.crafter.equipment.weapon.statusAttacks, 'attack'));
  } else if (role === 'armor' && item.crafter?.equipment?.armor) {
    effects.push(...effectsFromResistances(item.crafter.equipment.armor.resistances));
    effects.push(...effectsFromStatusAttacks(item.crafter.equipment.armor.statusAttacks, 'attack'));
  } else if (role === 'food' && item.crafter?.foodBase) {
    effects.push(...effectsFromResistances(item.crafter.foodBase.resistances));
    effects.push(...effectsFromStatusAttacks(item.crafter.foodBase.statusAttacks, 'consume'));
  }

  if (role === 'food' || role == null) {
    effects.push(...effectsFromResistances(item.crafter?.material?.food?.resistances));
    effects.push(...effectsFromStatusAttacks(item.crafter?.material?.food?.statusAttacks, 'consume'));
    effects.push(...effectsFromFoodStatus(item.crafter?.material?.food?.status));
  }

  if (role == null) {
    effects.push(...effectsFromResistances(mergeEquipmentResistances(item)));
    effects.push(...effectsFromStatusAttacks(mergeEquipmentStatusAttacks(item), 'attack'));
  }

  if (item.crafter?.specialMaterialRule) {
    effects.push({
      type: 'label',
      label: SPECIAL_RULE_LABELS[item.crafter.specialMaterialRule.behavior] ?? item.name,
    });
  }

  if (item.crafter?.bonusEffect) {
    effects.push({
      type: 'label',
      label: item.name,
    });
  }

  if (effects.length > 0) {
    return dedupeEffects(effects);
  }

  return (item.effects ?? []) as DisplayEffect[];
}

export function getDisplayEffects(item: Item): DisplayEffect[] {
  return getDisplayEffectsForRole(item, getDisplayRole(item));
}

export function hasDisplayEffects(item: Item) {
  const role = getDisplayRole(item);

  if (role === 'weapon' && item.crafter?.equipment?.weapon) {
    return hasNonZeroValues(item.crafter.equipment.weapon.resistances)
      || hasNonZeroValues(item.crafter.equipment.weapon.statusAttacks)
      || Boolean(item.crafter.specialMaterialRule)
      || Boolean(item.crafter.bonusEffect)
      || Boolean(item.effects?.length);
  }

  if (role === 'armor' && item.crafter?.equipment?.armor) {
    return hasNonZeroValues(item.crafter.equipment.armor.resistances)
      || hasNonZeroValues(item.crafter.equipment.armor.statusAttacks)
      || Boolean(item.crafter.specialMaterialRule)
      || Boolean(item.crafter.bonusEffect)
      || Boolean(item.effects?.length);
  }

  if (role === 'food' && item.crafter?.foodBase) {
    return hasNonZeroValues(item.crafter.foodBase.resistances)
      || hasNonZeroValues(item.crafter.foodBase.statusAttacks)
      || hasNonZeroValues(item.crafter.material?.food?.resistances)
      || hasNonZeroValues(item.crafter.material?.food?.statusAttacks)
      || hasFoodStatusEffect(item.crafter.material?.food?.status)
      || Boolean(item.crafter.specialMaterialRule)
      || Boolean(item.crafter.bonusEffect)
      || Boolean(item.effects?.length);
  }

  return hasNonZeroValues(item.crafter?.material?.food?.resistances)
    || hasNonZeroValues(item.crafter?.material?.food?.statusAttacks)
    || hasFoodStatusEffect(item.crafter?.material?.food?.status)
    || hasNonZeroValues(mergeEquipmentResistances(item))
    || hasNonZeroValues(mergeEquipmentStatusAttacks(item))
    || Boolean(item.crafter?.specialMaterialRule)
    || Boolean(item.crafter?.bonusEffect)
    || Boolean(item.effects?.length);
}

export function getDisplayRarity(item: Item) {
  return item.rarityPoints;
}

export function getItemPresentation(item: Item) {
  const role = getDisplayRole(item);
  return {
    stats: getDisplayStatsForRole(item, role),
    combat: getDisplayCombatForRole(item, role),
    food: getDisplayFoodSummary(item),
    effects: getDisplayEffectsForRole(item, role),
  };
}
