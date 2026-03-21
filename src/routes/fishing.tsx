import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { FishingList } from '@/components/Fishing/FishingList';

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

  const updateSearchValue = (key: keyof FishingSearch, value?: string) => {
    void navigate({
      search: (previous) => {
        const next = { ...previous };
        if (!value) {
          delete next[key];
          return next;
        }

        next[key] = value;
        return next;
      },
      replace: true,
    });
  };

  return (
    <FishingList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={search.view}
      onViewModeChange={(value) => updateSearchValue('view', value === 'cards' ? undefined : value)}
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
