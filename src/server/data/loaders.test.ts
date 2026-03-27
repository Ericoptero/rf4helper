import { describe, expect, it } from 'vitest';

import {
  getCharactersData,
  getChestsData,
  getCropsData,
  getCrafterData,
  getDataIndex,
  getFestivalsData,
  getFishData,
  getItemsData,
  getMonstersData,
  getOrdersData,
  getRequestsData,
  getRuneAbilitiesData,
  getSkillsData,
  getTrophiesData,
} from './loaders';

describe('server data loaders', () => {
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
});
