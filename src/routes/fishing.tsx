import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { FishingList } from '@/components/Fishing/FishingList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';

const fishingSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  shadow: z.string().trim().min(1).optional().catch(undefined),
  region: z.string().trim().min(1).optional().catch(undefined),
  season: z.string().trim().min(1).optional().catch(undefined),
  hasMap: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

type FishingSearch = z.infer<typeof fishingSearchSchema>;

export const Route = createFileRoute('/fishing')({
  validateSearch: (search: Record<string, unknown>): FishingSearch =>
    fishingSearchSchema.parse(search),
  component: FishingRoute,
});

function FishingRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = <K extends keyof FishingSearch>(
    key: K,
    value?: FishingSearch[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;

    void navigate({
      search: (previous) => {
        const next: Record<string, string | undefined> = { ...previous };
        if (!normalizedValue) {
          delete next[key];
          return next as FishingSearch;
        }

        next[key] = normalizedValue;
        return next as FishingSearch;
      },
      replace: true,
    });
  };

  return (
    <FishingList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort}
      onSortValueChange={(value) => updateSearchValue('sort', value)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
      filterValues={{
        shadow: search.shadow,
        region: search.region,
        season: search.season,
        hasMap: search.hasMap,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof FishingSearch, value)}
    />
  );
}
