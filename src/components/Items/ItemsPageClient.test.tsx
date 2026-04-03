import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ItemsPageClient } from './ItemsPageClient';
import type { Item } from '@/lib/schemas';
import type { ItemsCatalogData, ItemsSearchParams } from '@/server/catalogQueries';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/items',
  useRouter: () => ({
    replace,
  }),
}));

const mockItem = {
  id: 'item-bread',
  name: 'Bread',
  type: 'Food',
  buy: 200,
  sell: 20,
  usedInRecipes: [],
} satisfies Item;

const catalog: ItemsCatalogData = {
  totalCount: 1,
  results: [mockItem],
  filterOptions: {
    type: [{ label: 'Food', value: 'food' }],
    category: [],
    region: [],
    rarity: [],
  },
};

describe('ItemsPageClient', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          type: 'item',
          item: mockItem,
          items: { [mockItem.id]: mockItem },
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the draft search when the user switches to table view before debounce', async () => {
    const user = userEvent.setup();

    render(
      <ItemsPageClient
        catalog={catalog}
        search={{} satisfies ItemsSearchParams}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bread');
    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('data-state', 'on');
    expect(replace).toHaveBeenCalledWith('/items?q=bread&view=table', { scroll: false });
  });

  it('preserves the draft search when opening an item detail before debounce', async () => {
    const user = userEvent.setup();

    render(
      <ItemsPageClient
        catalog={catalog}
        search={{} satisfies ItemsSearchParams}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: /search/i }), 'bread');
    await user.click(screen.getByText('Bread').closest('button') as HTMLButtonElement);

    expect(replace).toHaveBeenCalledWith('/items?q=bread&detailType=item&detailId=item-bread', { scroll: false });
  });
});
