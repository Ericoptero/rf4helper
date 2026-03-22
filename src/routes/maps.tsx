import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MapsList } from '@/components/Maps/MapsList';

const mapsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  hasFishing: z.string().trim().min(1).optional().catch(undefined),
  hasNotes: z.string().trim().min(1).optional().catch(undefined),
  hasRecipe: z.string().trim().min(1).optional().catch(undefined),
  chestBand: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

type MapsSearch = z.infer<typeof mapsSearchSchema>;

export const Route = createFileRoute('/maps')({
  validateSearch: (search: Record<string, unknown>): MapsSearch =>
    mapsSearchSchema.parse(search),
  component: MapsRoute,
});

function MapsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = (key: keyof MapsSearch, value?: string | string[]) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;

    void navigate({
      search: (previous) => {
        const next = { ...previous };
        if (!normalizedValue) {
          delete next[key];
          return next;
        }

        next[key] = normalizedValue;
        return next;
      },
      replace: true,
    });
  };

  return (
    <MapsList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={search.view}
      onViewModeChange={(value) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort}
      onSortValueChange={(value) => updateSearchValue('sort', value)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
      filterValues={{
        hasFishing: search.hasFishing,
        hasNotes: search.hasNotes,
        hasRecipe: search.hasRecipe,
        chestBand: search.chestBand,
      }}
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof MapsSearch, value)}
    />
  );
}
