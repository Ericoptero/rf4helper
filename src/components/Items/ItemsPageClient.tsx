'use client';

import { ItemsList } from '@/components/Items/ItemsList';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { ItemsCatalogData, ItemsSearchParams } from '@/server/catalogQueries';

export function ItemsPageClient({
  catalog,
  search,
}: {
  catalog: ItemsCatalogData;
  search: ItemsSearchParams;
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
    <ItemsList
      items={catalog.results}
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
        type: draftSearch.type,
        category: draftSearch.category,
        region: draftSearch.region,
        ship: draftSearch.ship,
        buyable: draftSearch.buyable,
        sellable: draftSearch.sellable,
        rarity: draftSearch.rarity,
        craft: draftSearch.craft,
        effects: draftSearch.effects,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<ItemsSearchParams>)}
      resultResetKeys={[
        catalog.results.length,
        search.q ?? '',
        search.sort ?? 'name-asc',
        search.type ?? '',
        search.category ?? '',
        search.region ?? '',
        search.ship ?? '',
        search.buyable ?? '',
        search.sellable ?? '',
        search.rarity ?? '',
        search.craft ?? '',
        search.effects ?? '',
      ]}
    />
  );
}
