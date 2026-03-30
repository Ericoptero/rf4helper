'use client';

import { CharactersList } from '@/components/Characters/CharactersList';
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
  const { draftSearchTerm, setDraftSearchTerm, patchSearch } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(search);

  return (
    <CharactersList
      characters={catalog.results}
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
        category: search.category,
        gender: search.gender,
        season: search.season,
        battle: search.battle,
        weaponType: search.weaponType,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<CharactersSearchParams>)}
    />
  );
}
