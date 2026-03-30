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
  const { draftSearchTerm, setDraftSearchTerm, patchSearch } = useCatalogRouteState({
    search,
    searchTermKey: 'q',
  });
  const detailReference = readDetailSearchParams(search);

  return (
    <ItemsList
      items={catalog.results}
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
        type: search.type,
        category: search.category,
        region: search.region,
        ship: search.ship,
        buyable: search.buyable,
        sellable: search.sellable,
        rarity: search.rarity,
        craft: search.craft,
        effects: search.effects,
      }}
      onFilterValuesChange={(values) => patchSearch(values as Partial<ItemsSearchParams>)}
    />
  );
}
