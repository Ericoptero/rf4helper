import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { FishingList } from './FishingList';
import { createTestQueryClient } from '@/lib/test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import type { Fish } from '@/lib/schemas';

const mockFish: Fish[] = [
  { id: 'fish-masu', name: 'Masu Trout', sell: 200, shadow: 'small', locations: ['Water Ruins'] },
  { id: 'fish-squid', name: 'Squid', sell: 120, shadow: 'medium', locations: ['Selphia Lake'] }
];

const mockFishingData = {
  fishByName: mockFish
};

const server = setupServer(
  http.get('http://localhost:3000/data/fishing.json', () => HttpResponse.json(mockFishingData)),
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
    expect(screen.getByText(/loading fish data.../i)).toBeInTheDocument();
  });

  it('renders fish list and displays fish card data', async () => {
    render(<FishingList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading fish data.../i)).not.toBeInTheDocument();
    });

    // Check title
    expect(screen.getByText('Fishing Guide')).toBeInTheDocument();

    // Check individual items
    expect(screen.getByText('Masu Trout')).toBeInTheDocument();
    expect(screen.getByText('Squid')).toBeInTheDocument();
    
    // Test shadow badge (capitalize logic test via CSS)
    expect(screen.getByText(/small shadow/i)).toBeInTheDocument();
    expect(screen.getByText(/medium shadow/i)).toBeInTheDocument();
  });

  it('displays fish details in a drawer when clicked', async () => {
    const user = userEvent.setup();
    render(<FishingList />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText(/loading fish data.../i)).not.toBeInTheDocument();
    });

    // We can click the card title or block, let's grab the card container by name
    const masuCard = screen.getByText('Masu Trout').closest('.group\\/card');
    if (masuCard) {
      await user.click(masuCard);
    } else {
      // Fallback click on text
      await user.click(screen.getByText('Masu Trout'));
    }

    // Inside the drawer, the details should appear
    expect(await screen.findByText('Fishing Locations')).toBeInTheDocument();
    expect(screen.getByText('Water Ruins')).toBeInTheDocument();
  });

  it('can open the select dropdown for filters', async () => {
     // A simple test ensuring the shadow filters derived correctly
     const user = userEvent.setup();
     render(<FishingList />, { wrapper });
 
     await waitFor(() => {
       expect(screen.queryByText(/loading fish data.../i)).not.toBeInTheDocument();
     });

     // Select element is wrapped by radix, which has 'All' as default value text
     const filterCombobox = screen.getAllByRole('combobox')[0]; // The first combobox should be the Filter Select (the second is Sort)
     await user.click(filterCombobox);

     // Wait for dropdown to open (Radix Portal appends to body)
     const listbox = await screen.findByRole('listbox');
     expect(within(listbox).getByText('Small Shadow')).toBeInTheDocument();
     expect(within(listbox).getByText('Medium Shadow')).toBeInTheDocument();
  });
});
