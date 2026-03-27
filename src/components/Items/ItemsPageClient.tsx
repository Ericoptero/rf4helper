'use client';

import { usePathname, useRouter } from 'next/navigation';

import { ItemsList } from '@/components/Items/ItemsList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { ItemsCatalogData, ItemsSearchParams } from '@/server/catalogQueries';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(search).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function ItemsPageClient({
  catalog,
  search,
}: {
  catalog: ItemsCatalogData;
  search: ItemsSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = <K extends keyof ItemsSearchParams>(
    key: K,
    value?: ItemsSearchParams[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;
    const nextSearch: Record<string, string | undefined> = { ...search } as Record<string, string | undefined>;

    if (!normalizedValue) {
      delete nextSearch[key];
    } else {
      nextSearch[key] = normalizedValue;
    }

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <ItemsList
      items={Object.fromEntries(catalog.results.map((item) => [item.id, item]))}
      totalCount={catalog.totalCount}
      filterOptions={catalog.filterOptions}
      serverDriven
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort ?? 'name-asc'}
      onSortValueChange={(value) => updateSearchValue('sort', value)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
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
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof ItemsSearchParams, value)}
    />
  );
}
