import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const MAX_DATA_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

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

function assertSupportedDataFile(fileName: string): asserts fileName is DataFileName {
  if (!isSupportedDataFile(fileName)) {
    throw new Error(`Unsupported data file: ${fileName}`);
  }
}

export function getDataFilePath(fileName: string) {
  assertSupportedDataFile(fileName);
  return path.resolve(getDataDirectoryPath(), fileName);
}

export async function readRawDataFile(fileName: string) {
  return readFile(getDataFilePath(fileName), 'utf8');
}

export async function readJsonDataFile(fileName: string) {
  const filePath = getDataFilePath(fileName);
  const fileStats = await stat(filePath);

  if (fileStats.size > MAX_DATA_FILE_BYTES) {
    throw new Error(`Data file exceeds size limit: ${fileName}`);
  }

  return JSON.parse(await readFile(filePath, 'utf8')) as unknown;
}
