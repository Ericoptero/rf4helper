import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { ItemsList } from '@/components/Items/ItemsList';
import { normalizeCatalogViewMode, type CatalogViewMode } from '@/lib/catalogPresentation';

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

type ItemsSearch = z.infer<typeof itemsSearchSchema>;

export const Route = createFileRoute('/items')({
  validateSearch: (search: Record<string, unknown>): ItemsSearch => itemsSearchSchema.parse(search),
  component: ItemsRoute,
});

function ItemsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = <K extends keyof ItemsSearch>(
    key: K,
    value?: ItemsSearch[K] | string[],
  ) => {
    const normalizedValue = Array.isArray(value) ? value.join(',') || undefined : value;

    void navigate({
      search: (previous) => {
        const next: Record<string, string | undefined> = { ...previous };
        delete next.letter;
        if (!normalizedValue) {
          delete next[key];
          return next as ItemsSearch;
        }

        next[key] = normalizedValue;
        return next as ItemsSearch;
      },
      replace: true,
    });
  };

  return (
    <ItemsList
      searchTerm={search.q ?? ''}
      onSearchTermChange={(value) => updateSearchValue('q', value.trim() || undefined)}
      viewMode={normalizeCatalogViewMode(search.view)}
      onViewModeChange={(value: CatalogViewMode) => updateSearchValue('view', value === 'cards' ? undefined : value)}
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
