'use client';

import { MonstersList } from '@/components/Monsters/MonstersList';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { MonstersCatalogData, MonstersSearchParams } from '@/server/catalogQueries';

export function MonstersPageClient({
  catalog,
  search,
}: {
  catalog: MonstersCatalogData;
  search: MonstersSearchParams;
}) {
  const { draftSearchTerm, setDraftSearchTerm, patchSearch } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(search);

  return (
    <MonstersList
      monsters={catalog.results}
      totalCount={catalog.totalCount}
      filterOptions={catalog.filterOptions}
      searchTerm={draftSearchTerm}
      onSearchTermChange={setDraftSearchTerm}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => patchSearch({ view: value === 'cards' ? undefined : value })}
      sortValue={search.sort ?? 'name-asc'}
      onSortValueChange={(value) => patchSearch({ sort: value })}
      detailReference={detailReference}
      onDetailReferenceChange={(reference) => patchSearch({ ...writeDetailSearchParams(reference), detail: undefined })}
      filterValues={{
        tameable: search.tameable,
        boss: search.boss,
        rideable: search.rideable,
        location: search.location,
        drops: search.drops,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<MonstersSearchParams>)}
    />
  );
}
