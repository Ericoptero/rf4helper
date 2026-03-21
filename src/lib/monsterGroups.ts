import type { Monster } from './schemas';

export type MonsterGroup = {
  key: string;
  displayName: string;
  representative: Monster;
  variants: Monster[];
  locations: string[];
  searchText: string;
};

export function getMonsterGroupKey(monster: Monster) {
  return monster.variantGroup ?? monster.name;
}

export function isMonsterActuallyTameable(monster: Monster) {
  return Boolean(monster.taming?.tameable && (monster.taming.befriend ?? 0) > 0);
}

function getRepresentativeVariant(variants: Monster[]) {
  return [...variants].sort((a, b) => {
    const aBase = a.variantSuffix ? 1 : 0;
    const bBase = b.variantSuffix ? 1 : 0;
    if (aBase !== bBase) return aBase - bBase;
    return a.name.localeCompare(b.name);
  })[0];
}

export function buildMonsterGroups(monsters: Monster[]) {
  const groups = new Map<string, Monster[]>();

  for (const monster of monsters) {
    const key = getMonsterGroupKey(monster);
    const existing = groups.get(key) ?? [];
    existing.push(monster);
    groups.set(key, existing);
  }

  return [...groups.entries()].map(([key, variants]) => {
    const representative = getRepresentativeVariant(variants);
    const locations = [
      ...new Set(variants.map((variant) => variant.location).filter((location): location is string => Boolean(location))),
    ];
    const searchText = [key, ...variants.map((variant) => variant.name), ...locations].join(' ');

    return {
      key,
      displayName: key,
      representative,
      variants: [...variants].sort((a, b) => a.name.localeCompare(b.name)),
      locations,
      searchText,
    };
  });
}
