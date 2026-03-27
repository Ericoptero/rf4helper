import { describe, expect, it } from 'vitest';

import {
  buildCharactersCatalogData,
  buildFishingCatalogData,
  buildItemsCatalogData,
  buildMapsCatalogData,
  buildMonstersCatalogData,
  parseCalendarSearchParams,
  parseCharactersSearchParams,
  parseCrafterSearchParams,
  parseFishingSearchParams,
  parseItemsSearchParams,
  parseMapsSearchParams,
  parseMonstersSearchParams,
} from './catalogQueries';

const items = {
  iron: {
    id: 'iron',
    name: 'Iron',
    type: 'Material',
    category: 'mineral',
    region: 'Selphia Plains',
    buy: 200,
    sell: 20,
    shippable: true,
    rarityCategory: 'Common',
  },
  broadsword: {
    id: 'broadsword',
    name: 'Broadsword',
    type: 'Short Sword',
    category: 'weapon',
    region: 'Selphia',
    buy: 800,
    sell: 120,
    shippable: false,
    rarityCategory: 'Rare',
    craftedFrom: [{ source: 'Forge', ingredients: ['iron'] }],
  },
  charm: {
    id: 'charm',
    name: 'Charm',
    type: 'Accessory',
    category: 'accessory',
    region: 'Selphia',
    buy: 300,
    sell: 200,
    shippable: true,
    rarityCategory: 'Rare',
    effects: [{ type: 'resistance', target: 'fire', value: 25 }],
  },
  antidote: {
    id: 'antidote',
    name: 'Antidote Potion',
    type: 'Medicine',
    category: 'medicine',
    region: 'Clinic',
    buy: 90,
    sell: 30,
    shippable: true,
    rarityCategory: 'Common',
  },
} as const;

const characters = {
  'char-forte': {
    id: 'char-forte',
    name: 'Forte',
    category: 'Bachelorettes',
    gender: 'Female',
    birthday: { season: 'Summer', day: 22 },
    battle: { weaponType: 'Long Sword' },
  },
  'char-vishnal': {
    id: 'char-vishnal',
    name: 'Vishnal',
    category: 'Bachelors',
    gender: 'Male',
    birthday: { season: 'Spring', day: 3 },
    battle: { weaponType: 'Short Sword' },
  },
  'char-clorica': {
    id: 'char-clorica',
    name: 'Clorica',
    category: 'Bachelorettes',
    gender: 'Female',
    birthday: { season: 'Spring', day: 5 },
    battle: null,
  },
} as const;

const monsters = {
  'monster-octopirate': {
    id: 'monster-octopirate',
    name: 'Octopirate',
    variantGroup: 'Octopirate',
    variantSuffix: null,
    location: 'Field Dungeon (Boss)',
    drops: [{ id: 'item-ammonite', name: 'Ammonite', dropRates: [70] }],
    stats: { baseLevel: 84, hp: 1000, atk: 100, def: 80 },
    taming: { tameable: true, isRideable: true, befriend: 1 },
  },
  'monster-orc': {
    id: 'monster-orc',
    name: 'Orc',
    location: 'Selphia Plains',
    drops: [],
    stats: { baseLevel: 3, hp: 100, atk: 20, def: 10 },
    taming: { tameable: false, isRideable: null, befriend: null },
  },
  'monster-buffamoo': {
    id: 'monster-buffamoo',
    name: 'Buffamoo',
    location: 'Selphia Plains',
    drops: [{ id: 'item-milk', name: 'Milk', dropRates: [50] }],
    stats: { baseLevel: 8, hp: 200, atk: 30, def: 15 },
    taming: { tameable: true, isRideable: false, befriend: 1 },
  },
} as const;

const fish = [
  {
    id: 'fish-squid',
    name: 'Squid',
    shadow: 'Large',
    sell: 50,
    locations: [
      { region: 'Seaside', spot: 'Pier', seasons: ['Summer'], map: 'Sea Map' },
      { region: 'Seaside', spot: 'Deep Water', seasons: ['Summer', 'Fall'] },
    ],
  },
  {
    id: 'fish-sardine',
    name: 'Sardine',
    shadow: 'Small',
    sell: 10,
    locations: [{ region: 'Idra Cave', spot: 'Entrance', seasons: ['Spring'], map: 'Cave Map' }],
  },
  {
    id: 'fish-taimen',
    name: 'Taimen',
    shadow: 'Large',
    sell: 100,
    locations: [{ region: 'Yokmir Forest', spot: 'Pond', seasons: ['Fall', 'Winter'] }],
  },
] as const;

