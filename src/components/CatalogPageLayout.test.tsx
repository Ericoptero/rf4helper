import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogPageLayout } from './CatalogPageLayout';

type Entry = {
  id: string;
  name: string;
  type: string;
};

const entries: Entry[] = [
  { id: 'turnip', name: 'Turnip', type: 'Crop' },
  { id: 'broadsword', name: 'Broadsword', type: 'Weapon' },
];

function mockMatchMedia(matches: boolean) {
  const original = window.matchMedia;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(min-width: 1280px)' ? matches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;

  return () => {
    window.matchMedia = original;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogPageLayout', () => {
  it('opens item details in a right-side drawer on wide screens', async () => {
    const restore = mockMatchMedia(true);
    const user = userEvent.setup();

    render(
      <CatalogPageLayout<Entry>
        data={entries}
        title="Items"
        searchKey="name"
        renderCard={(item) => <div>{item.name}</div>}
        renderDetails={(item) => <div>{item.name} details</div>}
        detailsTitle={(item) => item.name}
      />,
    );

    expect(screen.queryByText('Select an item')).not.toBeInTheDocument();

    await user.click(screen.getByText('Broadsword'));

    expect(screen.getByRole('heading', { name: 'Broadsword' })).toBeInTheDocument();
    expect(screen.getByText('Broadsword details')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-content"][data-side="right"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="catalog-detail-scroll"]')).toBeInTheDocument();

    restore();
  });

  it('keeps the drawer open and swaps content when another item is selected', async () => {
    const restore = mockMatchMedia(true);
    const user = userEvent.setup();

    render(
      <CatalogPageLayout<Entry>
        data={entries}
        title="Items"
        searchKey="name"
        renderCard={(item) => <div>{item.name}</div>}
        renderDetails={(item) => <div>{item.name} details</div>}
        detailsTitle={(item) => item.name}
      />,
    );

    await user.click(screen.getByText('Turnip'));
    expect(await screen.findByText('Turnip details')).toBeInTheDocument();

    await user.click(screen.getByText('Broadsword'));

    expect(screen.getByRole('heading', { name: 'Broadsword' })).toBeInTheDocument();
    expect(screen.getByText('Broadsword details')).toBeInTheDocument();
    expect(screen.queryByText('Turnip details')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="sheet-content"][data-side="right"]').length).toBe(1);

    restore();
  });

  it('opens the same right-side drawer on narrower screens', async () => {
    const restore = mockMatchMedia(false);
    const user = userEvent.setup();

    render(
      <CatalogPageLayout<Entry>
        data={entries}
        title="Items"
        searchKey="name"
        renderCard={(item) => <div>{item.name}</div>}
        renderDetails={(item) => <div>{item.name} details</div>}
        detailsTitle={(item) => item.name}
      />,
    );

    expect(screen.queryByText('Select an item')).not.toBeInTheDocument();

    await user.click(screen.getByText('Turnip'));

    expect(await screen.findByRole('heading', { name: 'Turnip' })).toBeInTheDocument();
    expect(screen.getByText('Turnip details')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sheet-content"][data-side="right"]')).toBeInTheDocument();

    restore();
  });
});
