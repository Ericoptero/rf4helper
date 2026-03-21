import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ItemsList, type ItemLetterFilter } from '@/components/Items/ItemsList';
import { z } from 'zod';

type ItemsSearch = {
  letter?: ItemLetterFilter;
  q?: string;
};

const itemLetterFilterSchema = z.enum(['all', ...'abcdefghijklmnopqrstuvwxyz'.split(''), '#'] as [ItemLetterFilter, ...ItemLetterFilter[]]);
const itemsSearchSchema = z.object({
  letter: itemLetterFilterSchema.optional().catch(undefined),
  q: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/items')({
  validateSearch: (search: Record<string, unknown>): ItemsSearch => {
    const parsedSearch = itemsSearchSchema.parse({
      letter: typeof search.letter === 'string' ? search.letter.toLowerCase() : undefined,
      q: typeof search.q === 'string' ? search.q : undefined,
    });

    return {
      letter: parsedSearch.letter === 'all' ? undefined : parsedSearch.letter,
      q: parsedSearch.q,
    };
  },
  component: ItemsRoute,
});

function ItemsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateLetterFilter = (letter: ItemLetterFilter) => {
    void navigate({
      search: (previous) => {
        const { letter: _letter, ...rest } = previous;

        if (letter === 'all') {
          return rest;
        }

        return {
          ...rest,
          letter,
        };
      },
      replace: true,
    });
  };

  const updateSearchTerm = (value: string) => {
    const normalizedValue = value.trim();

    void navigate({
      search: (previous) => {
        const { q: _q, ...rest } = previous;

        if (!normalizedValue) {
          return rest;
        }

        return {
          ...rest,
          q: normalizedValue,
        };
      },
      replace: true,
    });
  };

  return (
    <ItemsList
      searchTerm={search.q ?? ''}
      onSearchTermChange={updateSearchTerm}
      letterFilter={search.letter ?? 'all'}
      onLetterFilterChange={updateLetterFilter}
    />
  );
}
