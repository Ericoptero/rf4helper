import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const DATA_FILE_NAMES = [
  'index.json',
  'items.json',
  'characters.json',
  'monsters.json',
  'chests.json',
  'festivals.json',
  'crops.json',
  'fishing.json',
  'orders.json',
  'requests.json',
  'runeAbilities.json',
  'skills.json',
  'trophies.json',
  'crafter.json',
] as const;

export type DataFileName = typeof DATA_FILE_NAMES[number];

const DATA_FILE_NAME_SET = new Set<string>(DATA_FILE_NAMES);

export function getDataDirectoryPath() {
  return path.resolve(process.cwd(), 'data');
}

export function isSupportedDataFile(fileName: string): fileName is DataFileName {
  return DATA_FILE_NAME_SET.has(fileName);
}

export function getDataFilePath(fileName: DataFileName) {
  return path.resolve(getDataDirectoryPath(), fileName);
}

export async function readRawDataFile(fileName: DataFileName) {
  return readFile(getDataFilePath(fileName), 'utf8');
}

export async function readJsonDataFile(fileName: DataFileName) {
  return JSON.parse(await readRawDataFile(fileName)) as unknown;
}
