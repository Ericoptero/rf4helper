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
  type Crop,
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
export type CropBucket = keyof CropsData;
export type CropEntry = {
  bucket: CropBucket;
  crop: Crop;
};
export type MonsterDropSource = {
  referenceId: string;
  label: string;
  image?: string;
  dropRates: number[];
};
export type ItemCropRelation = {
  crop: Crop;
  bucket: CropBucket;
  role: 'seed' | 'produce';
  counterpartItemId?: string;
};

const serverDataCacheResetters: Array<() => void> = [];

// These loaders intentionally keep their last successful result in memory for the
// lifetime of the current server process. The data is static build-time content, so
// there is no runtime invalidation path outside of tests and process restarts.
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

const cropItemIdAliases: Record<string, string> = {
  'item-apple-tree-seed': 'item-apple-tree-seeds',
};

function normalizeLinkedName(value: string) {
  return value
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((token) => (token.endsWith('s') && token.length > 3 ? token.slice(0, -1) : token))
    .join(' ');
}

function createItemNameIndex(items: Record<string, Item>) {
  const itemsByName = new Map<string, string[]>();

  for (const [itemId, item] of Object.entries(items)) {
    const normalized = normalizeLinkedName(item.name);
    const matches = itemsByName.get(normalized) ?? [];
    matches.push(itemId);
    itemsByName.set(normalized, matches);
  }

  return itemsByName;
}

function getUniqueItemIdByName(name: string, itemsByName: Map<string, string[]>) {
  const matches = itemsByName.get(normalizeLinkedName(name)) ?? [];
  return matches.length === 1 ? matches[0] : undefined;
}

function resolveCropItemId(
  crop: Crop,
  items: Record<string, Item>,
  itemsByName: Map<string, string[]>,
) {
  if (crop.itemId && items[crop.itemId]) {
    return crop.itemId;
  }

  if (crop.itemId) {
    const alias = cropItemIdAliases[crop.itemId];

    if (alias && items[alias]) {
      return alias;
    }
  }

  return getUniqueItemIdByName(crop.name, itemsByName);
}

function buildSeedItemCandidates(cropName: string, itemsByName: Map<string, string[]>) {
  const candidateNames = new Set([
    `${cropName} Seed`,
    `${cropName} Seeds`,
    `${cropName} Tree Seed`,
    `${cropName} Tree Seeds`,
  ]);

  return [...candidateNames]
    .map((candidate) => getUniqueItemIdByName(candidate, itemsByName))
    .filter((candidate): candidate is string => Boolean(candidate));
}

function getProduceNameFromSeed(seedName: string) {
  return seedName
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bTree\s+Seeds?\b/gi, '')
    .replace(/\bSeeds?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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

export const getMonsterGroupsByDetailId = createSingletonLoader(async () => {
  const groups = await getMonsterGroups();
  const groupsById = new Map<string, (typeof groups)[number]>();

  for (const group of groups) {
    groupsById.set(group.key, group);
    groupsById.set(group.representative.id, group);

    for (const variant of group.variants) {
      groupsById.set(variant.id, group);
      groupsById.set(variant.name, group);
    }
  }

  return groupsById;
});

export const getItemDropSourcesByItemId = createSingletonLoader(async () => {
  const groups = await getMonsterGroups();
  const sourcesByItemId = new Map<string, MonsterDropSource[]>();

  for (const group of groups) {
    for (const variant of group.variants) {
      for (const drop of variant.drops) {
        if (!drop.id) {
          continue;
        }

        const existing = sourcesByItemId.get(drop.id) ?? [];
        existing.push({
          referenceId: variant.name,
          label: variant.name,
          image: variant.image,
          dropRates: drop.dropRates,
        });
        sourcesByItemId.set(drop.id, existing);
      }
    }
  }

  for (const sources of sourcesByItemId.values()) {
    sources.sort((left, right) => left.label.localeCompare(right.label));
  }

  return sourcesByItemId;
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

export const getFishById = createSingletonLoader(async () => {
  return new Map((await getFishData()).map((entry) => [entry.id, entry]));
});

export const getMapRegionsById = createSingletonLoader(async () => {
  return new Map((await getMapRegions()).map((entry) => [entry.id, entry]));
});

export const getFestivalsById = createSingletonLoader(async () => {
  return new Map((await getFestivalsData()).map((entry) => [entry.id, entry]));
});

export const getAllCropEntries = createSingletonLoader(async (): Promise<CropEntry[]> => {
  const cropsData = await getCropsData();

  return Object.entries(cropsData).flatMap(([bucket, crops]) =>
    crops.map((crop) => ({
      bucket: bucket as CropBucket,
      crop,
    })),
  );
});

export const getCropsById = createSingletonLoader(async () => {
  return new Map((await getAllCropEntries()).map((entry) => [entry.crop.id, entry.crop]));
});

export const getItemCropRelationsByItemId = createSingletonLoader(async () => {
  const [items, cropEntries] = await Promise.all([getItemsData(), getAllCropEntries()]);
  const itemsByName = createItemNameIndex(items);
  const relationsByItemId = new Map<string, ItemCropRelation[]>();

  function pushRelation(itemId: string, relation: ItemCropRelation) {
    const existing = relationsByItemId.get(itemId) ?? [];

    if (
      existing.some(
        (entry) =>
          entry.crop.id === relation.crop.id
          && entry.bucket === relation.bucket
          && entry.role === relation.role
          && entry.counterpartItemId === relation.counterpartItemId,
      )
    ) {
      return;
    }

    existing.push(relation);
    relationsByItemId.set(itemId, existing);
  }

  for (const entry of cropEntries) {
    const selfItemId = resolveCropItemId(entry.crop, items, itemsByName);
    const produceItemId = entry.bucket === 'seeds'
      ? getUniqueItemIdByName(getProduceNameFromSeed(entry.crop.name), itemsByName)
      : selfItemId;
    const seedItemIds = entry.bucket === 'seeds'
      ? (selfItemId ? [selfItemId] : [])
      : buildSeedItemCandidates(entry.crop.name, itemsByName);

    if (selfItemId) {
      pushRelation(selfItemId, {
        crop: entry.crop,
        bucket: entry.bucket,
        role: entry.bucket === 'seeds' ? 'seed' : 'produce',
        counterpartItemId: entry.bucket === 'seeds' ? produceItemId : seedItemIds[0],
      });
    }

    if (entry.bucket !== 'seeds' && produceItemId) {
      for (const seedItemId of seedItemIds) {
        pushRelation(seedItemId, {
          crop: entry.crop,
          bucket: entry.bucket,
          role: 'seed',
          counterpartItemId: produceItemId,
        });
      }
    }
  }

  for (const relations of relationsByItemId.values()) {
    relations.sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === 'seed' ? -1 : 1;
      }

      return left.crop.name.localeCompare(right.crop.name);
    });
  }

  return relationsByItemId;
});
