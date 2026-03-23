export const catalogViewModes = ['cards', 'table'] as const;

export type CatalogViewMode = (typeof catalogViewModes)[number];

export function isCatalogViewMode(value: unknown): value is CatalogViewMode {
  return typeof value === 'string' && catalogViewModes.includes(value as CatalogViewMode);
}

export function normalizeCatalogViewMode(value: unknown): CatalogViewMode | undefined {
  return isCatalogViewMode(value) ? value : undefined;
}

export const appSurfaceClassNames = {
  shell: 'rounded-3xl border bg-card/90 shadow-sm',
  panel: 'rounded-2xl border bg-card/90 shadow-sm',
  interactivePanel:
    'rounded-2xl border bg-card/90 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/40',
  sidebar: 'border-r bg-card/85 backdrop-blur',
  drawer: 'bg-background/95 supports-[backdrop-filter]:bg-background/80',
} as const;
