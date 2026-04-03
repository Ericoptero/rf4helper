'use client';

import {
  DEFAULT_MONSTERS_SORT,
  MONSTERS_TABLE_ONLY_SORT_VALUES,
  MonstersList,
} from '@/components/Monsters/MonstersList';
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
    const resolvedSort = draftSearch.sort ?? DEFAULT_MONSTERS_SORT;
    const nextSort = value === 'cards' && MONSTERS_TABLE_ONLY_SORT_VALUES.has(resolvedSort)
      ? undefined
      : draftSearch.sort;

    patchSearch({
      view: normalizedView,
      sort: nextSort,
    });
  };

  return (
    <MonstersList
      monsters={catalog.results}
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
        tameable: draftSearch.tameable,
        boss: draftSearch.boss,
        rideable: draftSearch.rideable,
        location: draftSearch.location,
        drops: draftSearch.drops,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<MonstersSearchParams>)}
      resultResetKeys={[
        catalog.results.length,
        search.q ?? '',
        search.sort ?? 'name-asc',
        search.tameable ?? '',
        search.boss ?? '',
        search.rideable ?? '',
        search.location ?? '',
        search.drops ?? '',
      ]}
    />
  );
}
