import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { ItemsList } from '@/components/Items/ItemsList';

type ItemsSearch = {
  q?: string;
  view?: 'cards' | 'table';
  sort?: string;
  type?: string;
  category?: string;
  region?: string;
  ship?: string;
  buyable?: string;
  sellable?: string;
  rarity?: string;
  craft?: string;
  effects?: string;
  detail?: string;
};

const itemsSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  view: z.enum(['cards', 'table']).optional().catch(undefined),
  sort: z.string().trim().min(1).optional().catch(undefined),
  type: z.string().trim().min(1).optional().catch(undefined),
  category: z.string().trim().min(1).optional().catch(undefined),
  region: z.string().trim().min(1).optional().catch(undefined),
  ship: z.string().trim().min(1).optional().catch(undefined),
  buyable: z.string().trim().min(1).optional().catch(undefined),
  sellable: z.string().trim().min(1).optional().catch(undefined),
  rarity: z.string().trim().min(1).optional().catch(undefined),
  craft: z.string().trim().min(1).optional().catch(undefined),
  effects: z.string().trim().min(1).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/items')({
  validateSearch: (search: Record<string, unknown>): ItemsSearch => itemsSearchSchema.parse(search),
  component: ItemsRoute,
});

function ItemsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = (key: keyof ItemsSearch, value?: string | string[]) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;

    void navigate({
      search: (previous) => {
        const next = { ...previous };
        delete (next as Record<string, unknown>).letter;
        if (!normalizedValue) {
          delete next[key];
          return next;
        }

        next[key] = normalizedValue as never;
        return next;
      },
      replace: true,
    });
  };

  return (
    <ItemsList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={search.view}
      onViewModeChange={(value) => updateSearchValue('view', value === 'cards' ? undefined : value)}
      sortValue={search.sort}
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
      onFilterValueChange={(key, value) => updateSearchValue(key as keyof ItemsSearch, value)}
    />
  );
}
