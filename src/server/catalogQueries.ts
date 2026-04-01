import { z } from 'zod';

import type { MapRegionRecord } from '@/lib/mapFishingRelations';
import { isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import { hasDisplayEffects } from '@/lib/itemPresentation';
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

function applyCharactersSort(characters: Character[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'birthday-asc':
      return characters.toSorted((left, right) => {
        const seasonDelta =
          getSeasonSortValue(left.birthday?.season) - getSeasonSortValue(right.birthday?.season);

        if (seasonDelta !== 0) {
          return seasonDelta;
        }

        return (left.birthday?.day || 99) - (right.birthday?.day || 99);
      });
    case 'name-asc':
    default:
      return characters.toSorted((left, right) => left.name.localeCompare(right.name));
  }
}

function applyMonstersSort(groups: MonsterGroup[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'level-desc':
      return groups.toSorted((left, right) => (right.representative.stats.baseLevel || 0) - (left.representative.stats.baseLevel || 0));
    case 'name-asc':
    default:
      return groups.toSorted((left, right) => left.displayName.localeCompare(right.displayName));
  }
}

function applyFishingSort(fish: Fish[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'sell-desc':
      return fish.toSorted((left, right) => (right.sell || 0) - (left.sell || 0));
    case 'locations-desc':
      return fish.toSorted((left, right) => (right.locations?.length || 0) - (left.locations?.length || 0));
    case 'name-asc':
    default:
      return fish.toSorted((left, right) => left.name.localeCompare(right.name));
  }
}

function applyMapsSort(regions: MapRegionRecord[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'chests-desc':
      return regions.toSorted((left, right) => right.chests.length - left.chests.length);
    case 'fishing-desc':
      return regions.toSorted((left, right) => right.fishingLocations.length - left.fishingLocations.length);
    case 'name-asc':
    default:
      return regions.toSorted((left, right) => left.name.localeCompare(right.name));
  }
}

function applyItemsSort(items: Item[], sortValue: string | undefined) {
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      return items.toSorted((left, right) => right.name.localeCompare(left.name));
    case 'buy-desc':
      return items.toSorted((left, right) => (right.buy ?? 0) - (left.buy ?? 0));
    case 'sell-asc':
      return items.toSorted((left, right) => (left.sell ?? 0) - (right.sell ?? 0));
    case 'rarity-desc':
      return items.toSorted((left, right) => (right.rarityPoints ?? 0) - (left.rarityPoints ?? 0));
    case 'sell-desc':
      return items.toSorted((left, right) => (right.sell ?? 0) - (left.sell ?? 0));
    case 'name-asc':
    default:
      return items.toSorted((left, right) => left.name.localeCompare(right.name));
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
