import type {
  CrafterDefaults,
  CrafterGeometry,
  CrafterResistanceBlock,
  CrafterSlotKey,
  CrafterStatusAttackBlock,
  Item,
} from './schemas';

export type CrafterBuild = CrafterDefaults;
export type CrafterStatBlock = Partial<NonNullable<Item['stats']>>;
export type ResistanceMap = CrafterResistanceBlock;
export type StatusAttackMap = CrafterStatusAttackBlock;
export type GeometryMap = CrafterGeometry;

type NumericRecord<K extends string> = Partial<Record<K, number>>;

export const FOOD_RECIPE_SLOTS = 6;
export const SLOT_KEYS: CrafterSlotKey[] = ['weapon', 'armor', 'headgear', 'shield', 'accessory', 'shoes'];

export const STAT_KEYS = [
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

export const RESISTANCE_KEYS = [
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

export const STATUS_ATTACK_KEYS = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'faint', 'drain'] as const;
export const GEOMETRY_KEYS = ['depth', 'length', 'width'] as const;
export const MULTIPLIER_STAT_KEYS = ['hp', 'rp', 'hpMax', 'rpMax', 'str', 'int', 'vit'] as const;
export const COOKING_CAPPED_STAT_KEYS = ['crit'] as const;
export const DASHBOARD_STATUS_RES_BASELINE_KEYS = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'fnt'] as const;
export const SHIELD_PARTIAL_SCALING_STAT_KEYS = ['atk', 'matk', 'def', 'mdef', 'str', 'int', 'vit'] as const;

export function createNumericRecord<K extends string>() {
  return {} as NumericRecord<K>;
}

export function cloneNumericRecord<K extends string>(source?: NumericRecord<K>) {
  return { ...(source ?? {}) };
}

export function addNumericRecord<K extends string>(
  target: NumericRecord<K>,
  source: NumericRecord<K> | undefined,
  keys: readonly K[],
  scale = 1,
) {
  if (!source) return;

  for (const key of keys) {
    const value = source[key];
    if (value == null) continue;
    target[key] = (target[key] ?? 0) + value * scale;
  }
}

export function scaleNumericRecord<K extends string>(
  source: NumericRecord<K> | undefined,
  keys: readonly K[],
  scale = 1,
) {
  const next = createNumericRecord<K>();
  addNumericRecord(next, source, keys, scale);
  return next;
}

export function capNumericRecord<K extends string>(
  source: NumericRecord<K>,
  keys: readonly K[],
  max = 1,
) {
  const next = cloneNumericRecord(source) as NumericRecord<K>;

  for (const key of keys) {
    if (next[key] == null) continue;
    next[key] = Math.min(next[key]!, max);
  }

  return next;
}
