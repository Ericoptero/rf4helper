import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { CalendarView } from './CalendarView';
import userEvent from '@testing-library/user-event';
import type { Character, Festival } from '@/lib/schemas';

const mockFestivals: Festival[] = [
  { id: 'fest-1', name: 'Spring Harvest Festival', season: 'Spring', day: 28, description: 'Spring crop judging.', orderable: true },
  { id: 'fest-2', name: 'Summer Buddy Battle', season: 'Summer', day: 24, description: 'Monster fighting.', orderable: false }
];

const mockCharacters: Record<string, Character> = {
  'char-amber': {
    id: 'char-amber',
    name: 'Amber',
    category: 'Bachelorettes',
    icon: {
      sm: '/characters/icons/sm/amber.png',
      md: '/characters/icons/md/amber.png',
    },
    portrait: '/characters/portrait/amber.png',
    gender: 'Female',
    description: 'A fairy-like girl who loves flowers.',
    birthday: { season: 'Spring', day: 26 },
    battle: null,
    gifts: {
      love: { items: [], categories: [] },
      like: { items: [], categories: [] },
      neutral: { items: [], categories: [] },
      dislike: { items: [], categories: [] },
      hate: { items: [], categories: [] },
    }
  }
};

const mockCrops = {
  regularCrops: [
    { id: 'crop-turnip', name: 'Turnip', growTime: 3, harvested: 1, seedBuy: 10, cropSell: 100, goodSeasons: ['Spring'], badSeasons: ['Winter'] }
  ]
};

const server = setupServer(
  http.get('http://localhost:3000/data/festivals.json', () => HttpResponse.json(mockFestivals)),
  http.get('http://localhost:3000/data/characters.json', () => HttpResponse.json(mockCharacters)),
  http.get('http://localhost:3000/data/crops.json', () => HttpResponse.json(mockCrops)),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('CalendarView Component', () => {
  it('renders immediately from server-provided props without falling back to client loading', () => {
    render(
      <CalendarView
        festivals={mockFestivals}
        cropsData={mockCrops}
        characters={mockCharacters}
        season="Spring"
      />,
    );

    expect(screen.queryByText(/loading calendar data.../i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Spring Harvest Festival').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Amber').length).toBeGreaterThan(0);
  });

  it('renders spring season default with its events', async () => {
    render(<CalendarView festivals={mockFestivals} cropsData={mockCrops} characters={mockCharacters} />);

    // Verify Spring Festival
    expect(screen.getAllByText('Spring Harvest Festival').length).toBeGreaterThan(0);
    
    // Verify birthday is taken from characters.json
    expect(screen.getAllByText('Amber').length).toBeGreaterThan(0);
    const icon = screen.getByAltText('Amber icon');
    expect(icon.getAttribute('src')).toContain('/images/characters/icons/sm/');
    expect(icon.getAttribute('src')).toContain('amber');

    expect(screen.getByText('Festivals This Season')).toBeInTheDocument();
    expect(screen.getByText('Birthdays')).toBeInTheDocument();
    expect(screen.getByText('Top Crops')).toBeInTheDocument();

    // Verify Best Crops for Spring
    expect(screen.getAllByText('Turnip').length).toBeGreaterThan(0);
  });

  it('displays drawer details when clicking an event', async () => {
    const user = userEvent.setup();
    render(<CalendarView festivals={mockFestivals} cropsData={mockCrops} characters={mockCharacters} />);

    const festivalButton = screen.getAllByText('Spring Harvest Festival')[0];
    await user.click(festivalButton);

    // Should open the drawer and display description
    expect(await screen.findByText('Spring crop judging.')).toBeInTheDocument();
  });

  it('shows birthday drawer details with the small icon', async () => {
    const user = userEvent.setup();

    render(<CalendarView festivals={mockFestivals} cropsData={mockCrops} characters={mockCharacters} />);

    await user.click(screen.getAllByText('Amber')[0]);

    expect(await screen.findByRole('dialog', { name: "Amber's Birthday" })).toBeInTheDocument();
    expect(screen.getAllByAltText('Amber icon')[0].getAttribute('src')).toContain('amber');
  });
});
