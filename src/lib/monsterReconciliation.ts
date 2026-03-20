import type { Monster } from './schemas';

export const MONSTER_CSV_INDEXES = {
  name: 0,
  drop1Name: 1,
  drop1Rate: 3,
  drop2Name: 4,
  drop2Rate: 6,
  drop3Name: 7,
  drop3Rate: 9,
  drop4Name: 10,
  drop4Rate: 12,
  baseLevel: 26,
  hp: 27,
  str: 28,
  int: 29,
  vit: 30,
  exp: 31,
  atk: 32,
  matk: 33,
  def: 35,
  mdef: 36,
  dizAttack: 34,
  dizResist: 45,
  knockDistance: 46,
  additionalStunTime: 47,
  knockResist: 48,
  critAttack: 50,
  critResist: 51,
  fire: 55,
  water: 56,
  earth: 57,
  wind: 58,
  light: 59,
  dark: 60,
  normal: 61,
  love: 62,
  poison: 63,
  seal: 64,
  paralysis: 65,
  sleep: 66,
  fatigue: 67,
  illness: 68,
  faint: 69,
  hpDrain: 70,
  friendliness: 72,
  produceName: 85,
  produceChance: 87,
  location: 89,
} as const;

const DROP_INDEX_PAIRS = [
  [MONSTER_CSV_INDEXES.drop1Name, MONSTER_CSV_INDEXES.drop1Rate],
  [MONSTER_CSV_INDEXES.drop2Name, MONSTER_CSV_INDEXES.drop2Rate],
  [MONSTER_CSV_INDEXES.drop3Name, MONSTER_CSV_INDEXES.drop3Rate],
  [MONSTER_CSV_INDEXES.drop4Name, MONSTER_CSV_INDEXES.drop4Rate],
] as const;

const RESISTANCE_INDEXES = {
  fire: MONSTER_CSV_INDEXES.fire,
  water: MONSTER_CSV_INDEXES.water,
  earth: MONSTER_CSV_INDEXES.earth,
  wind: MONSTER_CSV_INDEXES.wind,
  light: MONSTER_CSV_INDEXES.light,
  dark: MONSTER_CSV_INDEXES.dark,
  normal: MONSTER_CSV_INDEXES.normal,
  love: MONSTER_CSV_INDEXES.love,
  poison: MONSTER_CSV_INDEXES.poison,
  seal: MONSTER_CSV_INDEXES.seal,
  paralysis: MONSTER_CSV_INDEXES.paralysis,
  sleep: MONSTER_CSV_INDEXES.sleep,
  fatigue: MONSTER_CSV_INDEXES.fatigue,
  illness: MONSTER_CSV_INDEXES.illness,
  faint: MONSTER_CSV_INDEXES.faint,
  hpDrain: MONSTER_CSV_INDEXES.hpDrain,
  dizAttack: MONSTER_CSV_INDEXES.dizAttack,
  dizResist: MONSTER_CSV_INDEXES.dizResist,
  knockDistance: MONSTER_CSV_INDEXES.knockDistance,
  additionalStunTime: MONSTER_CSV_INDEXES.additionalStunTime,
  knockResist: MONSTER_CSV_INDEXES.knockResist,
  critAttack: MONSTER_CSV_INDEXES.critAttack,
  critResist: MONSTER_CSV_INDEXES.critResist,
} as const;

type ParsedDrop = {
  name: string;
  dropRates: number[];
};

export type ParsedMonsterCsvRecord = {
  name: string;
  location: string | null;
  drops: ParsedDrop[];
  stats: Monster['stats'];
  resistances: Record<string, number | null>;
  friendliness: number | null;
  produceName: string | null;
};

export type ReconciliationReport = {
  ignoredNames: string[];
  addedRecords: string[];
  updatedLocations: string[];
  updatedStats: string[];
  updatedResistances: string[];
  updatedFriendliness: string[];
  produceFallbackApplied: string[];
  groupedVariantFamilies: string[];
};

