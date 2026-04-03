import {
  Crown,
  Droplets,
  Footprints,
  Flame,
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
  type LucideIcon,
} from 'lucide-react';

import { CRAFTER_RARITY_PLACEHOLDER_ID } from '@/lib/crafterRarity';
import { formatNumber } from '@/lib/formatters';
import { resolveItemImage } from '@/lib/itemImages';
import type { DisplayEffect } from '@/lib/itemPresentation';
import type { CrafterBootstrapItem } from '@/lib/crafterCommon';

export const STAT_DISPLAY_ORDER = ['atk', 'matk', 'def', 'mdef', 'str', 'int', 'vit', 'diz', 'crit', 'knock', 'stun'] as const;
export const PERCENT_STAT_DISPLAY_KEYS = ['crit', 'knock', 'stun'] as const;
export const STATUS_ATTACK_DISPLAY_ORDER = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'faint', 'drain'] as const;
export const GEOMETRY_DISPLAY_ORDER = ['depth', 'length', 'width'] as const;
export const ELEMENT_RESISTANCE_ORDER = ['fire', 'water', 'earth', 'wind', 'light', 'dark', 'love', 'no'] as const;
export const REACTION_RESISTANCE_ORDER = ['diz', 'crit', 'knock'] as const;
export const STATUS_RESISTANCE_ORDER = ['psn', 'seal', 'par', 'slp', 'ftg', 'sick', 'fnt', 'drain'] as const;

const DISPLAY_LABELS: Record<string, string> = {
  atk: 'ATK',
  matk: 'M.ATK',
  def: 'DEF',
  mdef: 'M.DEF',
  str: 'STR',
  int: 'INT',
  vit: 'VIT',
  diz: 'Diz',
  crit: 'Crit',
  knock: 'Knock',
  stun: 'Stun',
  depth: 'Depth',
  length: 'Length',
  width: 'Width',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  wind: 'Wind',
  light: 'Light',
  dark: 'Dark',
  love: 'Love',
  no: 'No',
  psn: 'Psn',
  seal: 'Seal',
  par: 'Par',
  slp: 'Slp',
  ftg: 'Ftg',
  sick: 'Sick',
  faint: 'Faint',
  fnt: 'Faint',
  drain: 'Drain',
};

export function formatStatLabel(stat: string) {
  return DISPLAY_LABELS[stat] ?? stat
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

export function formatStatValue(value: number) {
  return formatNumber(value);
}

export function formatPercentValue(value: number) {
  return `${formatNumber(value * 100)}%`;
}

export function formatFinalStatValue(value: number) {
  return formatNumber(value);
}

export function formatFinalPercentValue(value: number) {
  return `${formatNumber(value * 100)}%`;
}

export function isPercentDisplayStatKey(stat: string): stat is (typeof PERCENT_STAT_DISPLAY_KEYS)[number] {
  return (PERCENT_STAT_DISPLAY_KEYS as readonly string[]).includes(stat);
}

export function formatSignedValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatStatValue(value)}`;
}

export function formatSignedPercentValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatPercentValue(value)}`;
}

export function formatSignedCrafterStatValue(stat: string, value: number) {
  return isPercentDisplayStatKey(stat) ? formatSignedPercentValue(value) : formatSignedValue(value);
}

export function formatSignedFinalValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatFinalStatValue(value)}`;
}

export function formatSignedFinalPercentValue(value: number) {
  return `${value > 0 ? '+' : ''}${formatFinalPercentValue(value)}`;
}

export function formatSignedFinalCrafterStatValue(stat: string, value: number) {
  return isPercentDisplayStatKey(stat) ? formatSignedFinalPercentValue(value) : formatSignedFinalValue(value);
}

export function getItemTypeIcon(type: string): LucideIcon {
  const normalized = type.toLowerCase();

  if (normalized.includes('sword') || normalized.includes('staff') || normalized.includes('spear') || normalized.includes('forge')) {
    return Swords;
  }
  if (normalized.includes('shield')) return Shield;
  if (normalized.includes('armor') || normalized.includes('robe') || normalized.includes('craft')) return Shirt;
  if (normalized.includes('crown') || normalized.includes('helm') || normalized.includes('hat')) return Crown;
  if (normalized.includes('ring') || normalized.includes('belt') || normalized.includes('accessory')) return Gem;
  if (normalized.includes('boot') || normalized.includes('shoe') || normalized.includes('greave')) return Footprints;
  if (normalized.includes('dish') || normalized.includes('food') || normalized.includes('potion')) return Sparkles;
  if (normalized.includes('fire')) return Flame;
  if (normalized.includes('water')) return Droplets;
  if (normalized.includes('earth')) return Mountain;
  if (normalized.includes('wind')) return Wind;
  if (normalized.includes('light')) return Sun;
  if (normalized.includes('dark')) return Moon;

  return Package;
}

export function formatItemEffect(effect: DisplayEffect) {
  if (effect.type === 'label') {
    return effect.label;
  }

  switch (effect.type) {
    case 'cure':
      return `Cures ${effect.targets.join(', ')}`;
    case 'resistance':
      return `${formatStatLabel(effect.target)} resistance ${formatNumber(effect.value)}`;
    case 'inflict':
      return `Inflicts ${effect.target} on ${effect.trigger}`;
  }
}

export function getStatIcon(stat: string): LucideIcon {
  switch (stat) {
    case 'atk':
    case 'str':
      return Swords;
    case 'matk':
    case 'int':
      return Sparkles;
    case 'def':
    case 'mdef':
      return Shield;
    case 'vit':
      return Heart;
    case 'fire':
      return Flame;
    case 'water':
      return Droplets;
    case 'earth':
      return Mountain;
    case 'wind':
      return Wind;
    case 'light':
      return Sun;
    case 'dark':
      return Moon;
    default:
      return Sparkles;
  }
}

export function resolveCrafterItemImage(item?: CrafterBootstrapItem) {
  if (!item) return undefined;
  if (item.id === CRAFTER_RARITY_PLACEHOLDER_ID) return undefined;
  return resolveItemImage(item.name, item.image) ?? item.image;
}
