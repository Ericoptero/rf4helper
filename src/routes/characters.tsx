import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CharactersList } from '@/components/Characters/CharactersList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';

const charactersSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  category: z.string().trim().min(1).optional().catch(undefined),
  gender: z.string().trim().min(1).optional().catch(undefined),
  season: z.string().trim().min(1).optional().catch(undefined),
  battle: z.string().trim().min(1).optional().catch(undefined),
  weaponType: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

type CharactersSearch = z.infer<typeof charactersSearchSchema>;

export const Route = createFileRoute('/characters')({
  validateSearch: (search: Record<string, unknown>): CharactersSearch =>
    charactersSearchSchema.parse(search),
  component: CharactersRoute,
});

function CharactersRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = <K extends keyof CharactersSearch>(
    key: K,
    value?: CharactersSearch[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;

    void navigate({
      search: (previous) => {
        const next: Record<string, string | undefined> = { ...previous };
        if (!normalizedValue) {
          delete next[key];
          return next as CharactersSearch;
        }

        next[key] = normalizedValue;
        return next as CharactersSearch;
      },
      replace: true,
    });
  };

  return (
    <CharactersList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort}
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
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof CharactersSearch, value)}
    />
  );
}
