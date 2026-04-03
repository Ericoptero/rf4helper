'use client';

import {
  DEFAULT_MAPS_SORT,
  MAPS_TABLE_ONLY_SORT_VALUES,
  MapsList,
} from '@/components/Maps/MapsList';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { MapsCatalogData, MapsSearchParams } from '@/server/catalogQueries';

export function MapsPageClient({
  catalog,
  search,
}: {
  catalog: MapsCatalogData;
  search: MapsSearchParams;
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
    const resolvedSort = draftSearch.sort ?? DEFAULT_MAPS_SORT;
    const nextSort = value === 'cards' && MAPS_TABLE_ONLY_SORT_VALUES.has(resolvedSort)
      ? undefined
      : draftSearch.sort;

    patchSearch({
      view: normalizedView,
      sort: nextSort,
    });
  };

  return (
    <MapsList
      regions={catalog.results}
      totalCount={catalog.totalCount}
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
        hasFishing: draftSearch.hasFishing,
        hasNotes: draftSearch.hasNotes,
        hasRecipe: draftSearch.hasRecipe,
        chestBand: draftSearch.chestBand,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<MapsSearchParams>)}
      resultResetKeys={[
        catalog.results.length,
        search.q ?? '',
        search.sort ?? 'name-asc',
        search.hasFishing ?? '',
        search.hasNotes ?? '',
        search.hasRecipe ?? '',
        search.chestBand ?? '',
      ]}
    />
  );
}
