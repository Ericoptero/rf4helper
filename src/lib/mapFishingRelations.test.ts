import { describe, expect, it } from 'vitest';

import { buildMapRegions, normalizeRegionName } from './mapFishingRelations';

describe('map and fishing relations', () => {
  it('normalizes region names for loose matching', () => {
    expect(normalizeRegionName('Autumn Road and Beyond')).toBe('autumn road beyond');
    expect(normalizeRegionName('Yokmir-Forest')).toBe('yokmir forest');
  });

  it('groups chests by region, links fish heuristically, and sorts results by name', () => {
    const regions = buildMapRegions(
      [
        { id: 'chest-1', region: 'Autumn Road' },
        { id: 'chest-2', region: 'Water Ruins' },
      ] as never,
      [
        {
          id: 'fish-char',
          name: 'Char',
          locations: [{ region: 'Autumn Road and Beyond', spot: 'Bridge' }],
        },
        {
          id: 'fish-sardine',
          name: 'Sardine',
          locations: [{ region: 'Water-Ruins', spot: 'Lower Pool' }],
        },
      ] as never,
    );

    expect(regions.map((region) => region.name)).toEqual(['Autumn Road', 'Water Ruins']);
    expect(regions[0]?.fishingLocations).toEqual([
      {
        fishId: 'fish-char',
        fishName: 'Char',
        spot: 'Bridge',
        sourceRegion: 'Autumn Road and Beyond',
      },
    ]);
    expect(regions[1]?.fishingLocations).toEqual([
      {
        fishId: 'fish-sardine',
        fishName: 'Sardine',
        spot: 'Lower Pool',
        sourceRegion: 'Water-Ruins',
      },
    ]);
  });
});
