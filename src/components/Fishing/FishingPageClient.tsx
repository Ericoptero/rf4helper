'use client';

import { FishingList } from '@/components/Fishing/FishingList';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { FishingCatalogData, FishingSearchParams } from '@/server/catalogQueries';

export function FishingPageClient({
  catalog,
  search,
}: {
  catalog: FishingCatalogData;
  search: FishingSearchParams;
}) {
  const { draftSearchTerm, setDraftSearchTerm, patchSearch } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(search);

  return (
    <FishingList
      fish={catalog.results}
      totalCount={catalog.totalCount}
      filterOptions={catalog.filterOptions}
      serverDriven
      searchTerm={draftSearchTerm}
      onSearchTermChange={setDraftSearchTerm}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => patchSearch({ view: value === 'cards' ? undefined : value })}
      sortValue={search.sort ?? 'name-asc'}
      onSortValueChange={(value) => patchSearch({ sort: value })}
      detailReference={detailReference}
      onDetailReferenceChange={(reference) => patchSearch({ ...writeDetailSearchParams(reference), detail: undefined })}
      filterValues={{
        shadow: search.shadow,
        region: search.region,
        season: search.season,
        hasMap: search.hasMap,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<FishingSearchParams>)}
    />
  );
}
