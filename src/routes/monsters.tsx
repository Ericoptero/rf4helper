import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MonstersList } from '@/components/Monsters/MonstersList';

const monstersSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  tameable: z.string().trim().min(1).optional().catch(undefined),
  boss: z.string().trim().min(1).optional().catch(undefined),
  rideable: z.string().trim().min(1).optional().catch(undefined),
  location: z.string().trim().min(1).optional().catch(undefined),
  drops: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

type MonstersSearch = z.infer<typeof monstersSearchSchema>;

export const Route = createFileRoute('/monsters')({
  validateSearch: (search: Record<string, unknown>): MonstersSearch =>
    monstersSearchSchema.parse(search),
  component: MonstersRoute,
});

function MonstersRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = (key: keyof MonstersSearch, value?: string | string[]) => {
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
    <MonstersList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={search.view}
      onViewModeChange={(value) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort}
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
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof MonstersSearch, value)}
    />
  );
}
