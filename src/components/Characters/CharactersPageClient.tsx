'use client';

import { usePathname, useRouter } from 'next/navigation';

import { CharactersList } from '@/components/Characters/CharactersList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';
import type { CharactersCatalogData, CharactersSearchParams } from '@/server/catalogQueries';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function CharactersPageClient({
  catalog,
  search,
}: {
  catalog: CharactersCatalogData;
  search: CharactersSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = <K extends keyof CharactersSearchParams>(
    key: K,
    value?: CharactersSearchParams[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;
    const nextSearch = { ...search } as Record<string, string | undefined>;

    if (!normalizedValue) delete nextSearch[key];
    else nextSearch[key] = normalizedValue;

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <CharactersList
      characters={Object.fromEntries(catalog.results.map((character) => [character.id, character]))}
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
        category: search.category,
        gender: search.gender,
        season: search.season,
        battle: search.battle,
        weaponType: search.weaponType,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof CharactersSearchParams, value)}
    />
  );
}