const chests = [
  { id: 'selphia-1', region: 'Selphia Plains', notes: 'Hidden by a tree' },
  { id: 'selphia-2', region: 'Selphia Plains', recipe: 'Broadsword Recipe' },
  { id: 'yokmir-1', region: 'Yokmir Forest' },
  { id: 'yokmir-2', region: 'Yokmir Forest' },
  { id: 'yokmir-3', region: 'Yokmir Forest' },
  { id: 'obsidian-1', region: 'Obsidian Mansion' },
  { id: 'obsidian-2', region: 'Obsidian Mansion' },
  { id: 'obsidian-3', region: 'Obsidian Mansion' },
  { id: 'obsidian-4', region: 'Obsidian Mansion' },
  { id: 'obsidian-5', region: 'Obsidian Mansion' },
  { id: 'obsidian-6', region: 'Obsidian Mansion' },
] as const;

describe('catalog query parsing', () => {
  it('normalizes the items search params shape', () => {
    const parsed = parseItemsSearchParams({
      q: ' iron ',
      view: 'table',
      sort: 'buy-desc',
      type: 'material',
      detail: 'item:iron',
    });

    expect(parsed).toEqual({
      q: 'iron',
      view: 'table',
      sort: 'buy-desc',
      type: 'material',
      detail: 'item:iron',
    });
  });

  it('drops unsupported or empty item values', () => {
    const parsed = parseItemsSearchParams({
      q: '   ',
      view: 'invalid',
      sort: '',
      type: '',
      detail: '',
    });

    expect(parsed).toEqual({});
  });

  it('parses the remaining route search params using only the first value', () => {
    expect(parseCharactersSearchParams({
      q: [' Forte ', 'ignored'],
      view: ['cards', 'table'],
      sort: ['birthday-asc'],
      category: ['bachelorettes'],
      gender: 'female',
      season: 'summer',
      battle: 'yes',
      weaponType: 'long sword',
      detail: 'character:char-forte',
    })).toEqual({
      q: 'Forte',
      view: 'cards',
      sort: 'birthday-asc',
      category: 'bachelorettes',
      gender: 'female',
      season: 'summer',
      battle: 'yes',
      weaponType: 'long sword',
      detail: 'character:char-forte',
    });

    expect(parseMonstersSearchParams({
      q: [' octo ', 'ignored'],
      view: 'table',
      sort: 'level-desc',
      tameable: 'yes',
      boss: 'yes',
      rideable: 'yes',
      location: 'field dungeon (boss)',
      drops: 'yes',
      detail: 'monster:monster-octopirate',
    })).toEqual({
      q: 'octo',
      view: 'table',
      sort: 'level-desc',
      tameable: 'yes',
      boss: 'yes',
      rideable: 'yes',
      location: 'field dungeon (boss)',
      drops: 'yes',
      detail: 'monster:monster-octopirate',
    });

    expect(parseFishingSearchParams({
      q: ' squid ',
      view: 'table',
      sort: 'sell-desc',
      shadow: 'Large',
      region: 'seaside',
      season: 'summer',
      hasMap: 'yes',
      detail: 'fish:fish-squid',
    })).toEqual({
      q: 'squid',
      view: 'table',
      sort: 'sell-desc',
      shadow: 'Large',
      region: 'seaside',
      season: 'summer',
      hasMap: 'yes',
      detail: 'fish:fish-squid',
    });

    expect(parseMapsSearchParams({
      q: ' forest ',
      view: 'table',
      sort: 'fishing-desc',
      hasFishing: 'yes',
      hasNotes: 'yes',
      hasRecipe: 'yes',
      chestBand: 'medium',
      detail: 'map:Selphia Plains',
    })).toEqual({
      q: 'forest',
      view: 'table',
      sort: 'fishing-desc',
      hasFishing: 'yes',
      hasNotes: 'yes',
      hasRecipe: 'yes',
      chestBand: 'medium',
      detail: 'map:Selphia Plains',
    });

    expect(parseCalendarSearchParams({
      season: ['Fall', 'Winter'],
      detail: ['festival:festival-cooking-contest'],
    })).toEqual({
      season: 'Fall',
      detail: 'festival:festival-cooking-contest',
    });

    expect(parseCrafterSearchParams({
      build: ['abc123', 'ignored'],
      view: ['compact', 'full'],
    })).toEqual({
      build: 'abc123',
      view: 'compact',
    });
  });

  it('drops invalid values for the remaining route search params', () => {
    expect(parseCharactersSearchParams({ view: 'invalid', q: '   ' })).toEqual({});
    expect(parseMonstersSearchParams({ view: 'invalid', q: '' })).toEqual({});
    expect(parseFishingSearchParams({ view: 'invalid', q: '   ' })).toEqual({});
    expect(parseMapsSearchParams({ view: 'invalid', q: '' })).toEqual({});
    expect(parseCalendarSearchParams({ season: 'Invalid' })).toEqual({});
    expect(parseCrafterSearchParams({ build: '   ', view: '' })).toEqual({});
  });
});

