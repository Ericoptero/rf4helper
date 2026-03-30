import { z } from 'zod';

import { buildMapRegions, type MapRegionRecord } from '@/lib/mapFishingRelations';
import { buildMonsterGroups, isMonsterActuallyTameable, type MonsterGroup } from '@/lib/monsterGroups';
import { hasDisplayEffects } from '@/lib/itemPresentation';
import type { Character, Chest, Fish, Item, Monster } from '@/lib/schemas';

type SearchParamRecord = Record<string, string | string[] | undefined>;

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
  detail: z.string().trim().min(1).optional().catch(undefined),
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
  detail: z.string().trim().min(1).optional().catch(undefined),
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
  detail: z.string().trim().min(1).optional().catch(undefined),
});

const fishingSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  shadow: z.string().trim().min(1).optional().catch(undefined),
  region: z.string().trim().min(1).optional().catch(undefined),
  season: z.string().trim().min(1).optional().catch(undefined),
  hasMap: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

const mapsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  hasFishing: z.string().trim().min(1).optional().catch(undefined),
  hasNotes: z.string().trim().min(1).optional().catch(undefined),
  hasRecipe: z.string().trim().min(1).optional().catch(undefined),
  chestBand: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

const calendarSearchSchema = z.object({
  season: z.enum(['Spring', 'Summer', 'Fall', 'Winter']).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
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

function buildOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value: value.toLowerCase() }));
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
  const sortedCharacters = [...characters];
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'birthday-asc':
      sortedCharacters.sort((left, right) => {
        const seasonDelta =
          getSeasonSortValue(left.birthday?.season) - getSeasonSortValue(right.birthday?.season);

        if (seasonDelta !== 0) {
          return seasonDelta;
        }

        return (left.birthday?.day || 99) - (right.birthday?.day || 99);
      });
      return sortedCharacters;
    case 'name-asc':
    default:
      sortedCharacters.sort((left, right) => left.name.localeCompare(right.name));
      return sortedCharacters;
  }
}

function applyMonstersSort(groups: MonsterGroup[], sortValue: string | undefined) {
  const sortedGroups = [...groups];
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'level-desc':
      sortedGroups.sort((left, right) => (right.representative.stats.baseLevel || 0) - (left.representative.stats.baseLevel || 0));
      return sortedGroups;
    case 'name-asc':
    default:
      sortedGroups.sort((left, right) => left.displayName.localeCompare(right.displayName));
      return sortedGroups;
  }
}

function applyFishingSort(fish: Fish[], sortValue: string | undefined) {
  const sortedFish = [...fish];
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'sell-desc':
      sortedFish.sort((left, right) => (right.sell || 0) - (left.sell || 0));
      return sortedFish;
    case 'locations-desc':
      sortedFish.sort((left, right) => (right.locations?.length || 0) - (left.locations?.length || 0));
      return sortedFish;
    case 'name-asc':
    default:
      sortedFish.sort((left, right) => left.name.localeCompare(right.name));
      return sortedFish;
  }
}

function applyMapsSort(regions: MapRegionRecord[], sortValue: string | undefined) {
  const sortedRegions = [...regions];
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'chests-desc':
      sortedRegions.sort((left, right) => right.chests.length - left.chests.length);
      return sortedRegions;
    case 'fishing-desc':
      sortedRegions.sort((left, right) => right.fishingLocations.length - left.fishingLocations.length);
      return sortedRegions;
    case 'name-asc':
    default:
      sortedRegions.sort((left, right) => left.name.localeCompare(right.name));
      return sortedRegions;
  }
}

function applyItemsSort(items: Item[], sortValue: string | undefined) {
  const sortedItems = [...items];
  const resolvedSort = sortValue ?? 'name-asc';

  switch (resolvedSort) {
    case 'name-desc':
      sortedItems.sort((left, right) => right.name.localeCompare(left.name));
      return sortedItems;
    case 'buy-desc':
      sortedItems.sort((left, right) => (right.buy ?? 0) - (left.buy ?? 0));
      return sortedItems;
    case 'sell-desc':
      sortedItems.sort((left, right) => (right.sell ?? 0) - (left.sell ?? 0));
      return sortedItems;
    case 'name-asc':
    default:
      sortedItems.sort((left, right) => left.name.localeCompare(right.name));
      return sortedItems;
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
): ItemsCatalogData {
  const sourceItems = Object.values(items);
  let results = [...sourceItems];

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
    filterOptions: {
      type: buildOptions(sourceItems.map((item) => item.type)),
      category: buildOptions(
        sourceItems
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value)),
      ),
      region: buildOptions(
        sourceItems
          .map((item) => item.region)
          .filter((value): value is string => Boolean(value)),
      ),
      rarity: buildOptions(
        sourceItems
          .map((item) => item.rarityCategory)
          .filter((value): value is string => Boolean(value)),
      ),
    },
  };
}

export function buildCharactersCatalogData(
  characters: Record<string, Character>,
  search: CharactersSearchParams,
): CharactersCatalogData {
  const sourceCharacters = Object.values(characters);
  let results = [...sourceCharacters];

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
    filterOptions: {
      category: buildOptions(sourceCharacters.map((character) => character.category)),
      gender: buildOptions(sourceCharacters.map((character) => character.gender).filter((value): value is string => Boolean(value))),
      season: buildOptions(sourceCharacters.map((character) => character.birthday?.season).filter((value): value is string => Boolean(value))),
      weaponType: buildOptions(sourceCharacters.map((character) => character.battle?.weaponType).filter((value): value is string => Boolean(value))),
    },
  };
}

export function buildMonstersCatalogData(
  monsters: Record<string, Monster>,
  search: MonstersSearchParams,
): MonstersCatalogData {
  const sourceGroups = buildMonsterGroups(Object.values(monsters));
  let results = [...sourceGroups];

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
    filterOptions: {
      location: buildOptions(sourceGroups.flatMap((group) => group.locations)),
    },
  };
}

export function buildFishingCatalogData(
  fish: Fish[],
  search: FishingSearchParams,
): FishingCatalogData {
  const sourceFish = [...fish];
  let results = [...sourceFish];

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
    totalCount: sourceFish.length,
    results: applyFishingSort(results, search.sort),
    filterOptions: {
      shadow: buildOptions(sourceFish.map((entry) => entry.shadow).filter((value): value is string => Boolean(value))),
      region: buildOptions(sourceFish.flatMap((entry) => (entry.locations ?? []).map((location) => location.region))),
      season: buildOptions(sourceFish.flatMap((entry) => (entry.locations ?? []).flatMap((location) => location.seasons ?? []))),
    },
  };
}

export function buildMapsCatalogData(
  chests: Chest[],
  fish: Fish[],
  search: MapsSearchParams,
): MapsCatalogData {
  const sourceRegions = buildMapRegions(chests, fish);
  let results = [...sourceRegions];

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
