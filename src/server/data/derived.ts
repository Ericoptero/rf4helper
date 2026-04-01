import { buildMapRegions, type MapRegionRecord } from '@/lib/mapFishingRelations';
import { buildMonsterGroups, type MonsterGroup } from '@/lib/monsterGroups';
import { formatItemCategory } from '@/lib/formatters';
import type { Character, Chest, Fish, Item, Monster } from '@/lib/schemas';

type CatalogOption = {
  label: string;
  value: string;
};

export type ItemsCatalogFilterOptions = {
  type: CatalogOption[];
  category: CatalogOption[];
  region: CatalogOption[];
  rarity: CatalogOption[];
};

export type CharactersCatalogFilterOptions = {
  category: CatalogOption[];
  gender: CatalogOption[];
  season: CatalogOption[];
  weaponType: CatalogOption[];
};

export type MonstersCatalogFilterOptions = {
  location: CatalogOption[];
};

export type FishingCatalogFilterOptions = {
  shadow: CatalogOption[];
  region: CatalogOption[];
  season: CatalogOption[];
};

const itemsFilterOptionsCache = new WeakMap<Record<string, Item>, ItemsCatalogFilterOptions>();
const charactersFilterOptionsCache = new WeakMap<Record<string, Character>, CharactersCatalogFilterOptions>();
const monsterGroupsCache = new WeakMap<Record<string, Monster>, MonsterGroup[]>();
const monstersFilterOptionsCache = new WeakMap<Record<string, Monster>, MonstersCatalogFilterOptions>();
const fishingFilterOptionsCache = new WeakMap<Fish[], FishingCatalogFilterOptions>();
const mapRegionsCache = new WeakMap<Chest[], WeakMap<Fish[], MapRegionRecord[]>>();

function buildOptions(values: string[]) {
  return Array.from(new Set(values))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value: value.toLowerCase() }));
}

function getOrCreateWeakMapValue<TKey extends object, TValue>(
  cache: WeakMap<TKey, TValue>,
  key: TKey,
  buildValue: () => TValue,
) {
  const cachedValue = cache.get(key);

  if (cachedValue) {
    return cachedValue;
  }

  const nextValue = buildValue();
  cache.set(key, nextValue);
  return nextValue;
}

export function getItemsFilterOptionsForData(items: Record<string, Item>): ItemsCatalogFilterOptions {
  return getOrCreateWeakMapValue(itemsFilterOptionsCache, items, () => {
    const sourceItems = Object.values(items);

    return {
      type: buildOptions(sourceItems.map((item) => item.type)),
      category: buildOptions(
        sourceItems
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value)),
      ).map(({ label, value }) => ({ label: formatItemCategory(label), value })),
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
    };
  });
}

export function getCharactersFilterOptionsForData(
  characters: Record<string, Character>,
): CharactersCatalogFilterOptions {
  return getOrCreateWeakMapValue(charactersFilterOptionsCache, characters, () => {
    const sourceCharacters = Object.values(characters);

    return {
      category: buildOptions(sourceCharacters.map((character) => character.category)),
      gender: buildOptions(
        sourceCharacters
          .map((character) => character.gender)
          .filter((value): value is string => Boolean(value)),
      ),
      season: buildOptions(
        sourceCharacters
          .map((character) => character.birthday?.season)
          .filter((value): value is string => Boolean(value)),
      ),
      weaponType: buildOptions(
        sourceCharacters
          .map((character) => character.battle?.weaponType)
          .filter((value): value is string => Boolean(value)),
      ),
    };
  });
}

export function getMonsterGroupsForData(monsters: Record<string, Monster>) {
  return getOrCreateWeakMapValue(monsterGroupsCache, monsters, () => buildMonsterGroups(Object.values(monsters)));
}

export function getMonstersFilterOptionsForData(
  monsters: Record<string, Monster>,
): MonstersCatalogFilterOptions {
  return getOrCreateWeakMapValue(monstersFilterOptionsCache, monsters, () => {
    const sourceGroups = getMonsterGroupsForData(monsters);

    return {
      location: buildOptions(sourceGroups.flatMap((group) => group.locations)),
    };
  });
}

export function getFishingFilterOptionsForData(fish: Fish[]): FishingCatalogFilterOptions {
  return getOrCreateWeakMapValue(fishingFilterOptionsCache, fish, () => ({
    shadow: buildOptions(
      fish.map((entry) => entry.shadow).filter((value): value is string => Boolean(value)),
    ),
    region: buildOptions(
      fish.flatMap((entry) => (entry.locations ?? []).map((location) => location.region)),
    ),
    season: buildOptions(
      fish.flatMap((entry) => (entry.locations ?? []).flatMap((location) => location.seasons ?? [])),
    ),
  }));
}

export function getMapRegionsForData(chests: Chest[], fish: Fish[]) {
  const cachedByFish = mapRegionsCache.get(chests);

  if (cachedByFish?.has(fish)) {
    return cachedByFish.get(fish)!;
  }

  const nextValue = buildMapRegions(chests, fish);
  const nextCache = cachedByFish ?? new WeakMap<Fish[], MapRegionRecord[]>();
  nextCache.set(fish, nextValue);

  if (!cachedByFish) {
    mapRegionsCache.set(chests, nextCache);
  }

  return nextValue;
}
