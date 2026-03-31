import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Character } from '@/lib/schemas';
import { CharactersList } from './CharactersList';
import userEvent from '@testing-library/user-event';

const mockCharacters: Record<string, Character> = {
  'char-forte': {
    id: 'char-forte',
    name: 'Forte',
    category: 'Bachelorettes',
    icon: {
      sm: '/characters/icons/sm/forte.png',
      md: '/characters/icons/md/forte.png',
    },
    portrait: '/characters/portrait/forte.png',
    gender: 'Female',
    description: 'A steadfast knight of Selphia.',
    birthday: { season: 'Summer', day: 22 },
    battle: {
      description: 'A defensive frontline fighter.',
      stats: {
        level: 50,
        hp: 1200,
        atk: 300,
        def: 450,
        matk: 120,
        mdef: 280,
        str: 260,
        vit: 400,
        int: 100,
      },
      elementalResistances: {
        fire: 0,
        water: 10,
      },
      skills: ['Rush Attack', 'Shield Strike'],
      weapon: 'Steel Sword',
      weaponType: 'Long Sword',
    },
    gifts: {
      love: { items: [], categories: [] },
      like: { items: [], categories: [] },
      neutral: { items: [], categories: [] },
      dislike: { items: [], categories: [] },
      hate: { items: [], categories: [] },
    }
  }
};

const mockCharacterList = Object.values(mockCharacters);

const server = setupServer(
  http.get('http://localhost:3000/data/items.json', () => {
    return HttpResponse.json({});
  }),
  http.get('http://localhost:3000/data/characters.json', () => {
    return HttpResponse.json(mockCharacters);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('CharactersList Component', () => {
  it('renders characters immediately from server-provided props', async () => {
    render(<CharactersList characters={mockCharacterList} />);

    expect(screen.getByText('Forte')).toBeInTheDocument();
    expect(screen.getAllByText('Bachelorettes').length).toBeGreaterThan(0);
    const icon = screen.getByAltText('Forte icon');
    expect(icon.getAttribute('src')).toContain('/images/characters/icons/md/');
    expect(icon.getAttribute('src')).toContain('forte');
  });



  it('renders full character details from the enriched dataset', async () => {
    const user = userEvent.setup();

    render(<CharactersList characters={mockCharacterList} />);

    await screen.findByText('Forte');
    await user.click(screen.getByText('Forte'));

    expect(await screen.findByText('A steadfast knight of Selphia.')).toBeInTheDocument();
    expect(screen.getAllByText('Gender: Female').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Birthday: Summer 22').length).toBeGreaterThan(0);
    const portrait = screen.getByAltText('Forte portrait');
    expect(portrait.getAttribute('src')).toContain('forte');
    expect(portrait).toHaveClass('object-contain');
    expect(portrait).toHaveClass('max-h-[22rem]');
    expect(screen.getByText('Battle Info')).toBeInTheDocument();
    expect(screen.getByText('A defensive frontline fighter.')).toBeInTheDocument();
    expect(screen.getByText('Weapon Type')).toBeInTheDocument();
    expect(screen.getByText('Long Sword')).toBeInTheDocument();
    expect(screen.getByText('Rush Attack')).toBeInTheDocument();
    expect(screen.getByText('Shield Strike')).toBeInTheDocument();
    expect(screen.getByText(/fire 0%/i)).toBeInTheDocument();
  });

  it('renders graceful fallbacks when optional character fields are null', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('http://localhost:3000/data/characters.json', () => {
        return HttpResponse.json({
          'char-eliza': {
            id: 'char-eliza',
            name: 'Eliza',
            category: 'Other Characters',
            icon: { sm: null, md: null },
            portrait: null,
            gender: null,
            description: null,
            birthday: null,
            battle: null,
            gifts: {
              love: { items: [], categories: [] },
              like: { items: [], categories: [] },
              neutral: { items: [], categories: [] },
              dislike: { items: [], categories: [] },
              hate: { items: [], categories: [] },
            },
          },
        });
      })
    );

    render(<CharactersList characters={Object.values({
      'char-eliza': {
        id: 'char-eliza',
        name: 'Eliza',
        category: 'Other Characters',
        icon: { sm: null, md: null },
        portrait: null,
        gender: null,
        description: null,
        birthday: null,
        battle: null,
        gifts: {
          love: { items: [], categories: [] },
          like: { items: [], categories: [] },
          neutral: { items: [], categories: [] },
          dislike: { items: [], categories: [] },
          hate: { items: [], categories: [] },
        },
      },
    })} />);

    await screen.findByText('Eliza');
    await user.click(screen.getByText('Eliza'));

    expect((await screen.findAllByText('Birthday: Unknown')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender: Unknown').length).toBeGreaterThan(0);
    expect(screen.getByText('Description unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Battle information unavailable.')).toBeInTheDocument();
  });

  it('renders the drawer full width on mobile with a column hero layout', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('http://localhost:3000/data/characters.json', () => {
        return HttpResponse.json(mockCharacters);
      }),
    );

    render(<CharactersList characters={mockCharacterList} />);

    await screen.findByText('Forte');
    await user.click(screen.getByText('Forte'));

    const dialog = await screen.findByRole('dialog', { name: 'Forte' });
    const sheetContent = dialog;
    const hero = within(dialog).getByAltText('Forte portrait').closest('div')?.parentElement;
    const heroTitle = within(dialog).getAllByText('Forte', { selector: 'h2' })[1];

    expect(sheetContent).toHaveClass('w-full');
    expect(sheetContent).not.toHaveClass('data-[side=right]:w-3/4');
    expect(hero).toHaveClass('flex-col');
    expect(hero?.className).not.toContain('sm:flex-row');
    expect(heroTitle.closest('div')).toHaveClass('min-w-0');
  });

});
