import { z } from 'zod';

import type { MapRegionRecord } from '@/lib/mapFishingRelations';
import { isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import { getDisplayStats, hasDisplayEffects } from '@/lib/itemPresentation';
import type { Character, Chest, Fish, Item, Monster } from '@/lib/schemas';
import {
  getCharactersFilterOptionsForData,
  getFishingFilterOptionsForData,
  getItemsFilterOptionsForData,
  getMapRegionsForData,
  getMonsterGroupsForData,
  getMonstersFilterOptionsForData,
} from './data/derived';

type SearchParamRecord = Record<string, string | string[] | undefined>;

const detailSearchSchemaShape = {
  detail: z.string().trim().min(1).optional().catch(undefined),
  detailType: z.string().trim().min(1).optional().catch(undefined),
  detailId: z.string().trim().min(1).optional().catch(undefined),
};

const itemsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  type: z.string().trim().min(1).optional().catch(undefined),
  category: z.string().trim().min(1).optional().catch(undefined),
  region: z.string().trim().min(1).optional().catch(undefined),
  ship: z.string().trim().min(1).optional().catch(undefined),
  buyable: z.string().trim().min(1).optional().catch(undefined),
  sellable: z.string().trim().min(1).optional().catch(undefined),
  rarity: z.string().trim().min(1).optional().catch(undefined),
  craft: z.string().trim().min(1).optional().catch(undefined),
  effects: z.string().trim().min(1).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

export type ItemsSearchParams = z.infer<typeof itemsSearchSchema>;

export type CatalogOption = {
  label: string;
  value: string;
};

export type ItemsCatalogData = {
  totalCount: number;
  results: Item[];
  filterOptions: {
    type: CatalogOption[];
    category: CatalogOption[];
    region: CatalogOption[];
    rarity: CatalogOption[];
  };
};

const charactersSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  category: z.string().trim().min(1).optional().catch(undefined),
  gender: z.string().trim().min(1).optional().catch(undefined),
  season: z.string().trim().min(1).optional().catch(undefined),
  battle: z.string().trim().min(1).optional().catch(undefined),
  weaponType: z.string().trim().min(1).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

const monstersSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  tameable: z.string().trim().min(1).optional().catch(undefined),
  boss: z.string().trim().min(1).optional().catch(undefined),
  rideable: z.string().trim().min(1).optional().catch(undefined),
  location: z.string().trim().min(1).optional().catch(undefined),
  drops: z.string().trim().min(1).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

const fishingSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  shadow: z.string().trim().min(1).optional().catch(undefined),
  region: z.string().trim().min(1).optional().catch(undefined),
  season: z.string().trim().min(1).optional().catch(undefined),
  hasMap: z.string().trim().min(1).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

const mapsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  hasFishing: z.string().trim().min(1).optional().catch(undefined),
  hasNotes: z.string().trim().min(1).optional().catch(undefined),
  hasRecipe: z.string().trim().min(1).optional().catch(undefined),
  chestBand: z.string().trim().min(1).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

const calendarSearchSchema = z.object({
  season: z.enum(['Spring', 'Summer', 'Fall', 'Winter']).optional().catch(undefined),
  ...detailSearchSchemaShape,
});

const crafterSearchSchema = z.object({
  build: z.string().trim().min(1).optional().catch(undefined),
  view: z.string().trim().min(1).optional().catch(undefined),
});

export type CharactersSearchParams = z.infer<typeof charactersSearchSchema>;
export type MonstersSearchParams = z.infer<typeof monstersSearchSchema>;
export type FishingSearchParams = z.infer<typeof fishingSearchSchema>;
export type MapsSearchParams = z.infer<typeof mapsSearchSchema>;
export type CalendarSearchParams = z.infer<typeof calendarSearchSchema>;
export type CrafterSearchParams = z.infer<typeof crafterSearchSchema>;

export type CharactersCatalogData = {
  totalCount: number;
  results: Character[];
  filterOptions: {
    category: CatalogOption[];
    gender: CatalogOption[];
    season: CatalogOption[];
    weaponType: CatalogOption[];
  };
};

export type MonstersCatalogData = {
  totalCount: number;
  results: MonsterGroup[];
  filterOptions: {
    location: CatalogOption[];
  };
};

export type FishingCatalogData = {
  totalCount: number;
  results: Fish[];
  filterOptions: {
    shadow: CatalogOption[];
    region: CatalogOption[];
    season: CatalogOption[];
  };
};

export type MapsCatalogData = {
  totalCount: number;
  results: MapRegionRecord[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const seasonSortOrder = ['spring', 'summer', 'fall', 'winter'] as const;

function getSeasonSortValue(season: string | null | undefined) {
  if (!season) {
    return Number.MAX_SAFE_INTEGER;
  }

  const index = seasonSortOrder.indexOf(season.toLowerCase() as (typeof seasonSortOrder)[number]);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function compareNullableNumber(
  left: number | null | undefined,
  right: number | null | undefined,
  direction: 'asc' | 'desc',
) {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return direction === 'asc' ? left - right : right - left;
}

function compareNullableText(
  left: string | null | undefined,
  right: string | null | undefined,
  direction: 'asc' | 'desc',
) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return direction === 'asc'
    ? left.localeCompare(right)
    : right.localeCompare(left);
}

function sortByName<T>(values: T[], getName: (value: T) => string, direction: 'asc' | 'desc' = 'asc') {
  return values.toSorted((left, right) => (
    direction === 'asc'
      ? getName(left).localeCompare(getName(right))
      : getName(right).localeCompare(getName(left))
  ));
}

function sortByNumber<T>(
  values: T[],
  getValue: (value: T) => number | null | undefined,
  getName: (value: T) => string,
  direction: 'asc' | 'desc',
) {
  return values.toSorted((left, right) => (
    compareNullableNumber(getValue(left), getValue(right), direction)
    || getName(left).localeCompare(getName(right))
  ));
}

function sortByText<T>(
  values: T[],
  getValue: (value: T) => string | null | undefined,
  getName: (value: T) => string,
  direction: 'asc' | 'desc',
) {
  return values.toSorted((left, right) => (
    compareNullableText(getValue(left), getValue(right), direction)
    || getName(left).localeCompare(getName(right))
  ));
}

function sortCharactersByBirthday(characters: Character[], direction: 'asc' | 'desc') {
  return characters.toSorted((left, right) => {
    const leftMissing = !left.birthday?.season || left.birthday.day == null;
    const rightMissing = !right.birthday?.season || right.birthday.day == null;

    if (leftMissing && rightMissing) {
      return left.name.localeCompare(right.name);
    }

    if (leftMissing) {
      return 1;
    }

    if (rightMissing) {
      return -1;
    }

    const seasonDelta = compareNullableNumber(
      getSeasonSortValue(left.birthday?.season),
      getSeasonSortValue(right.birthday?.season),
      direction,
    );

    if (seasonDelta !== 0) {
      return seasonDelta;
    }

    return compareNullableNumber(left.birthday?.day, right.birthday?.day, direction)
      || left.name.localeCompare(right.name);
  });
}

function getItemStat(item: Item, key: keyof NonNullable<Item['stats']>) {
  return getDisplayStats(item)?.[key];
}

function getItemCraftingLevel(item: Item) {
  const recipeLevels = [...(item.craft ?? []), ...(item.craftedFrom ?? [])]
    .map((recipe) => recipe.level)
    .filter((level) => typeof level === 'number');

  if (recipeLevels.length === 0) {
    return undefined;
  }

  return Math.min(...recipeLevels);
}

function getFishRegionCount(fish: Fish) {
  return new Set((fish.locations ?? []).map((location) => location.region)).size;
}

function getMapRoomCount(region: MapRegionRecord) {
  return new Set(region.chests.map((chest) => chest.roomCode)).size;
}

function getMapNoteChestCount(region: MapRegionRecord) {
  return region.chests.filter((chest) => chest.notes).length;
}

function getMapRecipeChestCount(region: MapRegionRecord) {
  return region.chests.filter((chest) => chest.recipe).length;
}

function applyCharactersSort(characters: Character[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return sortByName(characters, (character) => character.name, 'desc');
    case 'birthday-asc':
      return sortCharactersByBirthday(characters, 'asc');
    case 'birthday-desc':
      return sortCharactersByBirthday(characters, 'desc');
    case 'weapon-type-asc':
      return sortByText(characters, (character) => character.battle?.weaponType, (character) => character.name, 'asc');
    case 'weapon-type-desc':
      return sortByText(characters, (character) => character.battle?.weaponType, (character) => character.name, 'desc');
    case 'level-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.level, (character) => character.name, 'asc');
    case 'level-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.level, (character) => character.name, 'desc');
    case 'hp-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.hp, (character) => character.name, 'asc');
    case 'hp-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.hp, (character) => character.name, 'desc');
    case 'atk-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.atk, (character) => character.name, 'asc');
    case 'atk-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.atk, (character) => character.name, 'desc');
    case 'def-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.def, (character) => character.name, 'asc');
    case 'def-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.def, (character) => character.name, 'desc');
    case 'matk-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.matk, (character) => character.name, 'asc');
    case 'matk-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.matk, (character) => character.name, 'desc');
    case 'mdef-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.mdef, (character) => character.name, 'asc');
    case 'mdef-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.mdef, (character) => character.name, 'desc');
    case 'str-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.str, (character) => character.name, 'asc');
    case 'str-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.str, (character) => character.name, 'desc');
    case 'vit-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.vit, (character) => character.name, 'asc');
    case 'vit-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.vit, (character) => character.name, 'desc');
    case 'int-asc':
      return sortByNumber(characters, (character) => character.battle?.stats?.int, (character) => character.name, 'asc');
    case 'int-desc':
      return sortByNumber(characters, (character) => character.battle?.stats?.int, (character) => character.name, 'desc');
    case 'name-asc':
    default:
      return sortByName(characters, (character) => character.name, 'asc');
  }
}

function applyMonstersSort(groups: MonsterGroup[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return sortByName(groups, (group) => group.displayName, 'desc');
    case 'location-asc':
      return sortByText(groups, (group) => group.locations[0] ?? group.representative.location, (group) => group.displayName, 'asc');
    case 'location-desc':
      return sortByText(groups, (group) => group.locations[0] ?? group.representative.location, (group) => group.displayName, 'desc');
    case 'level-asc':
      return sortByNumber(groups, (group) => group.representative.stats.baseLevel, (group) => group.displayName, 'asc');
    case 'level-desc':
      return sortByNumber(groups, (group) => group.representative.stats.baseLevel, (group) => group.displayName, 'desc');
    case 'hp-asc':
      return sortByNumber(groups, (group) => group.representative.stats.hp, (group) => group.displayName, 'asc');
    case 'hp-desc':
      return sortByNumber(groups, (group) => group.representative.stats.hp, (group) => group.displayName, 'desc');
    case 'atk-asc':
      return sortByNumber(groups, (group) => group.representative.stats.atk, (group) => group.displayName, 'asc');
    case 'atk-desc':
      return sortByNumber(groups, (group) => group.representative.stats.atk, (group) => group.displayName, 'desc');
    case 'def-asc':
      return sortByNumber(groups, (group) => group.representative.stats.def, (group) => group.displayName, 'asc');
    case 'def-desc':
      return sortByNumber(groups, (group) => group.representative.stats.def, (group) => group.displayName, 'desc');
    case 'matk-asc':
      return sortByNumber(groups, (group) => group.representative.stats.matk, (group) => group.displayName, 'asc');
    case 'matk-desc':
      return sortByNumber(groups, (group) => group.representative.stats.matk, (group) => group.displayName, 'desc');
    case 'mdef-asc':
      return sortByNumber(groups, (group) => group.representative.stats.mdef, (group) => group.displayName, 'asc');
    case 'mdef-desc':
      return sortByNumber(groups, (group) => group.representative.stats.mdef, (group) => group.displayName, 'desc');
    case 'str-asc':
      return sortByNumber(groups, (group) => group.representative.stats.str, (group) => group.displayName, 'asc');
    case 'str-desc':
      return sortByNumber(groups, (group) => group.representative.stats.str, (group) => group.displayName, 'desc');
    case 'vit-asc':
      return sortByNumber(groups, (group) => group.representative.stats.vit, (group) => group.displayName, 'asc');
    case 'vit-desc':
      return sortByNumber(groups, (group) => group.representative.stats.vit, (group) => group.displayName, 'desc');
    case 'int-asc':
      return sortByNumber(groups, (group) => group.representative.stats.int, (group) => group.displayName, 'asc');
    case 'int-desc':
      return sortByNumber(groups, (group) => group.representative.stats.int, (group) => group.displayName, 'desc');
    case 'exp-asc':
      return sortByNumber(groups, (group) => group.representative.stats.exp, (group) => group.displayName, 'asc');
    case 'exp-desc':
      return sortByNumber(groups, (group) => group.representative.stats.exp, (group) => group.displayName, 'desc');
    case 'name-asc':
    default:
      return sortByName(groups, (group) => group.displayName, 'asc');
  }
}

function applyFishingSort(fish: Fish[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return sortByName(fish, (entry) => entry.name, 'desc');
    case 'shadow-asc':
      return sortByText(fish, (entry) => entry.shadow, (entry) => entry.name, 'asc');
    case 'shadow-desc':
      return sortByText(fish, (entry) => entry.shadow, (entry) => entry.name, 'desc');
    case 'buy-asc':
      return sortByNumber(fish, (entry) => entry.buy, (entry) => entry.name, 'asc');
    case 'buy-desc':
      return sortByNumber(fish, (entry) => entry.buy, (entry) => entry.name, 'desc');
    case 'sell-asc':
      return sortByNumber(fish, (entry) => entry.sell, (entry) => entry.name, 'asc');
    case 'sell-desc':
      return sortByNumber(fish, (entry) => entry.sell, (entry) => entry.name, 'desc');
    case 'regions-asc':
      return sortByNumber(fish, getFishRegionCount, (entry) => entry.name, 'asc');
    case 'regions-desc':
      return sortByNumber(fish, getFishRegionCount, (entry) => entry.name, 'desc');
    case 'locations-asc':
      return sortByNumber(fish, (entry) => entry.locations?.length, (entry) => entry.name, 'asc');
    case 'locations-desc':
      return sortByNumber(fish, (entry) => entry.locations?.length, (entry) => entry.name, 'desc');
    case 'name-asc':
    default:
      return sortByName(fish, (entry) => entry.name, 'asc');
  }
}

function applyMapsSort(regions: MapRegionRecord[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return sortByName(regions, (region) => region.name, 'desc');
    case 'rooms-asc':
      return sortByNumber(regions, getMapRoomCount, (region) => region.name, 'asc');
    case 'rooms-desc':
      return sortByNumber(regions, getMapRoomCount, (region) => region.name, 'desc');
    case 'chests-asc':
      return sortByNumber(regions, (region) => region.chests.length, (region) => region.name, 'asc');
    case 'chests-desc':
      return sortByNumber(regions, (region) => region.chests.length, (region) => region.name, 'desc');
    case 'notes-asc':
      return sortByNumber(regions, getMapNoteChestCount, (region) => region.name, 'asc');
    case 'notes-desc':
      return sortByNumber(regions, getMapNoteChestCount, (region) => region.name, 'desc');
    case 'recipes-asc':
      return sortByNumber(regions, getMapRecipeChestCount, (region) => region.name, 'asc');
    case 'recipes-desc':
      return sortByNumber(regions, getMapRecipeChestCount, (region) => region.name, 'desc');
    case 'fishing-asc':
      return sortByNumber(regions, (region) => region.fishingLocations.length, (region) => region.name, 'asc');
    case 'fishing-desc':
      return sortByNumber(regions, (region) => region.fishingLocations.length, (region) => region.name, 'desc');
    case 'name-asc':
    default:
      return sortByName(regions, (region) => region.name, 'asc');
  }
}

function applyItemsSort(items: Item[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return sortByName(items, (item) => item.name, 'desc');
    case 'buy-asc':
      return sortByNumber(items, (item) => item.buy, (item) => item.name, 'asc');
    case 'buy-desc':
      return sortByNumber(items, (item) => item.buy, (item) => item.name, 'desc');
    case 'level-asc':
      return sortByNumber(items, getItemCraftingLevel, (item) => item.name, 'asc');
    case 'level-desc':
      return sortByNumber(items, getItemCraftingLevel, (item) => item.name, 'desc');
    case 'sell-asc':
      return sortByNumber(items, (item) => item.sell, (item) => item.name, 'asc');
    case 'rarity-asc':
      return sortByNumber(items, (item) => item.rarityPoints, (item) => item.name, 'asc');
    case 'rarity-desc':
      return sortByNumber(items, (item) => item.rarityPoints, (item) => item.name, 'desc');
    case 'sell-desc':
      return sortByNumber(items, (item) => item.sell, (item) => item.name, 'desc');
    case 'atk-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'atk'), (item) => item.name, 'asc');
    case 'atk-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'atk'), (item) => item.name, 'desc');
    case 'matk-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'matk'), (item) => item.name, 'asc');
    case 'matk-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'matk'), (item) => item.name, 'desc');
    case 'def-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'def'), (item) => item.name, 'asc');
    case 'def-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'def'), (item) => item.name, 'desc');
    case 'mdef-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'mdef'), (item) => item.name, 'asc');
    case 'mdef-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'mdef'), (item) => item.name, 'desc');
    case 'str-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'str'), (item) => item.name, 'asc');
    case 'str-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'str'), (item) => item.name, 'desc');
    case 'vit-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'vit'), (item) => item.name, 'asc');
    case 'vit-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'vit'), (item) => item.name, 'desc');
    case 'int-asc':
      return sortByNumber(items, (item) => getItemStat(item, 'int'), (item) => item.name, 'asc');
    case 'int-desc':
      return sortByNumber(items, (item) => getItemStat(item, 'int'), (item) => item.name, 'desc');
    case 'name-asc':
    default:
      return sortByName(items, (item) => item.name, 'asc');
  }
}

export function parseItemsSearchParams(searchParams: SearchParamRecord): ItemsSearchParams {
  return itemsSearchSchema.parse({
    q: firstValue(searchParams.q),
    view: firstValue(searchParams.view),
    sort: firstValue(searchParams.sort),
    type: firstValue(searchParams.type),
    category: firstValue(searchParams.category),
    region: firstValue(searchParams.region),
    ship: firstValue(searchParams.ship),
    buyable: firstValue(searchParams.buyable),
    sellable: firstValue(searchParams.sellable),
    rarity: firstValue(searchParams.rarity),
    craft: firstValue(searchParams.craft),
    effects: firstValue(searchParams.effects),
    detail: firstValue(searchParams.detail),
    detailType: firstValue(searchParams.detailType),
    detailId: firstValue(searchParams.detailId),
  });
}

export function parseCharactersSearchParams(searchParams: SearchParamRecord): CharactersSearchParams {
  return charactersSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function parseMonstersSearchParams(searchParams: SearchParamRecord): MonstersSearchParams {
  return monstersSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function parseFishingSearchParams(searchParams: SearchParamRecord): FishingSearchParams {
  return fishingSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function parseMapsSearchParams(searchParams: SearchParamRecord): MapsSearchParams {
  return mapsSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function parseCalendarSearchParams(searchParams: SearchParamRecord): CalendarSearchParams {
  return calendarSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function parseCrafterSearchParams(searchParams: SearchParamRecord): CrafterSearchParams {
  return crafterSearchSchema.parse(Object.fromEntries(Object.entries(searchParams).map(([key, value]) => [key, firstValue(value)])));
}

export function buildItemsCatalogData(
  items: Record<string, Item>,
  search: ItemsSearchParams,
  filterOptions = getItemsFilterOptionsForData(items),
): ItemsCatalogData {
  const sourceItems = Object.values(items);
  let results = sourceItems;

  if (search.q) {
    const query = search.q.toLowerCase();
    results = results.filter((item) => item.name.toLowerCase().includes(query));
  }

  if (search.type) {
    results = results.filter((item) => item.type.toLowerCase() === search.type);
  }

  if (search.category) {
    results = results.filter((item) => item.category?.toLowerCase() === search.category);
  }

  if (search.region) {
    results = results.filter((item) => item.region?.toLowerCase() === search.region);
  }

  if (search.ship === 'yes') {
    results = results.filter((item) => Boolean(item.shippable));
  }

  if (search.buyable === 'yes') {
    results = results.filter((item) => (item.buy ?? 0) > 0);
  }

  if (search.sellable === 'yes') {
    results = results.filter((item) => (item.sell ?? 0) > 0);
  }

  if (search.rarity) {
    results = results.filter((item) => item.rarityCategory?.toLowerCase() === search.rarity);
  }

  if (search.craft === 'yes') {
    results = results.filter((item) => Boolean(item.craft?.length || item.craftedFrom?.length));
  }

  if (search.effects === 'yes') {
    results = results.filter((item) => hasDisplayEffects(item));
  }

  return {
    totalCount: sourceItems.length,
    results: applyItemsSort(results, search.sort),
    filterOptions,
  };
}

export function buildCharactersCatalogData(
  characters: Record<string, Character>,
  search: CharactersSearchParams,
  filterOptions = getCharactersFilterOptionsForData(characters),
): CharactersCatalogData {
  const sourceCharacters = Object.values(characters);
  let results = sourceCharacters;

  if (search.q) {
    const query = search.q.toLowerCase();
    results = results.filter((character) => character.name.toLowerCase().includes(query));
  }

  if (search.category) {
    results = results.filter((character) => character.category.toLowerCase() === search.category);
  }

  if (search.gender) {
    results = results.filter((character) => character.gender?.toLowerCase() === search.gender);
  }

  if (search.season) {
    results = results.filter((character) => character.birthday?.season?.toLowerCase() === search.season);
  }

  if (search.battle === 'yes') {
    results = results.filter((character) => Boolean(character.battle));
  }

  if (search.weaponType) {
    results = results.filter((character) => character.battle?.weaponType?.toLowerCase() === search.weaponType);
  }

  return {
    totalCount: sourceCharacters.length,
    results: applyCharactersSort(results, search.sort),
    filterOptions,
  };
}

export function buildMonstersCatalogData(
  monsters: Record<string, Monster>,
  search: MonstersSearchParams,
  filterOptions = getMonstersFilterOptionsForData(monsters),
): MonstersCatalogData {
  const sourceGroups = getMonsterGroupsForData(monsters);
  let results = sourceGroups;

  if (search.q) {
    const query = search.q.toLowerCase();
    results = results.filter((group) => group.searchText.toLowerCase().includes(query));
  }

  if (search.tameable === 'yes') {
    results = results.filter((group) => group.variants.some(isMonsterActuallyTameable));
  }

  if (search.boss === 'yes') {
    results = results.filter((group) => group.variants.some((monster) => monster.location?.toLowerCase().includes('boss')));
  }

  if (search.rideable === 'yes') {
    results = results.filter((group) => group.variants.some((monster) => Boolean(monster.taming?.isRideable)));
  }

  if (search.location) {
    results = results.filter((group) => group.locations.some((location) => location.toLowerCase() === search.location));
  }

  if (search.drops === 'yes') {
    results = results.filter((group) => group.variants.some((monster) => monster.drops.length > 0));
  }

  return {
    totalCount: sourceGroups.length,
    results: applyMonstersSort(results, search.sort),
    filterOptions,
  };
}

export function buildFishingCatalogData(
  fish: Fish[],
  search: FishingSearchParams,
  filterOptions = getFishingFilterOptionsForData(fish),
): FishingCatalogData {
  let results = fish;

  if (search.q) {
    const query = search.q.toLowerCase();
    results = results.filter((entry) => entry.name.toLowerCase().includes(query));
  }

  if (search.shadow) {
    results = results.filter((entry) => entry.shadow === search.shadow);
  }

  if (search.region) {
    results = results.filter((entry) => (entry.locations ?? []).some((location) => location.region.toLowerCase() === search.region));
  }

  if (search.season) {
    results = results.filter((entry) => (entry.locations ?? []).some((location) => location.seasons?.some((season) => season.toLowerCase() === search.season)));
  }

  if (search.hasMap === 'yes') {
    results = results.filter((entry) => (entry.locations ?? []).some((location) => Boolean(location.map)));
  }

  return {
    totalCount: fish.length,
    results: applyFishingSort(results, search.sort),
    filterOptions,
  };
}

export function buildMapsCatalogData(
  chests: Chest[],
  fish: Fish[],
  search: MapsSearchParams,
): MapsCatalogData {
  const sourceRegions = getMapRegionsForData(chests, fish);
  let results = sourceRegions;

  if (search.q) {
    const query = search.q.toLowerCase();
    results = results.filter((region) => region.name.toLowerCase().includes(query));
  }

  if (search.hasFishing === 'yes') {
    results = results.filter((region) => region.fishingLocations.length > 0);
  }

  if (search.hasNotes === 'yes') {
    results = results.filter((region) => region.chests.some((chest) => Boolean(chest.notes)));
  }

  if (search.hasRecipe === 'yes') {
    results = results.filter((region) => region.chests.some((chest) => Boolean(chest.recipe)));
  }

  if (search.chestBand === 'low') {
    results = results.filter((region) => region.chests.length <= 2);
  }

  if (search.chestBand === 'medium') {
    results = results.filter((region) => region.chests.length >= 3 && region.chests.length <= 5);
  }

  if (search.chestBand === 'high') {
    results = results.filter((region) => region.chests.length >= 6);
  }

  return {
    totalCount: sourceRegions.length,
    results: applyMapsSort(results, search.sort),
  };
}
