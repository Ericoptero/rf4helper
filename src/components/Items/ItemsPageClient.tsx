'use client';

import { DEFAULT_ITEMS_SORT, ItemsList, ITEMS_TABLE_ONLY_SORT_VALUES } from '@/components/Items/ItemsList';
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
  const handleViewModeChange = (value: CatalogViewMode) => {
    const normalizedView = value === 'cards' ? undefined : value;
    const resolvedSort = draftSearch.sort ?? DEFAULT_ITEMS_SORT;
    const nextSort = value === 'cards' && ITEMS_TABLE_ONLY_SORT_VALUES.has(resolvedSort)
      ? undefined
      : draftSearch.sort;

    patchSearch({
      view: normalizedView,
      sort: nextSort,
    });
  };

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
      onViewModeChange={handleViewModeChange}
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
