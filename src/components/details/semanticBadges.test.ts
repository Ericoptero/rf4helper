import { describe, expect, it } from 'vitest';
import { getSemanticBadgeClass } from './semanticBadges';

describe('getSemanticBadgeClass', () => {
  it('returns readable light and dark mode classes for semantic badges', () => {
    const info = getSemanticBadgeClass('info');
    const item = getSemanticBadgeClass('item');
    const danger = getSemanticBadgeClass('danger');

    expect(info).toContain('text-sky-700');
    expect(info).toContain('dark:text-sky-200');
    expect(item).toContain('text-indigo-700');
    expect(item).toContain('dark:text-indigo-200');
    expect(danger).toContain('text-rose-700');
    expect(danger).toContain('dark:text-rose-200');
  });
});
