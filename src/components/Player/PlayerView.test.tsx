import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { PlayerView } from './PlayerView';
import userEvent from '@testing-library/user-event';
import type { SkillsData } from '@/lib/schemas';

const mockOrders = [
  { id: 'order-1', orderName: 'Test Order', category: 'Licenses', requirement: '100 Wood', rpCost: 50 },
];

const mockRequests = {
  repeatableRequests: [
    { id: 'req-rep-1', request: 'Deliver Turnips', howToComplete: 'Ship 1 Turnip', reward: 'Turnip Seeds' }
  ],
  itemrecipeRewards: [
    { id: 'req-item-1', request: 'Defeat Orc', condition: 'Kill 1 Orc', reward: 'Broadsword' }
  ],
  generalStoreSeedRewards: [],
  carnationStoreSeedRewards: []
};

const mockRuneAbilities = {
  'short swords': [
    { id: 'rune-1', name: 'Power Wave', weaponType: 'Short Sword', description: 'Fire a shockwave', sell: 10, buy: 100, image: 'rune-abilities/rune-power-wave.png' }
  ]
};

const mockSkills: SkillsData = {
  weapons: [
    {
      id: 'skill-short-sword',
      name: 'Short Sword',
      category: 'weapons',
      description: 'Short Swords are balanced for both attack and defense.',
      bonuses: [
        {
          kind: 'combat',
          description: 'Higher skill levels increase damage and cut RP used.',
          stats: []
        },
        {
          kind: 'stat',
          description: 'Also raises maximum RP and STR.',
          stats: ['maxRp', 'str']
        }
      ],
      unlocks: [
        { level: 5, effect: 'Dash Attack' },
        { level: 10, effect: 'Charge Attack' }
      ],
      sourceOrder: 1
    }
  ],
  magic: [
    {
      id: 'skill-fire',
      name: 'Fire',
      category: 'magic',
      description: 'Skill needed to use fire.',
      bonuses: [
        {
          kind: 'stat',
          description: 'Also raises INT, FIRE M.ATK and M.DEF.',
          stats: ['int', 'matk', 'mdef']
        }
      ],
      unlocks: [],
      sourceOrder: 1
    }
  ],
  farming: [],
  recipe: [],
  life: [],
  defense: [],
  other: [
    {
      id: 'skill-bartering',
      name: 'Bartering',
      category: 'other',
      description: 'Skill that increases as you sell items.',
      bonuses: [
        {
          kind: 'economy',
          description: 'Higher skill levels raise INT and may teach you sales techniques to use in your store.',
          stats: ['int']
        }
      ],
      unlocks: [],
      sourceOrder: 1
    }
  ]
};

const mockTrophies = {
  general: [
    { id: 'trophy-1', name: 'First Steps', description: 'Started the game', requirements: 'None' }
  ]
};

const server = setupServer(
  http.get('http://localhost:3000/data/orders.json', () => HttpResponse.json(mockOrders)),
  http.get('http://localhost:3000/data/requests.json', () => HttpResponse.json(mockRequests)),
  http.get('http://localhost:3000/data/runeAbilities.json', () => HttpResponse.json(mockRuneAbilities)),
  http.get('http://localhost:3000/data/skills.json', () => HttpResponse.json(mockSkills)),
  http.get('http://localhost:3000/data/trophies.json', () => HttpResponse.json(mockTrophies)),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('PlayerView Component', () => {
  it('renders immediately from server-provided props without showing the loading state', () => {
    render(
      <PlayerView
        orders={mockOrders}
        requestsData={mockRequests}
        runeAbilitiesData={mockRuneAbilities}
        skills={mockSkills}
        trophiesData={mockTrophies}
      />,
    );

    expect(screen.getByText('Player Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Order')).toBeInTheDocument();
  });

  it('renders orders tab default and data successfully', async () => {
    render(
      <PlayerView
        orders={mockOrders}
        requestsData={mockRequests}
        runeAbilitiesData={mockRuneAbilities}
        skills={mockSkills}
        trophiesData={mockTrophies}
      />,
    );

    // Check header
    expect(screen.getByText('Player Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Progress Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Rune Libraries')).toBeInTheDocument();

    // Check Default Tab (Orders)
    expect(screen.getByText('Test Order')).toBeInTheDocument();
    expect(screen.getByText('Cost: 50 RP')).toBeInTheDocument();
  });

  it('switches tabs and renders corresponding data', async () => {
    const user = userEvent.setup();
    render(
      <PlayerView
        orders={mockOrders}
        requestsData={mockRequests}
        runeAbilitiesData={mockRuneAbilities}
        skills={mockSkills}
        trophiesData={mockTrophies}
      />,
    );

    // Test Requests Tab
    await user.click(screen.getByRole('tab', { name: /requests/i }));
    expect(screen.getByText('Deliver Turnips')).toBeInTheDocument();
    expect(screen.getByText('Defeat Orc')).toBeInTheDocument();

    // Test Rune Abilities Tab
    await user.click(screen.getByRole('tab', { name: /rune abilities/i }));
    expect(screen.getByText('Power Wave')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Power Wave' })).toBeInTheDocument();

    // Test Skills Tab
    await user.click(screen.getByRole('tab', { name: /skills/i }));
    expect(screen.getByText('Weapon Skills')).toBeInTheDocument();
    expect(screen.getByText('Magic Skills')).toBeInTheDocument();
    expect(screen.getByText('Other Skills')).toBeInTheDocument();
    expect(screen.getByText('Short Sword')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Bartering')).toBeInTheDocument();
    expect(screen.getByText('Dash Attack')).toBeInTheDocument();
    expect(screen.getByText('Also raises maximum RP and STR.')).toBeInTheDocument();

    // Test Trophies Tab
    await user.click(screen.getByRole('tab', { name: /trophies/i }));
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });
});
