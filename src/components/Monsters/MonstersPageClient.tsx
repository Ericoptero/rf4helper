'use client';

import { usePathname, useRouter } from 'next/navigation';

import { MonstersList } from '@/components/Monsters/MonstersList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { MonstersCatalogData, MonstersSearchParams } from '@/server/catalogQueries';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function MonstersPageClient({
  catalog,
  search,
}: {
  catalog: MonstersCatalogData;
  search: MonstersSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = <K extends keyof MonstersSearchParams>(
    key: K,
    value?: MonstersSearchParams[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;
    const nextSearch = { ...search } as Record<string, string | undefined>;

    if (!normalizedValue) delete nextSearch[key];
    else nextSearch[key] = normalizedValue;

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <MonstersList
      monsters={Object.fromEntries(catalog.results.flatMap((group) => group.variants.map((monster) => [monster.id, monster])))}
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
        tameable: search.tameable,
        boss: search.boss,
        rideable: search.rideable,
        location: search.location,
        drops: search.drops,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof MonstersSearchParams, value)}
    />
  );
}
