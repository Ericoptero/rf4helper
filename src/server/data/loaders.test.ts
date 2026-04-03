import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCharactersCatalogFilterOptions,
  getCharactersData,
  getChestsData,
  getCropsById,
  getCropsData,
  getCrafterData,
  getDataIndex,
  getFestivalsById,
  getFestivalsData,
  getFishById,
  getFishData,
  getFishingCatalogFilterOptions,
  getItemCropRelationsByItemId,
  getItemDropSourcesByItemId,
  getItemsCatalogFilterOptions,
  getItemsData,
  getMapRegionsById,
  getMonsterGroupsByDetailId,
  getMonstersData,
  getMonstersCatalogFilterOptions,
  getOrdersData,
  getRequestsData,
  getRuneAbilitiesData,
  getSkillsData,
  getTrophiesData,
  resetServerDataCachesForTests,
} from './loaders';
import * as dataFiles from './files';

describe('server data loaders', () => {
  beforeEach(() => {
    resetServerDataCachesForTests();
  });

  it('reads the index metadata from disk', async () => {
    const index = await getDataIndex();

    expect(index.version).toBeTruthy();
    expect(index.files.items.count).toBeGreaterThan(1000);
    expect(index.files.monsters.count).toBeGreaterThan(100);
  });

  it('loads items with normalized public image urls', async () => {
    const items = await getItemsData();
    const iron = items['item-iron'];

    expect(iron).toBeDefined();
    expect(iron.name).toBe('Iron');
    expect(iron.image).toMatch(/^\/images\//);
  });

  it('loads characters and monsters as typed records', async () => {
    const [characters, monsters] = await Promise.all([
      getCharactersData(),
      getMonstersData(),
    ]);

    expect(characters['char-forte'].name).toBe('Forte');
    expect(monsters['monster-orc'].name).toBe('Orc');
  });

  it('loads fish and crafter data from disk', async () => {
    const [fish, crafter] = await Promise.all([getFishData(), getCrafterData()]);

    expect(fish.length).toBeGreaterThan(0);
    expect(crafter.specialMaterialRules.length).toBeGreaterThan(0);
    expect(crafter.slotConfigs.find((slot) => slot.key === 'weapon')?.label).toBe('Weapon');
  });

  it('loads the remaining typed datasets from disk', async () => {
    const [chests, festivals, crops, orders, requests, runeAbilities, skills, trophies] = await Promise.all([
      getChestsData(),
      getFestivalsData(),
      getCropsData(),
      getOrdersData(),
      getRequestsData(),
      getRuneAbilitiesData(),
      getSkillsData(),
      getTrophiesData(),
    ]);

    expect(chests.length).toBeGreaterThan(0);
    expect(festivals.length).toBeGreaterThan(0);
    expect(crops.regularCrops.length).toBeGreaterThan(0);
    expect(orders.length).toBeGreaterThan(0);
    expect(Object.keys(requests).length).toBeGreaterThan(0);
    expect(Object.values(runeAbilities).flat().length).toBeGreaterThan(0);
    expect(Object.keys(skills).length).toBeGreaterThan(0);
    expect(Object.values(trophies).flat().length).toBeGreaterThan(0);
  });

  it('reuses the singleton dataset cache between repeated item reads', async () => {
    const readSpy = vi.spyOn(dataFiles, 'readJsonDataFile');

    await getItemsData();
    await getItemsData();

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledWith('items.json');
  });

  it('builds reusable catalog filter option singletons', async () => {
    const [itemsOptions, charactersOptions, monsterOptions, fishingOptions] = await Promise.all([
      getItemsCatalogFilterOptions(),
      getCharactersCatalogFilterOptions(),
      getMonstersCatalogFilterOptions(),
      getFishingCatalogFilterOptions(),
    ]);

    expect(itemsOptions.type.length).toBeGreaterThan(0);
    expect(charactersOptions.category.length).toBeGreaterThan(0);
    expect(monsterOptions.location.length).toBeGreaterThan(0);
    expect(fishingOptions.region.length).toBeGreaterThan(0);
  });

  it('builds detail lookup maps keyed by entity id', async () => {
    const [monsterGroupsById, fishById, mapRegionsById, festivalsById, cropsById, dropSourcesByItemId, cropRelationsByItemId] = await Promise.all([
      getMonsterGroupsByDetailId(),
      getFishById(),
      getMapRegionsById(),
      getFestivalsById(),
      getCropsById(),
      getItemDropSourcesByItemId(),
      getItemCropRelationsByItemId(),
    ]);

    expect(monsterGroupsById.get('Orc')?.representative.id).toBe('monster-orc');
    expect(monsterGroupsById.get('monster-orc')?.displayName).toBe('Orc');
    expect(monsterGroupsById.get('Octopirate 2')?.displayName).toBe('Octopirate');
    expect(fishById.get('fish-squid')?.name).toBe('Squid');
    expect(mapRegionsById.get('Selphia Plains')?.name).toBe('Selphia Plains');
    expect(festivalsById.get('festival-cooking-contest')?.name).toBe('Cooking Contest');
    expect(cropsById.get('crop-turnip')?.name).toBe('Turnip');
    expect(cropsById.get('crop-apple-tree-seed')?.name).toBe('Apple Tree Seed');
    expect(dropSourcesByItemId.get('item-ammonite')?.some((source) => source.referenceId === 'Octopirate 2')).toBe(true);
    expect(cropRelationsByItemId.get('item-yam-seeds')?.some((relation) => relation.crop.id === 'crop-yam')).toBe(true);
  });
});