describe('items catalog builder', () => {
  it('filters every supported items facet server-side', () => {
    const result = buildItemsCatalogData(items as never, {
      q: 'ch',
      type: 'accessory',
      category: 'accessory',
      region: 'selphia',
      ship: 'yes',
      buyable: 'yes',
      sellable: 'yes',
      rarity: 'rare',
      effects: 'yes',
      sort: 'sell-desc',
    });

    expect(result.totalCount).toBe(4);
    expect(result.results.map((item) => item.id)).toEqual(['charm']);
  });

  it('supports crafted-only filtering and alternate sorts', () => {
    expect(buildItemsCatalogData(items as never, {
      craft: 'yes',
      sort: 'name-desc',
    }).results.map((item) => item.id)).toEqual(['broadsword']);

    expect(buildItemsCatalogData(items as never, {
      sort: 'sell-desc',
    }).results.map((item) => item.id)).toEqual(['charm', 'broadsword', 'antidote', 'iron']);
  });

  it('supports default and buy-desc item sorting with multiple results', () => {
    expect(buildItemsCatalogData(items as never, {}).results.map((item) => item.id)).toEqual([
      'antidote',
      'broadsword',
      'charm',
      'iron',
    ]);

    expect(buildItemsCatalogData(items as never, {
      sort: 'buy-desc',
    }).results.map((item) => item.id)).toEqual([
      'broadsword',
      'charm',
      'iron',
      'antidote',
    ]);
  });

  it('builds item filter options from the full dataset', () => {
    const result = buildItemsCatalogData(items as never, {});

    expect(result.filterOptions.type.map((option) => option.value)).toEqual([
      'accessory',
      'material',
      'medicine',
      'short sword',
    ]);
    expect(result.filterOptions.category.map((option) => option.value)).toEqual([
      'accessory',
      'medicine',
      'mineral',
      'weapon',
    ]);
    expect(result.filterOptions.region.map((option) => option.value)).toEqual([
      'clinic',
      'selphia',
      'selphia plains',
    ]);
    expect(result.filterOptions.rarity.map((option) => option.value)).toEqual([
      'common',
      'rare',
    ]);
  });
});

describe('characters catalog builder', () => {
  it('filters by every supported character facet and sorts by birthday', () => {
    const result = buildCharactersCatalogData(characters as never, {
      q: 'for',
      category: 'bachelorettes',
      gender: 'female',
      season: 'summer',
      battle: 'yes',
      weaponType: 'long sword',
      sort: 'birthday-asc',
    });

    expect(result.totalCount).toBe(3);
    expect(result.results.map((character) => character.id)).toEqual(['char-forte']);
  });

  it('builds character filter options from available metadata', () => {
    const result = buildCharactersCatalogData(characters as never, {});

    expect(result.results.map((character) => character.id)).toEqual([
      'char-clorica',
      'char-forte',
      'char-vishnal',
    ]);
    expect(result.filterOptions.category.map((option) => option.value)).toEqual([
      'bachelorettes',
      'bachelors',
    ]);
    expect(result.filterOptions.gender.map((option) => option.value)).toEqual([
      'female',
      'male',
    ]);
    expect(result.filterOptions.season.map((option) => option.value)).toEqual([
      'spring',
      'summer',
    ]);
    expect(result.filterOptions.weaponType.map((option) => option.value)).toEqual([
      'long sword',
      'short sword',
    ]);
  });
});

