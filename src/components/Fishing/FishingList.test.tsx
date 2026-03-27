import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { FishingList } from './FishingList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import type { Fish } from '@/lib/schemas';

const mockFish: Fish[] = [
  {
    id: 'fish-masu',
    name: 'Masu Trout',
    image: 'fish/masu-trout.png',
    sell: 200,
    shadow: 'small',
    locations: [
      { region: 'Selphia', spot: 'Castle Gate', seasons: ['Spring'] },
      { region: 'Sercerezo Hill', spot: 'Spring Spring', seasons: ['Winter', 'Fall'], map: 'A1', other: ['Legendary Scale'] },
    ],
  },
  {
    id: 'fish-squid',
    name: 'Squid',
    sell: 120,
    shadow: 'medium',
    locations: [],
  }
];

const server = setupServer(
  http.get('http://localhost:3000/data/fishing.json', () => HttpResponse.json(mockFish)),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('FishingList Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it('renders loading state initially', () => {
    render(<FishingList />, { wrapper });
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders fish list and displays fish card data', async () => {
    render(<FishingList />, { wrapper });

    await screen.findByText('Fishing Guide');

    // Check title
    expect(screen.getByText('Fishing Guide')).toBeInTheDocument();

    // Check individual items
    expect(screen.getByText('Masu Trout')).toBeInTheDocument();
    expect(screen.getByText('Squid')).toBeInTheDocument();
    expect(screen.getByAltText('Masu Trout')).toBeInTheDocument();
    
    // Test shadow badge (capitalize logic test via CSS)
    expect(screen.getByText(/small shadow/i)).toBeInTheDocument();
    expect(screen.getByText(/medium shadow/i)).toBeInTheDocument();
  });

  it('displays fish details in a drawer when clicked', async () => {
    const user = userEvent.setup();
    render(<FishingList />, { wrapper });

    await screen.findByText('Masu Trout');

    // We can click the card title or block, let's grab the card container by name
    await user.click(screen.getByText('Masu Trout'));

    // Inside the drawer, the details should appear
    expect(await screen.findByText('Locations by Region')).toBeInTheDocument();
    expect(screen.getByText('Selphia')).toBeInTheDocument();
    expect(screen.getByText('Castle Gate')).toBeInTheDocument();
    expect(screen.getByText('Seasons: Spring')).toBeInTheDocument();
    expect(screen.getByText('Map: A1')).toBeInTheDocument();
    expect(screen.getByText('Other: Legendary Scale')).toBeInTheDocument();
  });

  it('falls back gracefully when a fish has no image or locations', async () => {
    const user = userEvent.setup();
    render(<FishingList />, { wrapper });

    await screen.findByText('Squid');

    await user.click(screen.getByText('Squid'));

    expect(await screen.findByText('Locations by Region')).toBeInTheDocument();
    expect(screen.getByText('No known locations for this fish.')).toBeInTheDocument();
    expect(screen.queryByAltText('Squid')).not.toBeInTheDocument();
  });

  it('can open the select dropdown for filters', async () => {
     // A simple test ensuring the shadow filters derived correctly
     const user = userEvent.setup();
     render(<FishingList />, { wrapper });
 
     await screen.findByText('Fishing Guide');
     await user.click(screen.getByRole('button', { name: /more filters/i }));

     const dialog = await screen.findByRole('dialog');
     const filterCombobox = within(dialog).getByRole('combobox', { name: 'Shadow' });
     await user.click(filterCombobox);
     await user.type(filterCombobox, 'shadow');

     const listbox = await screen.findByRole('listbox');
     expect(within(listbox).getByText(/small shadow/i)).toBeInTheDocument();
     expect(within(listbox).getByText(/medium shadow/i)).toBeInTheDocument();
  });

  it('supports controlled table mode sorting and server-driven filter combinations', async () => {
    const { rerender } = render(
      <FishingList
        fish={mockFish}
        viewMode="table"
        sortValue="locations-desc"
      />,
      { wrapper },
    );

    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]!).getAllByRole('cell')[0]).toHaveTextContent('Masu Trout');
    expect(within(rows[2]!).getAllByRole('cell')[0]).toHaveTextContent('Squid');
    expect(screen.getByText('Spring, Fall, Winter')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <FishingList
          fish={mockFish}
          viewMode="table"
          sortValue="sell-desc"
        />
      </QueryClientProvider>,
    );

    const sellSortedRows = await screen.findAllByRole('row');
    expect(within(sellSortedRows[1]!).getAllByRole('cell')[0]).toHaveTextContent('Masu Trout');
    expect(within(sellSortedRows[2]!).getAllByRole('cell')[0]).toHaveTextContent('Squid');

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <FishingList
          fish={mockFish}
          viewMode="table"
          searchTerm="Masu"
          filterValues={{
            shadow: 'small',
            region: 'Selphia',
            season: 'Spring',
            hasMap: 'yes',
          }}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Masu Trout')).toBeInTheDocument();
    expect(screen.queryByText('Squid')).not.toBeInTheDocument();
    expect(screen.getByText('Spring, Fall, Winter')).toBeInTheDocument();
  });

  it('applies filters through the internal uncontrolled state handlers', async () => {
    const user = userEvent.setup();
    render(<FishingList />, { wrapper });

    await screen.findByText('Fishing Guide');
    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /has map reference/i }));
    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(await screen.findByText('Masu Trout')).toBeInTheDocument();
    expect(screen.queryByText('Squid')).not.toBeInTheDocument();
  });
});
