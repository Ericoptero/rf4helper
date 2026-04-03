import { describe, expect, it } from 'vitest';

import { capitalize, formatName, formatNumber } from './formatters';

describe('formatters', () => {
  it('formats known entity prefixes into readable names', () => {
    expect(formatName('item-golden-cabbage')).toBe('Golden Cabbage');
    expect(formatName('monster-death-orc')).toBe('Death Orc');
    expect(formatName('fish-lamp-squid')).toBe('Lamp Squid');
  });

  it('formats numbers with locale separators and nullish fallbacks', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(1234.56)).toBe('1,234.6');
    expect(formatNumber(1234.04)).toBe('1,234');
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
  });

  it('capitalizes strings while preserving empty values', () => {
    expect(capitalize('broadsword')).toBe('Broadsword');
    expect(capitalize('')).toBe('');
  });
});
