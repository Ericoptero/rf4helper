import {
  Crown,
  Droplets,
  Flame,
  Footprints,
  Gem,
  Heart,
  Moon,
  Mountain,
  Package,
  Shirt,
  Shield,
  Sparkles,
  Sun,
  Swords,
  Wind,
} from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { CRAFTER_RARITY_PLACEHOLDER_ID } from '@/lib/crafter';
import type { Item } from '@/lib/schemas';
import {
  formatFinalPercentValue,
  formatFinalStatValue,
  formatItemEffect,
  formatPercentValue,
  formatSignedCrafterStatValue,
  formatSignedFinalCrafterStatValue,
  formatSignedPercentValue,
  formatSignedValue,
  formatStatLabel,
  formatStatValue,
  getItemTypeIcon,
  getStatIcon,
  isPercentDisplayStatKey,
  resolveCrafterItemImage,
} from './crafterFormatters';

const resolveItemImageMock = vi.fn();

vi.mock('@/lib/itemImages', () => ({
  resolveItemImage: (...args: unknown[]) => resolveItemImageMock(...args),
}));

function item(overrides: Partial<Item>): Item {
  return {
    id: 'item-test',
    name: 'Test Item',
    type: 'Material',
    ...overrides,
  };
}

describe('crafterFormatters', () => {
  it('formats crafter stat labels and numeric values', () => {
    expect(formatStatLabel('atk')).toBe('ATK');
    expect(formatStatLabel('attackType')).toBe('Attack Type');
    expect(formatStatValue(1234.567)).toBe('1,234.57');
    expect(formatPercentValue(0.456)).toBe('45.6%');
    expect(formatFinalStatValue(1234.567)).toBe('1,235');
    expect(formatFinalPercentValue(0.456)).toBe('46%');
    expect(formatSignedValue(12.5)).toBe('+12.5');
    expect(formatSignedPercentValue(-0.25)).toBe('-25%');
    expect(formatSignedCrafterStatValue('crit', 0.125)).toBe('+12.5%');
    expect(formatSignedCrafterStatValue('atk', -10)).toBe('-10');
    expect(formatSignedFinalCrafterStatValue('knock', 0.12)).toBe('+12%');
    expect(formatSignedFinalCrafterStatValue('def', 7)).toBe('+7');
    expect(isPercentDisplayStatKey('crit')).toBe(true);
    expect(isPercentDisplayStatKey('atk')).toBe(false);
  });

  it('maps item types to the expected crafter icons', () => {
    expect(getItemTypeIcon('Forge')).toBe(Swords);
    expect(getItemTypeIcon('Shield')).toBe(Shield);
    expect(getItemTypeIcon('Craft')).toBe(Shirt);
    expect(getItemTypeIcon('Hat')).toBe(Crown);
    expect(getItemTypeIcon('Accessory')).toBe(Gem);
    expect(getItemTypeIcon('Shoes')).toBe(Footprints);
    expect(getItemTypeIcon('Dish')).toBe(Sparkles);
    expect(getItemTypeIcon('Fire Crystal')).toBe(Flame);
    expect(getItemTypeIcon('Water Crystal')).toBe(Droplets);
    expect(getItemTypeIcon('Earth Crystal')).toBe(Mountain);
    expect(getItemTypeIcon('Wind Crystal')).toBe(Wind);
    expect(getItemTypeIcon('Light Crystal')).toBe(Sun);
    expect(getItemTypeIcon('Dark Crystal')).toBe(Moon);
    expect(getItemTypeIcon('Material')).toBe(Package);
  });

  it('maps stat keys to the expected summary icons', () => {
    expect(getStatIcon('atk')).toBe(Swords);
    expect(getStatIcon('matk')).toBe(Sparkles);
    expect(getStatIcon('def')).toBe(Shield);
    expect(getStatIcon('vit')).toBe(Heart);
    expect(getStatIcon('fire')).toBe(Flame);
    expect(getStatIcon('water')).toBe(Droplets);
    expect(getStatIcon('earth')).toBe(Mountain);
    expect(getStatIcon('wind')).toBe(Wind);
    expect(getStatIcon('light')).toBe(Sun);
    expect(getStatIcon('dark')).toBe(Moon);
    expect(getStatIcon('unknown')).toBe(Sparkles);
  });

  it('formats all supported item effect variants', () => {
    expect(formatItemEffect({ type: 'label', label: 'Inverts following upgrade effects' })).toBe(
      'Inverts following upgrade effects',
    );
    expect(formatItemEffect({ type: 'cure', targets: ['poison', 'seal'] })).toBe('Cures poison, seal');
    expect(formatItemEffect({ type: 'resistance', target: 'fire', value: 50 })).toBe('Fire resistance 50');
    expect(formatItemEffect({ type: 'inflict', target: 'poison', trigger: 'attack' })).toBe('Inflicts poison on attack');
  });

  it('skips placeholder images and resolves real item artwork', () => {
    resolveItemImageMock.mockReset();
    resolveItemImageMock.mockReturnValue('/images/items/test-item.webp');

    expect(
      resolveCrafterItemImage(
        item({
          id: CRAFTER_RARITY_PLACEHOLDER_ID,
          name: 'Rarity Placeholder',
          type: 'Special',
          image: '/images/items/placeholder.webp',
        }),
      ),
    ).toBeUndefined();
    expect(resolveItemImageMock).not.toHaveBeenCalled();

    expect(
      resolveCrafterItemImage(
        item({
          id: 'item-real',
          name: 'Real Item',
          image: '/images/items/real-item.webp',
        }),
      ),
    ).toBe('/images/items/test-item.webp');
    expect(resolveItemImageMock).toHaveBeenCalledWith('Real Item', '/images/items/real-item.webp');
  });
});
