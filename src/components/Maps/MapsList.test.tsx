import { render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import type { MapRegionRecord } from '@/lib/mapFishingRelations';
import type { Chest, Fish } from '@/lib/schemas';
import { MapsList } from './MapsList';

const mockChests: Chest[] = [
  {
    id: 'chest-1',
    region: 'Selphia Plains',
    roomCode: 'A1',
    itemName: 'Potion',
    notes: 'Behind the tree',
  },
  {
    id: 'chest-2',
    region: 'Obsidian Mansion',
    roomCode: 'B2',
    recipe: 'Broadsword Recipe',
  },
];

const mockFish: Fish[] = [
  {
    id: 'fish-squid',
    name: 'Squid',
    locations: [
      {
        region: 'Selphia Plains',
        spot: 'Bridge',
        seasons: ['Spring'],
      },
    ],
  },
];

const mockRegions: MapRegionRecord[] = [
  {
    id: 'selphia-plains',
    name: 'Selphia Plains',
    chests: [mockChests[0]!],
    fishingLocations: [
      {
        fishId: 'fish-squid',
        fishName: 'Squid',
        spot: 'Bridge',
        sourceRegion: 'Selphia Plains',
      },
    ],
  },
  {
    id: 'obsidian-mansion',
    name: 'Obsidian Mansion',
    chests: [mockChests[1]!],
    fishingLocations: [],
  },
];

const server = setupServer(
  http.get('http://localhost:3000/data/chests.json', () => HttpResponse.json(mockChests)),
  http.get('http://localhost:3000/data/fishing.json', () => HttpResponse.json(mockFish)),
  http.get('http://localhost:3000/api/details/map/:mapId', ({ params }) => {
    const mapId = params.mapId as string;
    const region = mockRegions.find((entry) => entry.id === mapId);

    if (!region) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      type: 'map',
      region,
      items: {},
    });
  }),
);

describe('MapsList', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('renders immediately from server-provided regions without showing a loading fallback', () => {
    render(<MapsList regions={mockRegions} />);

    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.getByText('World Maps & Chests')).toBeInTheDocument();
    expect(screen.getByText('Selphia Plains')).toBeInTheDocument();
  });

  it('renders regions from server-provided data', async () => {
    render(<MapsList regions={mockRegions} />);

    expect(await screen.findByText('World Maps & Chests')).toBeInTheDocument();
    expect(screen.getByText('Selphia Plains')).toBeInTheDocument();
    expect(screen.getByText('Obsidian Mansion')).toBeInTheDocument();
  });

  it('renders the data table columns and header sorting helper in table view', async () => {
    const user = userEvent.setup();

    render(<MapsList regions={mockRegions} />);

    await user.click(screen.getByRole('button', { name: 'Table' }));

    const table = screen.getByRole('table');
    expect(within(table).getByText('Selphia Plains')).toBeInTheDocument();
    expect(within(table).getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText(/sorted by region \(ascending\)/i)).toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: /^Rooms$/i }));

    expect(screen.getByText(/sorted by rooms \(descending\)/i)).toBeInTheDocument();
  });


});
