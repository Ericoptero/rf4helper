import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { z } from 'zod';

import {
  ChestSchema,
  CharacterSchema,
  CropsDataSchema,
  CrafterDataSchema,
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
import { resolveItemImageUrl } from '@/lib/publicAssetUrls';

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

function getDataPath(fileName: string) {
  return path.resolve(process.cwd(), 'public', 'data', fileName);
}

async function readJsonFile(fileName: string) {
  const filePath = getDataPath(fileName);
  const fileContents = await readFile(filePath, 'utf8');
  return JSON.parse(fileContents) as unknown;
}

export const getDataIndex = cache(async (): Promise<DataIndex> => {
  return DataIndexSchema.parse(await readJsonFile('index.json'));
});

export const getItemsData = cache(async (): Promise<Record<string, Item>> => {
  const rawData = await readJsonFile('items.json');
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

export const getCharactersData = cache(async (): Promise<Record<string, Character>> => {
  return z.record(z.string(), CharacterSchema).parse(await readJsonFile('characters.json'));
});

export const getMonstersData = cache(async (): Promise<Record<string, Monster>> => {
  return z.record(z.string(), MonsterSchema).parse(await readJsonFile('monsters.json'));
});

export const getFishData = cache(async (): Promise<Fish[]> => {
  return z.array(FishSchema).parse(await readJsonFile('fishing.json'));
});

export const getChestsData = cache(async (): Promise<Chest[]> => {
  return z.array(ChestSchema).parse(await readJsonFile('chests.json'));
});

export const getFestivalsData = cache(async (): Promise<Festival[]> => {
  return z.array(FestivalSchema).parse(await readJsonFile('festivals.json'));
});

export const getCropsData = cache(async (): Promise<CropsData> => {
  return CropsDataSchema.parse(await readJsonFile('crops.json'));
});

export const getOrdersData = cache(async (): Promise<Order[]> => {
  return z.array(OrderSchema).parse(await readJsonFile('orders.json'));
});

export const getRequestsData = cache(async (): Promise<Record<string, RequestItem[]>> => {
  const rawData = await readJsonFile('requests.json');
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

export const getRuneAbilitiesData = cache(async (): Promise<Record<string, RuneAbility[]>> => {
  return z.record(z.string(), z.array(RuneAbilitySchema)).parse(await readJsonFile('runeAbilities.json'));
});

export const getSkillsData = cache(async (): Promise<SkillsData> => {
  return SkillsDataSchema.parse(await readJsonFile('skills.json'));
});

export const getTrophiesData = cache(async (): Promise<Record<string, Trophy[]>> => {
  return z.record(z.string(), z.array(TrophySchema)).parse(await readJsonFile('trophies.json'));
});

export const getCrafterData = cache(async (): Promise<CrafterData> => {
  return CrafterDataSchema.parse(await readJsonFile('crafter.json'));
});
