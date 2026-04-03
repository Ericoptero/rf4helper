import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { FishingList } from './FishingList';
import userEvent from '@testing-library/user-event';
import type { Fish } from '@/lib/schemas';
import { server } from '@/setupTests';

const mockFish: Fish[] = [
  {
    id: 'fish-masu',
    name: 'Masu Trout',
    image: 'fish/masu-trout.png',
    buy: 320,
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
    buy: 120,
    sell: 120,
    shadow: 'medium',
    locations: [],
  }
];

describe('FishingList Component', () => {
  beforeEach(() => {
    server.use(http.get('http://localhost:3000/data/fishing.json', () => HttpResponse.json(mockFish)));
  });

  it('renders fish list and displays fish card data', async () => {
    render(<FishingList fish={mockFish} />);

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
    render(<FishingList fish={mockFish} />);

    await screen.findByText('Masu Trout');

    // We can click the card title or block, let's grab the card container by name
    await user.click(screen.getByText('Masu Trout'));
    const dialog = await screen.findByRole('dialog', { name: 'Masu Trout' });

    // Inside the drawer, the details should appear
    expect(within(dialog).getByText('Selphia')).toBeInTheDocument();
    expect(within(dialog).getByText('Castle Gate')).toBeInTheDocument();
    expect(within(dialog).getByText('Seasons: Spring')).toBeInTheDocument();
    expect(within(dialog).getByText('Map: A1')).toBeInTheDocument();
    expect(within(dialog).getByText('Other: Legendary Scale')).toBeInTheDocument();
  });

  it('falls back gracefully when a fish has no image or locations', async () => {
    const user = userEvent.setup();
    render(<FishingList fish={mockFish} />);

    await screen.findByText('Squid');

    await user.click(screen.getByText('Squid'));
    const dialog = await screen.findByRole('dialog', { name: 'Squid' });

    expect(within(dialog).getByText('No known locations for this fish.')).toBeInTheDocument();
    expect(within(dialog).queryByAltText('Squid')).not.toBeInTheDocument();
  });

  it('can open the select dropdown for filters', async () => {
     // A simple test ensuring the shadow filters derived correctly
     const user = userEvent.setup();
     render(<FishingList fish={mockFish} />);
 
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

  it('renders the data table columns and header sorting helper in table view', async () => {
    const user = userEvent.setup();

    render(<FishingList fish={mockFish} />);

    await user.click(screen.getByRole('button', { name: 'Table' }));

    const table = screen.getByRole('table');
    expect(within(table).getByText('Masu Trout')).toBeInTheDocument();
    expect(within(table).getByText('320')).toBeInTheDocument();
    expect(within(table).getByText('200')).toBeInTheDocument();
    expect(within(table).getAllByText('2').length).toBeGreaterThan(0);
    expect(within(table).getByText(/Spring, Fall, Winter/i)).toBeInTheDocument();
    expect(screen.getByText(/sorted by name \(ascending\)/i)).toBeInTheDocument();

    await user.click(within(table).getByRole('button', { name: /^Buy$/i }));

    expect(screen.getByText(/sorted by buy \(descending\)/i)).toBeInTheDocument();
  });


});
