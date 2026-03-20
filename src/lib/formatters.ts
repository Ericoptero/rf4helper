/**
 * Shared formatting utilities for Rune Factory 4 Helper.
 *
 * These were previously duplicated across ItemsList, CharactersList,
 * and CalendarView. Now centralized here.
 */

/**
 * Convert a slug ID like "item-golden-cabbage" into "Golden Cabbage"
 */
export function formatName(id: string): string {
  return id
    .replace(/^item-|recipe-|monster-|char-|chest-|crop-|fish-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Format a number with locale-aware thousand separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString();
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