function getCell(row: string[], index: number) {
  return (row[index] ?? '').trim();
}

function parseNumber(value: string) {
  if (!value) return null;
  const normalized = value.replace('%', '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugifyMonsterName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseVariantName(name: string) {
  const match = /^(.*)\s(\d+)$/.exec(name);
  if (!match) {
    return { variantGroup: null, variantSuffix: null };
  }

  return {
    variantGroup: match[1],
    variantSuffix: match[2],
  };
}

export function parseMonsterCsvRows(rows: string[][]) {
  const aggregated = new Map<string, ParsedMonsterCsvRecord & { locationParts: string[]; dropMap: Map<string, Set<number>> }>();

  for (const row of rows) {
    const name = getCell(row, MONSTER_CSV_INDEXES.name);
    if (!name || name === '???') continue;

    const existing = aggregated.get(name) ?? {
      name,
      location: null,
      locationParts: [],
      drops: [],
      dropMap: new Map<string, Set<number>>(),
      stats: {
        baseLevel: parseNumber(getCell(row, MONSTER_CSV_INDEXES.baseLevel)),
        hp: parseNumber(getCell(row, MONSTER_CSV_INDEXES.hp)),
        atk: parseNumber(getCell(row, MONSTER_CSV_INDEXES.atk)),
        def: parseNumber(getCell(row, MONSTER_CSV_INDEXES.def)),
        matk: parseNumber(getCell(row, MONSTER_CSV_INDEXES.matk)),
        mdef: parseNumber(getCell(row, MONSTER_CSV_INDEXES.mdef)),
        str: parseNumber(getCell(row, MONSTER_CSV_INDEXES.str)),
        int: parseNumber(getCell(row, MONSTER_CSV_INDEXES.int)),
        vit: parseNumber(getCell(row, MONSTER_CSV_INDEXES.vit)),
        exp: parseNumber(getCell(row, MONSTER_CSV_INDEXES.exp)),
        bonus: null,
      },
      resistances: Object.fromEntries(
        Object.entries(RESISTANCE_INDEXES).map(([key, index]) => [key, parseNumber(getCell(row, index))])
      ),
      friendliness: parseNumber(getCell(row, MONSTER_CSV_INDEXES.friendliness)),
      produceName: getCell(row, MONSTER_CSV_INDEXES.produceName) || null,
    };

    const location = getCell(row, MONSTER_CSV_INDEXES.location);
    if (location && !existing.locationParts.includes(location)) {
      existing.locationParts.push(location);
    }

    for (const [nameIndex, rateIndex] of DROP_INDEX_PAIRS) {
      const dropName = getCell(row, nameIndex);
      if (!dropName) continue;

      const dropRates = existing.dropMap.get(dropName) ?? new Set<number>();
      const rate = parseNumber(getCell(row, rateIndex));
      if (rate !== null) {
        dropRates.add(rate);
      }
      existing.dropMap.set(dropName, dropRates);
    }

    aggregated.set(name, existing);
  }

  return [...aggregated.values()].map((record) => ({
    name: record.name,
    location: record.locationParts.length > 0 ? record.locationParts.join(', ') : null,
    drops: [...record.dropMap.entries()].map(([name, rates]) => ({
      name,
      dropRates: [...rates].sort((a, b) => b - a),
    })),
    stats: record.stats,
    resistances: record.resistances,
    friendliness: record.friendliness,
    produceName: record.produceName,
  }));
}

export function reconcileMonstersFromCsv(
  parsedRecords: ParsedMonsterCsvRecord[],
  existingMonsters: Record<string, Monster>,
  itemIdsByName: Record<string, string | null>
) {
  const existingEntriesByName = new Map<string, { key: string; monster: Monster }>(
    Object.entries(existingMonsters).map(([key, monster]) => [monster.name, { key, monster }])
  );
  const variantFamilies = new Set<string>();

  for (const record of parsedRecords) {
    const variant = parseVariantName(record.name);
    if (variant.variantGroup) {
      variantFamilies.add(variant.variantGroup);
    }
  }

  const report: ReconciliationReport = {
    ignoredNames: ['???'],
    addedRecords: [],
    updatedLocations: [],
    updatedStats: [],
    updatedResistances: [],
    updatedFriendliness: [],
    produceFallbackApplied: [],
    groupedVariantFamilies: [...variantFamilies].sort(),
  };

  const nextMonsters: Record<string, Monster> = {};

  for (const record of parsedRecords) {
    const existing = existingEntriesByName.get(record.name);
    const parsedVariant = parseVariantName(record.name);
    const familyName = parsedVariant.variantGroup ?? (variantFamilies.has(record.name) ? record.name : null);
    const variantSuffix = parsedVariant.variantGroup ? parsedVariant.variantSuffix : null;
    const existingTaming = existing?.monster.taming;
    const hasCsvFriendliness = record.friendliness !== null;
    const shouldRevalidateTaming = Boolean(existingTaming?.tameable && (record.friendliness ?? 0) > 0);
    const nextBefriend = existingTaming?.tameable && hasCsvFriendliness
      ? record.friendliness
      : existingTaming?.befriend ?? null;
    const isActuallyTameable = Boolean(existingTaming?.tameable && (nextBefriend ?? 0) > 0);

    const dropIdByName = new Map(
      (existing?.monster.drops ?? []).map((drop) => [drop.name, drop.id])
    );

    const reconciled: Monster = {
      ...(existing?.monster ?? {
        id: `monster-${slugifyMonsterName(record.name)}`,
        image: '/images/monsters/unknown',
        description: null,
        nickname: [],
        taming: {
          tameable: false,
          isRideable: null,
          befriend: null,
          favorite: [],
          produce: [],
          cycle: null,
        },
      }),
      name: record.name,
      variantGroup: familyName ?? undefined,
      variantSuffix,
      location: record.location,
      drops: record.drops.map((drop) => ({
        id: dropIdByName.get(drop.name) ?? itemIdsByName[drop.name] ?? null,
        name: drop.name,
        dropRates: drop.dropRates,
      })),
      stats: {
        ...existing?.monster.stats,
        ...record.stats,
        bonus: existing?.monster.stats.bonus ?? null,
      },
      resistances: record.resistances,
      taming: {
        tameable: isActuallyTameable,
        isRideable: existingTaming?.isRideable ?? null,
        befriend: nextBefriend,
        favorite: isActuallyTameable ? existingTaming?.favorite ?? [] : [],
        produce:
          isActuallyTameable && existingTaming?.produce && existingTaming.produce.length > 0
            ? existingTaming.produce
            : isActuallyTameable && shouldRevalidateTaming && record.produceName
              ? [{
                  id: itemIdsByName[record.produceName] ?? null,
                  name: record.produceName,
                  level: null,
                }]
              : [],
        cycle: isActuallyTameable ? existingTaming?.cycle ?? null : null,
      },
    };

    if (!existing) {
      report.addedRecords.push(record.name);
    } else {
      if (existing.monster.location !== reconciled.location) report.updatedLocations.push(record.name);
      if (JSON.stringify(existing.monster.stats) !== JSON.stringify(reconciled.stats)) report.updatedStats.push(record.name);
      if (JSON.stringify(existing.monster.resistances ?? {}) !== JSON.stringify(reconciled.resistances ?? {})) report.updatedResistances.push(record.name);
      if (existing.monster.taming?.befriend !== reconciled.taming?.befriend) report.updatedFriendliness.push(record.name);
      if ((existing.monster.taming?.produce?.length ?? 0) === 0 && (reconciled.taming?.produce?.length ?? 0) > 0) {
        report.produceFallbackApplied.push(record.name);
      }
    }

    nextMonsters[existing?.key ?? reconciled.id] = reconciled;
  }

  return { monsters: nextMonsters, report };
}
