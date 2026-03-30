import { render, screen, within } from '@testing-library/react';
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
                  roomCode: 'A1',
                  itemName: 'Potion',
                  notes: 'Behind the tree',
                  recipe: false,
                },
              ],
              fishingLocations: [],
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
    expect(within(dialog).getByText('Potion')).toBeInTheDocument();
    expect(within(dialog).getByText(/behind the tree/i)).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
