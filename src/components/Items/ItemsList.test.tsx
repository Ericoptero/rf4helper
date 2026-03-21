import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Item } from '@/lib/schemas';
import { ItemsList } from './ItemsList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';

const mockItems: Record<string, Item> = {
  'item-bread': {
    id: 'item-bread',
    name: 'Bread',
    type: 'Food',
    buy: 200,
    sell: 20,
    description: 'Freshly baked bread.',
    category: 'foodAndMedicineStrings',
    region: 'Selphia General Store',
    shippable: true,
    rarityPoints: 4,
    rarityCategory: 'Food',
    monster: 'Buffamoo',
    usedInRecipes: ['item-toast'],
    craft: [
      {
        ingredients: ['item-flour'],
        stationType: 'Cooking',
        level: 5,
      },
    ],
    stats: {
      hp: 10,
      rp: 5,
    },
  },
  'item-ambrosias-thorns': {
    id: 'item-ambrosias-thorns',
    name: "Ambrosia's Thorns",
    type: 'Boss Drop',
    buy: 1000,
    sell: 250,
    usedInRecipes: [],
  },
  'item-apple': {
    id: 'item-apple',
    name: 'Apple',
    type: 'Crop',
    buy: 60,
    sell: 30,
    usedInRecipes: [],
  },
  'item-10-fold-steel': {
    id: 'item-10-fold-steel',
    name: '10-Fold Steel',
    type: 'Material',
    buy: 0,
    sell: 1,
    usedInRecipes: [],
  },
};

const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => {
    return HttpResponse.json(mockItems);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('ItemsList Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<ItemsList />, { wrapper });
    expect(screen.getByText(/loading items.../i)).toBeInTheDocument();
  });

  it('renders items after successful fetch', async () => {
    render(<ItemsList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading items.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('10-Fold Steel')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Boss Drop')).toBeInTheDocument();
    expect(screen.getByText(/Buy:\s*200/)).toBeInTheDocument();
  });

  it('renders alphabet controls and filters items by selected letter', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await screen.findByText('Bread');

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'A' }));

    expect(screen.getByText("Ambrosia's Thorns")).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
    expect(screen.queryByText('10-Fold Steel')).not.toBeInTheDocument();
  });

  it('combines search, alphabet filter, and type filter', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await screen.findByText('Bread');

    await user.type(screen.getByPlaceholderText(/search/i), 'a');
    await user.click(screen.getByRole('button', { name: 'A' }));

    const filterCombobox = screen.getAllByRole('combobox')[0];
    await user.click(filterCombobox);

    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Crop'));

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText("Ambrosia's Thorns")).not.toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
  });

  it('renders item image on the card when available', async () => {
    render(<ItemsList />, { wrapper });

    const breadImage = await screen.findByRole('img', { name: 'Bread image' });
    expect(breadImage).toHaveAttribute('src');
    expect(screen.queryByRole('img', { name: "Ambrosia's Thorns image" })).not.toBeInTheDocument();
  });

  it('shows the item image and all meaningful details in the sheet', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText('Bread'));

    expect(await screen.findByText('Freshly baked bread.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bread image' })).toBeInTheDocument();
    expect(screen.getAllByText('Food & Medicine Strings').length).toBeGreaterThan(0);
    expect(screen.getByText('Selphia General Store')).toBeInTheDocument();
    expect(screen.getByText('Buffamoo')).toBeInTheDocument();
    expect(screen.getByText('4 RP')).toBeInTheDocument();
    expect(screen.getByText('Crafted From')).toBeInTheDocument();
    expect(screen.getByText('Cooking')).toBeInTheDocument();
    expect(screen.getByText('Lv. 5')).toBeInTheDocument();
    expect(screen.getByText('Flour')).toBeInTheDocument();
    expect(screen.getByText('Effects & Stats')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('RP')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Used In Recipes')).toBeInTheDocument();
    expect(screen.getByText('Toast')).toBeInTheDocument();
    expect(screen.queryByText(/Tier/i)).not.toBeInTheDocument();
  });

  it('hides optional detail sections when item data is missing', async () => {
    const user = userEvent.setup();

    render(<ItemsList />, { wrapper });

    await user.click(await screen.findByText("Ambrosia's Thorns"));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).queryByText('Effects & Stats')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Crafted From')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Used In Recipes')).not.toBeInTheDocument();
    expect(within(sheet).queryByText('Description')).not.toBeInTheDocument();
  });
});
