import { describe, expect, it } from 'vitest';

import {
  resolveCharacterImageUrl,
  resolveFishImageUrl,
  resolveItemImageUrl,
  resolveMonsterImageUrl,
  resolveRuneAbilityImageUrl,
} from './publicAssetUrls';

describe('public asset url resolvers', () => {
  it('resolves item images from explicit asset paths', () => {
    expect(resolveItemImageUrl('Bread', 'items/Fresh Bread.png')).toBe('/images/items/fresh-bread.png');
  });

  it('resolves item images from names when no asset path is present', () => {
    expect(resolveItemImageUrl("Ambrosia's Thorns")).toBe('/images/items/ambrosia-s-thorns.png');
    expect(resolveItemImageUrl(undefined, undefined)).toBeUndefined();
  });

  it('resolves character, fish, and rune ability images to the public images directory', () => {
    expect(resolveCharacterImageUrl('/characters/icons/md/Forte.png')).toBe('/images/characters/icons/md/forte.png');
    expect(resolveFishImageUrl('fish/Masu Trout.png')).toBe('/images/fish/masu-trout.png');
    expect(resolveRuneAbilityImageUrl('rune abilities/Rush Attack.png')).toBe('/images/rune abilities/rush-attack.png');
    expect(resolveCharacterImageUrl(null)).toBeUndefined();
    expect(resolveFishImageUrl(undefined)).toBeUndefined();
    expect(resolveRuneAbilityImageUrl(null)).toBeUndefined();
  });

  it('keeps monster png paths intact and appends the extension when needed', () => {
    expect(resolveMonsterImageUrl('/images/monsters/orc.png')).toBe('/images/monsters/orc.png');
    expect(resolveMonsterImageUrl('/images/monsters/orc')).toBe('/images/monsters/orc.png');
    expect(resolveMonsterImageUrl(undefined)).toBeUndefined();
  });
});
