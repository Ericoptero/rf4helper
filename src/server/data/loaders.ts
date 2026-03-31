import { z } from 'zod';

import {
  ChestSchema,
  CharacterSchema,
  CropsDataSchema,
  CrafterConfigSchema,
  FestivalSchema,
  FishSchema,
  ItemSchema,
  MonsterSchema,
  OrderSchema,
  RequestSchema,
  RuneAbilitySchema,
  SkillsDataSchema,
  TrophySchema,
  type Chest,
  type Character,
  type CropsData,
  type CrafterData,
  type Festival,
  type Fish,
  type Item,
  type Monster,
  type Order,
  type RequestItem,
  type RuneAbility,
  type SkillsData,
  type Trophy,
} from '@/lib/schemas';
import { buildCrafterData } from '@/lib/crafterData';
import { resolveItemImageUrl } from '@/lib/publicAssetUrls';
import {
  getCharactersFilterOptionsForData,
  getFishingFilterOptionsForData,
  getItemsFilterOptionsForData,
  getMapRegionsForData,
  getMonsterGroupsForData,
  getMonstersFilterOptionsForData,
  type CharactersCatalogFilterOptions,
  type FishingCatalogFilterOptions,
  type ItemsCatalogFilterOptions,
  type MonstersCatalogFilterOptions,
} from './derived';
import { readJsonDataFile } from './files';

const DataFileMetadataSchema = z.object({
  path: z.string(),
  count: z.number(),
  sizeKB: z.number(),
});

const DataIndexSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  files: z.record(z.string(), DataFileMetadataSchema),
});

export type DataIndex = z.infer<typeof DataIndexSchema>;

const serverDataCacheResetters: Array<() => void> = [];

function createSingletonLoader<T>(loadData: () => Promise<T>) {
  let cachedPromise: Promise<T> | undefined;

  serverDataCacheResetters.push(() => {
    cachedPromise = undefined;
  });

  return async () => {
    if (!cachedPromise) {
      cachedPromise = loadData().catch((error) => {
        cachedPromise = undefined;
        throw error;
      });
    }

    return cachedPromise;
  };
}

export function resetServerDataCachesForTests() {
  for (const resetCache of serverDataCacheResetters) {
    resetCache();
  }
}

export const getDataIndex = createSingletonLoader(async (): Promise<DataIndex> => {
  return DataIndexSchema.parse(await readJsonDataFile('index.json'));
});

export const getItemsData = createSingletonLoader(async (): Promise<Record<string, Item>> => {
  const rawData = await readJsonDataFile('items.json');
  const rawItems = z.record(z.string(), z.record(z.string(), z.unknown())).parse(rawData);

  const enrichedItems = Object.fromEntries(
    Object.entries(rawItems).map(([key, item]) => [
      key,
      {
        ...item,
        image: resolveItemImageUrl(
          typeof item.name === 'string' ? item.name : undefined,
          typeof item.image === 'string' ? item.image : undefined,
        ),
      },
    ]),
  );

  return z.record(z.string(), ItemSchema).parse(enrichedItems);
});

export const getCharactersData = createSingletonLoader(async (): Promise<Record<string, Character>> => {
  return z.record(z.string(), CharacterSchema).parse(await readJsonDataFile('characters.json'));
});

export const getMonstersData = createSingletonLoader(async (): Promise<Record<string, Monster>> => {
  return z.record(z.string(), MonsterSchema).parse(await readJsonDataFile('monsters.json'));
});

export const getFishData = createSingletonLoader(async (): Promise<Fish[]> => {
  return z.array(FishSchema).parse(await readJsonDataFile('fishing.json'));
});

export const getChestsData = createSingletonLoader(async (): Promise<Chest[]> => {
  return z.array(ChestSchema).parse(await readJsonDataFile('chests.json'));
});

export const getFestivalsData = createSingletonLoader(async (): Promise<Festival[]> => {
  return z.array(FestivalSchema).parse(await readJsonDataFile('festivals.json'));
});

export const getCropsData = createSingletonLoader(async (): Promise<CropsData> => {
  return CropsDataSchema.parse(await readJsonDataFile('crops.json'));
});

export const getOrdersData = createSingletonLoader(async (): Promise<Order[]> => {
  return z.array(OrderSchema).parse(await readJsonDataFile('orders.json'));
});

export const getRequestsData = createSingletonLoader(async (): Promise<Record<string, RequestItem[]>> => {
  const rawData = await readJsonDataFile('requests.json');
  const parsed = z.record(z.string(), z.unknown()).parse(rawData);
  const validSections: Record<string, RequestItem[]> = {};

  for (const key of [
    'itemrecipeRewards',
    'generalStoreSeedRewards',
    'carnationStoreSeedRewards',
    'repeatableRequests',
  ]) {
    if (parsed[key]) {
      validSections[key] = z.array(RequestSchema).parse(parsed[key]);
    }
  }

  return validSections;
});

export const getRuneAbilitiesData = createSingletonLoader(async (): Promise<Record<string, RuneAbility[]>> => {
  return z.record(z.string(), z.array(RuneAbilitySchema)).parse(await readJsonDataFile('runeAbilities.json'));
});

export const getSkillsData = createSingletonLoader(async (): Promise<SkillsData> => {
  return SkillsDataSchema.parse(await readJsonDataFile('skills.json'));
});

export const getTrophiesData = createSingletonLoader(async (): Promise<Record<string, Trophy[]>> => {
  return z.record(z.string(), z.array(TrophySchema)).parse(await readJsonDataFile('trophies.json'));
});

export const getCrafterConfigData = createSingletonLoader(async () => {
  return CrafterConfigSchema.parse(await readJsonDataFile('crafter.json'));
});

export const getCrafterData = createSingletonLoader(async (): Promise<CrafterData> => {
  const [items, crafterConfig] = await Promise.all([getItemsData(), getCrafterConfigData()]);
  return buildCrafterData(items, crafterConfig);
});

export const getItemsCatalogFilterOptions = createSingletonLoader(async (): Promise<ItemsCatalogFilterOptions> => {
  return getItemsFilterOptionsForData(await getItemsData());
});

export const getCharactersCatalogFilterOptions = createSingletonLoader(
  async (): Promise<CharactersCatalogFilterOptions> => {
    return getCharactersFilterOptionsForData(await getCharactersData());
  },
);

export const getMonsterGroups = createSingletonLoader(async () => {
  return getMonsterGroupsForData(await getMonstersData());
});

export const getMonstersCatalogFilterOptions = createSingletonLoader(
  async (): Promise<MonstersCatalogFilterOptions> => {
    return getMonstersFilterOptionsForData(await getMonstersData());
  },
);

export const getFishingCatalogFilterOptions = createSingletonLoader(
  async (): Promise<FishingCatalogFilterOptions> => {
    return getFishingFilterOptionsForData(await getFishData());
  },
);

export const getMapRegions = createSingletonLoader(async () => {
  const [chests, fish] = await Promise.all([getChestsData(), getFishData()]);
  return getMapRegionsForData(chests, fish);
});
