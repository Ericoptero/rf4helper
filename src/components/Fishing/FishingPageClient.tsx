'use client';

import { usePathname, useRouter } from 'next/navigation';

import { FishingList } from '@/components/Fishing/FishingList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { FishingCatalogData, FishingSearchParams } from '@/server/catalogQueries';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function FishingPageClient({
  catalog,
  search,
}: {
  catalog: FishingCatalogData;
  search: FishingSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = <K extends keyof FishingSearchParams>(
    key: K,
    value?: FishingSearchParams[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;
    const nextSearch = { ...search } as Record<string, string | undefined>;

    if (!normalizedValue) delete nextSearch[key];
    else nextSearch[key] = normalizedValue;

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <FishingList
      fish={catalog.results}
      totalCount={catalog.totalCount}
      filterOptions={catalog.filterOptions}
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
        shadow: search.shadow,
        region: search.region,
        season: search.season,
        hasMap: search.hasMap,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof FishingSearchParams, value)}
    />
  );
}