describe('monsters catalog builder', () => {
  it('filters by every supported monster facet and sorts by level', () => {
    const result = buildMonstersCatalogData(monsters as never, {
      q: 'octo',
      tameable: 'yes',
      boss: 'yes',
      rideable: 'yes',
      location: 'field dungeon (boss)',
      drops: 'yes',
      sort: 'level-desc',
    });

    expect(result.totalCount).toBe(3);
    expect(result.results.map((group) => group.displayName)).toEqual(['Octopirate']);
  });

  it('builds location options from grouped monster locations', () => {
    const result = buildMonstersCatalogData(monsters as never, {});

    expect(result.results.map((group) => group.displayName)).toEqual([
      'Buffamoo',
      'Octopirate',
      'Orc',
    ]);
    expect(result.filterOptions.location.map((option) => option.value)).toEqual([
      'field dungeon (boss)',
      'selphia plains',
    ]);
  });
});

describe('fishing catalog builder', () => {
  it('filters by every supported fishing facet and sorts by sell value', () => {
    const result = buildFishingCatalogData(fish as never, {
      q: 'squ',
      shadow: 'Large',
      region: 'seaside',
      season: 'summer',
      hasMap: 'yes',
      sort: 'sell-desc',
    });

    expect(result.totalCount).toBe(3);
    expect(result.results.map((entry) => entry.id)).toEqual(['fish-squid']);
  });

  it('supports alternative fishing sorts and filter option generation', () => {
    const result = buildFishingCatalogData(fish as never, {
      sort: 'locations-desc',
    });

    expect(result.results.map((entry) => entry.id)).toEqual([
      'fish-squid',
      'fish-sardine',
      'fish-taimen',
    ]);
    expect(result.filterOptions.shadow.map((option) => option.value)).toEqual([
      'large',
      'small',
    ]);
    expect(result.filterOptions.region.map((option) => option.value)).toEqual([
      'idra cave',
      'seaside',
      'yokmir forest',
    ]);
    expect(result.filterOptions.season.map((option) => option.value)).toEqual([
      'fall',
      'spring',
      'summer',
      'winter',
    ]);
  });

  it('falls back to the default fishing sort when no explicit sort is provided', () => {
    expect(buildFishingCatalogData(fish as never, {}).results.map((entry) => entry.id)).toEqual([
      'fish-sardine',
      'fish-squid',
      'fish-taimen',
    ]);
  });
});

describe('maps catalog builder', () => {
  it('filters by region name and chest band buckets', () => {
    expect(buildMapsCatalogData(chests as never, fish as never, {
      q: 'selphia',
      chestBand: 'low',
    }).results.map((region) => region.name)).toEqual(['Selphia Plains']);

    expect(buildMapsCatalogData(chests as never, fish as never, {
      chestBand: 'medium',
    }).results.map((region) => region.name)).toEqual(['Yokmir Forest']);

    expect(buildMapsCatalogData(chests as never, fish as never, {
      chestBand: 'high',
    }).results.map((region) => region.name)).toEqual(['Obsidian Mansion']);
  });

  it('filters by fishing, notes, recipes and supports alternate sorts', () => {
    expect(buildMapsCatalogData(chests as never, fish as never, {
      hasFishing: 'yes',
      sort: 'fishing-desc',
    }).results.map((region) => region.name)).toEqual(['Yokmir Forest']);

    expect(buildMapsCatalogData(chests as never, fish as never, {
      hasNotes: 'yes',
      hasRecipe: 'yes',
      sort: 'chests-desc',
    }).results.map((region) => region.name)).toEqual(['Selphia Plains']);
  });
});
