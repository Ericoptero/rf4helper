import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DetailDrawerProvider } from '@/components/details/DetailDrawerContext';

import { ItemDetailsContent } from './ItemDetailsContent';

describe('ItemDetailsContent', () => {
  it('renders drop and crop sections and opens linked item details from crafted-from slots', async () => {
    const user = userEvent.setup();
    const onDetailReferenceChange = vi.fn();

    render(
      <DetailDrawerProvider
        detailReference={{ type: 'item', id: 'item-turnip-seeds' }}
        onDetailReferenceChange={onDetailReferenceChange}
      >
        <ItemDetailsContent
          item={{
            id: 'item-turnip-seeds',
            name: 'Turnip Seeds',
            type: 'Seed',
            category: 'seed',
            buy: 10,
            sell: 2,
            craft: [
              {
                recipeId: 'item-turnip-seeds#1',
                stationType: 'Cooking',
                station: 'Knife',
                level: 1,
                ingredients: ['item-flour'],
              },
            ],
          }}
          items={{
            'item-flour': {
              id: 'item-flour',
              name: 'Flour',
              type: 'Ingredient',
            },
            'item-turnip': {
              id: 'item-turnip',
              name: 'Turnip',
              type: 'Crop',
            },
          }}
          dropSources={[
            {
              referenceId: 'Monster Flower',
              label: 'Monster Flower',
              dropRates: [15],
            },
          ]}
          cropRelations={[
            {
              crop: {
                id: 'crop-turnip',
                name: 'Turnip',
                itemId: 'item-turnip',
                growTime: 3,
                harvested: 2,
                regrows: false,
                seedBuy: 10,
                cropSell: 13,
                goodSeasons: ['Spring'],
                badSeasons: ['Winter'],
              },
              bucket: 'regularCrops',
              role: 'seed',
              counterpartItemId: 'item-turnip',
            },
          ]}
          monsterReferenceId="Monster Flower"
        />
      </DetailDrawerProvider>,
    );

    expect(screen.getByText('Drops')).toBeInTheDocument();
    expect(screen.getByText('Crop')).toBeInTheDocument();
    expect(screen.getByText('Crafted From')).toBeInTheDocument();
    expect(screen.getByText('Monster Flower')).toBeInTheDocument();
    expect(screen.getAllByText('Turnip').length).toBeGreaterThan(0);

    await user.click(within(screen.getByTestId('crafted-from-grid')).getByRole('button', { name: /flour/i }));

    expect(onDetailReferenceChange).toHaveBeenCalledWith({ type: 'item', id: 'item-flour' });
  });
});
