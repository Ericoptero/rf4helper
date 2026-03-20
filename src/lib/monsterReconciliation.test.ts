import { describe, expect, it } from 'vitest';
import type { Monster } from './schemas';
import { parseMonsterCsvRows, reconcileMonstersFromCsv } from './monsterReconciliation';

function makeRow(overrides: Record<number, string>) {
  const row = Array.from({ length: 90 }, () => '');
  for (const [index, value] of Object.entries(overrides)) {
    row[Number(index)] = value;
  }
  return row;
}

describe('monster reconciliation', () => {
  it('merges repeated exact-name rows into one record with multi-rate drops', () => {
    const rows = [
      makeRow({
        0: 'Ambrosia',
        1: "Ambrosia's Thorns",
        3: '60.0%',
        4: 'Toyherb',
        6: '10.0%',
        26: '5',
        27: '720',
        28: '17',
        29: '15',
        30: '8',
        31: '30',
        32: '8',
        33: '16',
        35: '0',
        36: '0',
        63: '100.00%',
        72: '1',
        89: 'Yokmir Forest (Boss)',
      }),
      makeRow({
        0: 'Ambrosia',
        1: "Ambrosia's Thorns",
        3: '10.0%',
        7: 'Plant Stem',
        9: '1.0%',
        26: '5',
        27: '720',
        28: '17',
        29: '15',
        30: '8',
        31: '30',
        32: '8',
        33: '16',
        35: '0',
        36: '0',
        63: '100.00%',
        72: '1',
        89: 'Yokmir Forest (Boss)',
      }),
    ];

    const parsed = parseMonsterCsvRows(rows);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].drops).toEqual([
      { name: "Ambrosia's Thorns", dropRates: [60, 10] },
      { name: 'Toyherb', dropRates: [10] },
      { name: 'Plant Stem', dropRates: [1] },
    ]);
    expect(parsed[0].friendliness).toBe(1);
  });

  it('keeps suffixed variants as separate records and groups them', () => {
    const rows = [
      makeRow({
        0: 'Octopirate',
        1: 'Ammonite',
        3: '0.7%',
        4: 'Ammonite',
        6: '0.1%',
        26: '84',
        27: '12960',
        28: '320',
        29: '280',
        30: '310',
        31: '700',
        32: '380',
        33: '350',
        35: '288',
        36: '200',
        55: '50.00%',
        56: '50.00%',
        72: '1',
        89: 'Field Dungeon (Boss)',
      }),
      makeRow({
        0: 'Octopirate 2',
        1: 'Ammonite',
        3: '70.0%',
        4: 'Ammonite',
        6: '20.0%',
        26: '249',
        27: '42000',
        28: '800',
        29: '800',
        30: '1080',
        31: '36000',
        32: '1900',
        33: '1780',
        35: '700',
        36: '980',
        55: '200.00%',
        56: '200.00%',
        72: '1',
        89: 'Rune Prana F2 (Boss)',
      }),
      makeRow({
        0: '???',
        1: 'Mysterious Powder',
        3: '8.0%',
      }),
    ];
    const existingMonsters: Record<string, Monster> = {
      'monster-octopirate': {
        id: 'monster-octopirate',
        name: 'Octopirate',
        image: '/images/monsters/octopirate',
        description: 'Base form.',
        location: 'Old location',
        drops: [{ id: 'item-ammonite', name: 'Ammonite', dropRates: [99] }],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: { tameable: true, isRideable: true, befriend: 9, favorite: [], produce: [], cycle: null },
      },
      'monster-octopirate-2': {
        id: 'monster-octopirate-2',
        name: 'Octopirate 2',
        image: '/images/monsters/octopirate',
        description: 'Variant form.',
        location: 'Old location 2',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: { tameable: true, isRideable: true, befriend: 9, favorite: [], produce: [], cycle: null },
      },
    };

    const parsed = parseMonsterCsvRows(rows);
    const { monsters, report } = reconcileMonstersFromCsv(parsed, existingMonsters, {
      Ammonite: 'item-ammonite',
    });

    expect(Object.values(monsters)).toHaveLength(2);
    expect(monsters['monster-octopirate'].variantGroup).toBe('Octopirate');
    expect(monsters['monster-octopirate'].variantSuffix).toBeNull();
    expect(monsters['monster-octopirate-2'].variantGroup).toBe('Octopirate');
    expect(monsters['monster-octopirate-2'].variantSuffix).toBe('2');
    expect(monsters['monster-octopirate'].drops[0]).toEqual({
      id: 'item-ammonite',
      name: 'Ammonite',
      dropRates: [0.7, 0.1],
    });
    expect(monsters['monster-octopirate-2'].drops[0].dropRates).toEqual([70, 20]);
    expect(report.ignoredNames).toContain('???');
    expect(report.groupedVariantFamilies).toEqual(['Octopirate']);
  });

  it('fills produce from CSV only when the existing record is tameable, has positive friendliness, and no produce data', () => {
    const rows = [
      makeRow({
        0: 'Buffamoo',
        26: '10',
        27: '1000',
        28: '20',
        29: '10',
        30: '20',
        31: '100',
        32: '30',
        33: '10',
        35: '20',
        36: '10',
        72: '14',
        85: 'Milk (S)',
        87: '20.0%',
        89: 'Yokmir Forest',
      }),
      makeRow({
        0: 'Wooly',
        26: '3',
        27: '60',
        28: '16',
        29: '10',
        30: '5',
        31: '3',
        32: '10',
        33: '0',
        35: '5',
        36: '0',
        72: '14',
        85: 'Fur (S)',
        87: '20.0%',
        89: 'Selphia Plains',
      }),
      makeRow({
        0: 'Gate',
        26: '1',
        27: '10',
        28: '1',
        29: '1',
        30: '1',
        31: '1',
        32: '1',
        33: '1',
        35: '1',
        36: '1',
        72: '14',
        85: 'Rune Crystal',
        89: 'Obsidian Mansion',
      }),
    ];
    const existingMonsters: Record<string, Monster> = {
      'monster-buffamoo': {
        id: 'monster-buffamoo',
        name: 'Buffamoo',
        image: '/images/monsters/buffamoo',
        description: null,
        location: 'Old location',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: { tameable: true, isRideable: false, befriend: 1, favorite: [], produce: [], cycle: null },
      },
      'monster-wooly': {
        id: 'monster-wooly',
        name: 'Wooly',
        image: '/images/monsters/wooly',
        description: null,
        location: 'Old location',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: {
          tameable: true,
          isRideable: false,
          befriend: 1,
          favorite: [],
          produce: [{ id: 'item-fur-s', name: 'Fur (S)', level: 1 }],
          cycle: null,
        },
      },
      'monster-gate': {
        id: 'monster-gate',
        name: 'Gate',
        image: '/images/monsters/gate',
        description: null,
        location: 'Old location',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: {
          tameable: false,
          isRideable: false,
          befriend: null,
          favorite: [],
          produce: [],
          cycle: null,
        },
      },
    };

    const parsed = parseMonsterCsvRows(rows);
    const { monsters, report } = reconcileMonstersFromCsv(parsed, existingMonsters, {
      'Milk (S)': 'item-milk-s',
      'Fur (S)': 'item-fur-s',
      'Rune Crystal': 'item-rune-crystal',
    });

    expect(monsters['monster-buffamoo'].taming?.produce).toEqual([
      { id: 'item-milk-s', name: 'Milk (S)', level: null },
    ]);
    expect(monsters['monster-wooly'].taming?.produce).toEqual([
      { id: 'item-fur-s', name: 'Fur (S)', level: 1 },
    ]);
    expect(monsters['monster-gate'].taming?.produce).toEqual([]);
    expect(monsters['monster-gate'].taming?.befriend).toBeNull();
    expect(monsters['monster-buffamoo'].taming?.befriend).toBe(14);
    expect(report.produceFallbackApplied).toContain('Buffamoo');
    expect(report.produceFallbackApplied).not.toContain('Wooly');
    expect(report.produceFallbackApplied).not.toContain('Gate');
  });

  it('marks zero-friendliness monsters as non-tameable and clears tameable-only data', () => {
    const rows = [
      makeRow({
        0: 'Death Orc',
        26: '279',
        27: '50000',
        28: '1600',
        29: '600',
        30: '800',
        31: '40500',
        32: '6000',
        33: '4000',
        35: '3800',
        36: '3000',
        72: '0',
        85: 'Ancient Orc Cloth',
        89: 'Rune Prana F7',
      }),
      makeRow({
        0: 'Slime',
        26: '10',
        27: '376',
        28: '38',
        29: '40',
        30: '20',
        31: '99',
        32: '70',
        33: '60',
        35: '68',
        36: '8',
        72: '14',
        89: 'Obsidian Mansion',
      }),
    ];
    const existingMonsters: Record<string, Monster> = {
      'monster-death-orc': {
        id: 'monster-death-orc',
        name: 'Death Orc',
        image: '/images/monsters/death-orc',
        description: null,
        location: 'Old location',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: {
          tameable: true,
          isRideable: null,
          befriend: 1,
          favorite: [{ id: 'item-onigiri', name: 'Onigiri', favorite: 5 }],
          produce: [{ id: 'item-fur-s', name: 'Fur (S)', level: 1 }],
          cycle: 'Daily',
        },
      },
      'monster-slime': {
        id: 'monster-slime',
        name: 'Slime',
        image: '/images/monsters/slime',
        description: null,
        location: 'Old location',
        drops: [],
        nickname: [],
        stats: { baseLevel: 1, hp: 1, atk: 1, def: 1, matk: 1, mdef: 1, str: 1, int: 1, vit: 1, exp: 1, bonus: null },
        resistances: {},
        taming: {
          tameable: true,
          isRideable: false,
          befriend: 1,
          favorite: [{ id: 'item-emerald', name: 'Emerald', favorite: 5 }],
          produce: [],
          cycle: null,
        },
      },
    };

    const parsed = parseMonsterCsvRows(rows);
    const { monsters } = reconcileMonstersFromCsv(parsed, existingMonsters, {
      'Ancient Orc Cloth': 'item-ancient-orc-cloth',
    });

    expect(monsters['monster-death-orc'].taming).toEqual({
      tameable: false,
      isRideable: null,
      befriend: 0,
      favorite: [],
      produce: [],
      cycle: null,
    });
    expect(monsters['monster-slime'].taming?.tameable).toBe(true);
    expect(monsters['monster-slime'].taming?.befriend).toBe(14);
    expect(monsters['monster-slime'].taming?.favorite).toEqual([
      { id: 'item-emerald', name: 'Emerald', favorite: 5 },
    ]);
  });
});
