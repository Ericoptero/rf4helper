'use client';

import {
  DEFAULT_FISHING_SORT,
  FishingList,
  FISHING_TABLE_ONLY_SORT_VALUES,
} from '@/components/Fishing/FishingList';
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
  const {
    draftSearch,
    draftSearchTerm,
    setDraftSearchTerm,
    isRoutePending,
    commitSearchNow,
    cancelPendingSearch,
    patchSearch,
  } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(draftSearch);
  const handleViewModeChange = (value: CatalogViewMode) => {
    const normalizedView = value === 'cards' ? undefined : value;
    const resolvedSort = draftSearch.sort ?? DEFAULT_FISHING_SORT;
    const nextSort = value === 'cards' && FISHING_TABLE_ONLY_SORT_VALUES.has(resolvedSort)
      ? undefined
      : draftSearch.sort;

    patchSearch({
      view: normalizedView,
      sort: nextSort,
    });
  };

  return (
    <FishingList
      fish={catalog.results}
      totalCount={catalog.totalCount}
      filterOptions={catalog.filterOptions}
      searchTerm={draftSearchTerm}
      onSearchTermChange={setDraftSearchTerm}
      onCommitSearch={commitSearchNow}
      onClearSearch={() => {
        setDraftSearchTerm('');
        commitSearchNow();
      }}
      onCancelPendingSearch={cancelPendingSearch}
      isRoutePending={isRoutePending}
      viewMode={normalizeCatalogViewMode(draftSearch.view)}
      onViewModeChange={handleViewModeChange}
      sortValue={draftSearch.sort ?? 'name-asc'}
      onSortValueChange={(value) => patchSearch({ sort: value })}
      detailReference={detailReference}
      onDetailReferenceChange={(reference) => patchSearch({ ...writeDetailSearchParams(reference), detail: undefined })}
      filterValues={{
        shadow: draftSearch.shadow,
        region: draftSearch.region,
        season: draftSearch.season,
        hasMap: draftSearch.hasMap,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<FishingSearchParams>)}
      resultResetKeys={[
        catalog.results.length,
        search.q ?? '',
        search.sort ?? 'name-asc',
        search.shadow ?? '',
        search.region ?? '',
        search.season ?? '',
        search.hasMap ?? '',
      ]}
    />
  );
}
