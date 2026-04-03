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
      onViewModeChange={(value: CatalogViewMode) => patchSearch({ view: value === 'cards' ? undefined : value })}
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
