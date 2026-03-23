import { describe, expect, it } from 'vitest';
import {
  appSurfaceClassNames,
  catalogViewModes,
  isCatalogViewMode,
  normalizeCatalogViewMode,
} from './catalogPresentation';

describe('catalogPresentation', () => {
  it('accepts only the supported catalog view modes', () => {
    expect(catalogViewModes).toEqual(['cards', 'table']);
    expect(isCatalogViewMode('cards')).toBe(true);
    expect(isCatalogViewMode('table')).toBe(true);
    expect(isCatalogViewMode('grid')).toBe(false);
    expect(isCatalogViewMode(undefined)).toBe(false);
  });

  it('normalizes unknown values to an undefined view mode', () => {
    expect(normalizeCatalogViewMode('cards')).toBe('cards');
    expect(normalizeCatalogViewMode('table')).toBe('table');
    expect(normalizeCatalogViewMode('grid')).toBeUndefined();
    expect(normalizeCatalogViewMode(null)).toBeUndefined();
  });

  it('defines the shared visual surfaces used by the app shell and dashboard', () => {
    expect(appSurfaceClassNames.shell).toContain('rounded-3xl');
    expect(appSurfaceClassNames.panel).toContain('bg-card/90');
    expect(appSurfaceClassNames.interactivePanel).toContain('hover:border-primary/40');
    expect(appSurfaceClassNames.sidebar).toContain('backdrop-blur');
  });
});
