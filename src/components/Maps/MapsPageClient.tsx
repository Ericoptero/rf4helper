'use client';

import { MapsList } from '@/components/Maps/MapsList';
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
  const { draftSearchTerm, setDraftSearchTerm, patchSearch } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(search);

  return (
    <MapsList
      regions={catalog.results}
      totalCount={catalog.totalCount}
      searchTerm={draftSearchTerm}
      onSearchTermChange={setDraftSearchTerm}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => patchSearch({ view: value === 'cards' ? undefined : value })}
      sortValue={search.sort ?? 'name-asc'}
      onSortValueChange={(value) => patchSearch({ sort: value })}
      detailReference={detailReference}
      onDetailReferenceChange={(reference) => patchSearch({ ...writeDetailSearchParams(reference), detail: undefined })}
      filterValues={{
        hasFishing: search.hasFishing,
        hasNotes: search.hasNotes,
        hasRecipe: search.hasRecipe,
        chestBand: search.chestBand,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<MapsSearchParams>)}
    />
  );
}
