'use client';

import {
  CharactersList,
  CHARACTERS_TABLE_ONLY_SORT_VALUES,
  DEFAULT_CHARACTERS_SORT,
} from '@/components/Characters/CharactersList';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { CharactersCatalogData, CharactersSearchParams } from '@/server/catalogQueries';

export function CharactersPageClient({
  catalog,
  search,
}: {
  catalog: CharactersCatalogData;
  search: CharactersSearchParams;
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
    const resolvedSort = draftSearch.sort ?? DEFAULT_CHARACTERS_SORT;
    const nextSort = value === 'cards' && CHARACTERS_TABLE_ONLY_SORT_VALUES.has(resolvedSort)
      ? undefined
      : draftSearch.sort;

    patchSearch({
      view: normalizedView,
      sort: nextSort,
    });
  };

  return (
    <CharactersList
      characters={catalog.results}
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
        category: draftSearch.category,
        gender: draftSearch.gender,
        season: draftSearch.season,
        battle: draftSearch.battle,
        weaponType: draftSearch.weaponType,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<CharactersSearchParams>)}
      resultResetKeys={[
        catalog.results.length,
        search.q ?? '',
        search.sort ?? 'name-asc',
        search.category ?? '',
        search.gender ?? '',
        search.season ?? '',
        search.battle ?? '',
        search.weaponType ?? '',
      ]}
    />
  );
}
