import { describe, expect, it } from 'vitest';
import { resolveItemImage } from './itemImages';

describe('resolveItemImage', () => {
  it('resolves item names with numerals and punctuation to the expected asset', () => {
    const image = resolveItemImage('10-Fold Steel');

    expect(image).toBe('/images/items/10-fold-steel.png');
  });

  it('keeps already-public item asset paths intact', () => {
    const image = resolveItemImage(undefined, '/images/items/10-fold-steel.png');

    expect(image).toBe('/images/items/10-fold-steel.png');
  });

  it('resolves explicit item asset paths', () => {
    const image = resolveItemImage(undefined, 'items/10-fold-steel.png');

    expect(image).toBe('/images/items/10-fold-steel.png');
  });

  it('resolves fish asset paths from item data', () => {
    const image = resolveItemImage(undefined, 'fish/masu-trout.png');

    expect(image).toBe('/images/fish/masu-trout.png');
  });

  it('resolves rune ability asset paths from item data', () => {
    const image = resolveItemImage(undefined, 'rune-abilities/rune-power-wave.png');

    expect(image).toBe('/images/rune-abilities/rune-power-wave.png');
  });
});
