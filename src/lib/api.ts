import { ItemSchema, CharacterSchema, MonsterSchema } from './schemas';
import type { Item, Character, Monster } from './schemas';
/// <reference types="node" />
import { z } from 'zod';

const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';

export const fetchItems = async (): Promise<Record<string, Item>> => {
  const url = `${BASE_URL}/data/items.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch items from ${url}`);
  const rawData = await response.json();
  const parsed = z.record(z.string(), ItemSchema).parse(rawData);
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
