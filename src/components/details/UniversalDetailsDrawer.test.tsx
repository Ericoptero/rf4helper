import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailDrawerProvider } from './DetailDrawerContext';
import { UniversalDetailsDrawer } from './UniversalDetailsDrawer';
import { resetDetailPayloadCache } from './useDetailPayload';

describe('UniversalDetailsDrawer', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            type: 'map',
            region: {
              id: 'selphia-plains',
              name: 'Selphia Plains',
              chests: [
                {
                  id: 'chest-1',
                  itemId: 'item-potion',
                  roomCode: 'A1',
                  itemName: 'Potion',
                  notes: 'Behind the tree',
                  recipe: false,
                },
              ],
              fishingLocations: [],
            },
            items: {
              'item-potion': {
                id: 'item-potion',
                name: 'Potion',
                type: 'Medicine',
              },
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );
  });

  afterEach(() => {
    resetDetailPayloadCache();
    vi.unstubAllGlobals();
  });

  it('renders map chest details without interactive checkboxes', async () => {
    render(
      <DetailDrawerProvider
        detailReference={{ type: 'map', id: 'selphia-plains' }}
        onDetailReferenceChange={() => undefined}
      >
        <UniversalDetailsDrawer />
      </DetailDrawerProvider>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Selphia Plains' });

    expect(within(dialog).getByText('Chests by Room')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /potion/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/behind the tree/i)).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('renders linked item tooltips above the drawer layer', async () => {
    const user = userEvent.setup();

    render(
      <DetailDrawerProvider
        detailReference={{ type: 'map', id: 'selphia-plains' }}
        onDetailReferenceChange={() => undefined}
      >
        <UniversalDetailsDrawer />
      </DetailDrawerProvider>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Selphia Plains' });

    await user.hover(within(dialog).getByRole('button', { name: /potion/i }));

    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Potion')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveClass('z-[90]');
  });
});
