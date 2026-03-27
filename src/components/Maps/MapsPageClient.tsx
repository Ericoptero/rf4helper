'use client';

import { usePathname, useRouter } from 'next/navigation';

import { MapsList } from '@/components/Maps/MapsList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { MapsCatalogData, MapsSearchParams } from '@/server/catalogQueries';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function MapsPageClient({
  catalog,
  search,
}: {
  catalog: MapsCatalogData;
  search: MapsSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = <K extends keyof MapsSearchParams>(
    key: K,
    value?: MapsSearchParams[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;
    const nextSearch = { ...search } as Record<string, string | undefined>;

    if (!normalizedValue) delete nextSearch[key];
    else nextSearch[key] = normalizedValue;

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <MapsList
      regions={catalog.results}
      totalCount={catalog.totalCount}
      serverDriven
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort ?? 'name-asc'}
      onSortValueChange={(value) => updateSearchValue('sort', value)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
      filterValues={{
        hasFishing: search.hasFishing,
        hasNotes: search.hasNotes,
        hasRecipe: search.hasRecipe,
        chestBand: search.chestBand,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof MapsSearchParams, value)}
    />
  );
}
