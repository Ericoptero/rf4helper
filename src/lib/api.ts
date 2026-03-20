import { ItemSchema, CharacterSchema, MonsterSchema, ChestSchema, FestivalSchema, CropsDataSchema, FishSchema, OrderSchema, RequestSchema, RuneAbilitySchema, SkillsDataSchema, TrophySchema } from './schemas';
import type { Item, Character, Monster, Chest, Festival, CropsData, Fish, Order, RequestItem, RuneAbility, SkillsData, Trophy } from './schemas';
import { resolveItemImage } from './itemImages';
/// <reference types="node" />
import { z } from 'zod';

const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';

export const fetchItems = async (): Promise<Record<string, Item>> => {
  const url = `${BASE_URL}/data/items.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch items from ${url}`);
  const rawData = await response.json();
  const rawItems = z.record(z.string(), z.record(z.string(), z.unknown())).parse(rawData);
  const enrichedItems = Object.fromEntries(
    Object.entries(rawItems).map(([key, item]) => [
      key,
      {
        ...item,
        image: resolveItemImage(typeof item.name === 'string' ? item.name : undefined),
      },
    ])
  );
  const parsed = z.record(z.string(), ItemSchema).parse(enrichedItems);
  return parsed;
};

export const fetchCharacters = async (): Promise<Record<string, Character>> => {
  const url = `${BASE_URL}/data/characters.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch characters from ${url}`);
  const rawData = await response.json();
  const parsed = z.record(z.string(), CharacterSchema).parse(rawData);
  return parsed;
};

export const fetchMonsters = async (): Promise<Record<string, Monster>> => {
  const url = `${BASE_URL}/data/monsters.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch monsters from ${url}`);
  const rawData = await response.json();
  const parsed = z.record(z.string(), MonsterSchema).parse(rawData);
  return parsed;
};

export const fetchChests = async (): Promise<Chest[]> => {
  const url = `${BASE_URL}/data/chests.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch chests from ${url}`);
  const rawData = await response.json();
  const parsed = z.array(ChestSchema).parse(rawData);
  return parsed;
};

export const fetchFestivals = async (): Promise<Festival[]> => {
  const url = `${BASE_URL}/data/festivals.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch festivals from ${url}`);
  const rawData = await response.json();
  const parsed = z.array(FestivalSchema).parse(rawData);
  return parsed;
};

export const fetchCrops = async (): Promise<CropsData> => {
  const url = `${BASE_URL}/data/crops.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch crops from ${url}`);
  const rawData = await response.json();
  const parsed = CropsDataSchema.parse(rawData);
  return parsed;
};

export const fetchFish = async (): Promise<Fish[]> => {
  const url = `${BASE_URL}/data/fishing.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch fishing from ${url}`);
  const rawData = await response.json();
  const parsed = z.array(FishSchema).parse(rawData);
  return parsed;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const url = `${BASE_URL}/data/orders.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch orders from ${url}`);
  return z.array(OrderSchema).parse(await response.json());
};

export const fetchRequests = async (): Promise<Record<string, RequestItem[]>> => {
  const url = `${BASE_URL}/data/requests.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch requests from ${url}`);
  const rawData = await response.json();
  // Filter out the weird "requests" array as its schema is different or broken, 
  // keeping the valid arrays.
  const validSections: Record<string, RequestItem[]> = {};
  for (const key of ['itemrecipeRewards', 'generalStoreSeedRewards', 'carnationStoreSeedRewards', 'repeatableRequests']) {
      if (rawData[key]) {
          validSections[key] = z.array(RequestSchema).parse(rawData[key]);
      }
  }
  return validSections;
};

export const fetchRuneAbilities = async (): Promise<Record<string, RuneAbility[]>> => {
  const url = `${BASE_URL}/data/runeAbilities.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch runeAbilities from ${url}`);
  return z.record(z.string(), z.array(RuneAbilitySchema)).parse(await response.json());
};

export const fetchSkills = async (): Promise<SkillsData> => {
  const url = `${BASE_URL}/data/skills.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch skills from ${url}`);
  return SkillsDataSchema.parse(await response.json());
};

export const fetchTrophies = async (): Promise<Record<string, Trophy[]>> => {
  const url = `${BASE_URL}/data/trophies.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch trophies from ${url}`);
  return z.record(z.string(), z.array(TrophySchema)).parse(await response.json());
};
