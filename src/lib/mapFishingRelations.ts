import type { Chest, Fish } from './schemas';

export type FishingRegionTag = {
  fishId: string;
  fishName: string;
  spot: string;
  sourceRegion: string;
};

export type MapRegionRecord = {
  id: string;
  name: string;
  chests: Chest[];
  fishingLocations: FishingRegionTag[];
};

export function normalizeRegionName(value: string) {
  return value.toLowerCase().replace(/and/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function regionsHeuristicallyMatch(left: string, right: string) {
  const normalizedLeft = normalizeRegionName(left);
  const normalizedRight = normalizeRegionName(right);

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

export function buildMapRegions(chests: Chest[], fish: Fish[]): MapRegionRecord[] {
  const regionsMap = chests.reduce((acc, chest) => {
    const region = chest.region || 'Unknown Region';
    if (!acc[region]) {
      acc[region] = {
        id: region,
        name: region,
        chests: [],
        fishingLocations: [],
      };
    }
    acc[region].chests.push(chest);
    return acc;
  }, {} as Record<string, MapRegionRecord>);

  for (const region of Object.values(regionsMap)) {
    const fishingLocations: FishingRegionTag[] = [];

    for (const fishEntry of fish) {
      for (const location of fishEntry.locations ?? []) {
        if (!regionsHeuristicallyMatch(location.region, region.name)) {
          continue;
        }

        fishingLocations.push({
          fishId: fishEntry.id,
          fishName: fishEntry.name,
          spot: location.spot,
          sourceRegion: location.region,
        });
      }
    }

    region.fishingLocations = fishingLocations;
  }

  return Object.values(regionsMap).sort((a, b) => a.name.localeCompare(b.name));
}
