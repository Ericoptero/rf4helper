import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CatalogPageLayout, type CatalogFilterDefinition, type CatalogTableColumn } from './CatalogPageLayout';
import { Card, CardContent } from './ui/card';

type Entry = {
  id: string;
  name: string;
  type: string;
  region: string;
  tags: string[];
  featured: boolean;
};

const entries: Entry[] = [
  { id: 'turnip', name: 'Turnip', type: 'Crop', region: 'Selphia Plains', tags: ['farm', 'spring'], featured: true },
  { id: 'broadsword', name: 'Broadsword', type: 'Weapon', region: 'Selphia', tags: ['forge'], featured: false },
  { id: 'pink-turnip', name: 'Pink Turnip', type: 'Crop', region: 'Sercerezo Hill', tags: ['rare'], featured: false },
];

const sortOptions = [
  {
    label: 'Name (A-Z)',
    value: 'name-asc',
    sortFn: (a: Entry, b: Entry) => a.name.localeCompare(b.name),
  },
];

const filters: CatalogFilterDefinition<Entry>[] = [
  {
    key: 'featured',
    label: 'Featured',
    control: 'boolean-toggle',
    options: [{ label: 'Featured only', value: 'yes' }],
    predicate: (entry, value) => value !== 'yes' || entry.featured,
  },
  {
    key: 'type',
    label: 'Type',
    options: [
      { label: 'Crop', value: 'crop' },
      { label: 'Weapon', value: 'weapon' },
    ],
    predicate: (entry, value) => entry.type.toLowerCase() === value,
  },
  {
    key: 'region',
    label: 'Region',
    placement: 'advanced',
    options: [{ label: 'Selphia Plains', value: 'selphia-plains' }],
    predicate: (entry, value) => entry.region.toLowerCase().replace(/\s+/g, '-') === value,
  },
  {
    key: 'tags',
    label: 'Tags',
    placement: 'advanced',
    selectionMode: 'multiple',
    options: [
      { label: 'Farm', value: 'farm' },
      { label: 'Spring', value: 'spring' },
      { label: 'Forge', value: 'forge' },
      { label: 'Rare', value: 'rare' },
    ],
    predicate: (entry, value) => entry.tags.includes(value),
  },
];

const tableColumns: CatalogTableColumn<Entry>[] = [
  { key: 'name', header: 'Name', cell: (entry) => entry.name },
  { key: 'type', header: 'Type', cell: (entry) => entry.type },
];

function ControlledCatalogHarness() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');
  const [sortValue, setSortValue] = React.useState('name-asc');
  const [filterValues, setFilterValues] = React.useState<Record<string, string | string[] | undefined>>({});

  return (
    <CatalogPageLayout<Entry>
      data={entries}
      title="Items"
      searchKey="name"
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      sortValue={sortValue}
      onSortValueChange={setSortValue}
      sortOptions={sortOptions}
      filters={filters}
      filterValues={filterValues}
      onFilterValueChange={(key, value) =>
        setFilterValues((previous) => ({ ...previous, [key]: value }))
      }
      tableColumns={tableColumns}
      getItemKey={(entry) => entry.id}
      renderCard={(entry, onOpen) => (
        <button type="button" onClick={onOpen}>
          <Card>
            <CardContent>{entry.name}</CardContent>
          </Card>
        </button>
      )}
      onOpenItem={vi.fn()}
    />
  );
}

describe('CatalogPageLayout', () => {
  it('switches between cards and table views using controlled state', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('data-state', 'on');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turnip' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('data-state', 'on');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Broadsword')).toBeInTheDocument();
  });

  it('keeps drawer changes as draft state until apply filters is clicked', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Advanced Filters')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /type/i }));
    await user.type(within(dialog).getByRole('combobox', { name: /type/i }), 'Crop');
    await user.click(await screen.findByRole('option', { name: 'Crop' }));

    await user.click(within(dialog).getByRole('combobox', { name: /region/i }));
    await user.type(within(dialog).getByRole('combobox', { name: /region/i }), 'Selphia Plains');
    await user.click(await screen.findByRole('option', { name: 'Selphia Plains' }));

    expect(screen.getByText('Broadsword')).toBeInTheDocument();
    expect(screen.getByText('Pink Turnip')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(screen.getByText('Turnip')).toBeInTheDocument();
    expect(screen.queryByText('Broadsword')).not.toBeInTheDocument();
    expect(screen.queryByText('Pink Turnip')).not.toBeInTheDocument();
  });

  it('renders controls in the order search, sort, more filters, then view toggle', () => {
    render(<ControlledCatalogHarness />);

    const searchInput = screen.getByRole('textbox', { name: /search/i });
    const sortControl = screen.getByRole('combobox', { name: /sort/i });
    const moreFiltersButton = screen.getByRole('button', { name: /more filters/i });
    const cardsButton = screen.getByRole('button', { name: 'Cards' });

    expect(searchInput.compareDocumentPosition(sortControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sortControl.compareDocumentPosition(moreFiltersButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(moreFiltersButton.compareDocumentPosition(cardsButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: /type/i })).not.toBeInTheDocument();
  });

  it('supports multi-select filters in the drawer using any-match semantics', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    const tagsCombobox = within(dialog).getByRole('combobox', { name: /tags/i });

    await user.click(tagsCombobox);
    await user.type(tagsCombobox, 'farm');
    await user.click(await screen.findByRole('option', { name: 'Farm' }));

    await user.click(tagsCombobox);
    await user.clear(tagsCombobox);
    await user.type(tagsCombobox, 'forge');
    await user.click(await screen.findByRole('option', { name: 'Forge' }));

    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(screen.getByText('Turnip')).toBeInTheDocument();
    expect(screen.getByText('Broadsword')).toBeInTheDocument();
    expect(screen.queryByText('Pink Turnip')).not.toBeInTheDocument();
  });

  it('renders boolean toggle filters before combobox filters in the drawer', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    const featuredToggle = within(dialog).getByRole('button', { name: /featured only/i });
    const typeCombobox = within(dialog).getByRole('combobox', { name: /type/i });

    expect(featuredToggle.compareDocumentPosition(typeCombobox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders applied drawer filters as removable chips below the controls', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /featured only/i }));
    await user.click(within(dialog).getByRole('combobox', { name: /tags/i }));
    await user.type(within(dialog).getByRole('combobox', { name: /tags/i }), 'farm');
    await user.click(await screen.findByRole('option', { name: 'Farm' }));
    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(screen.getByRole('button', { name: /remove filter featured: featured only/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove filter tags: farm/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove filter tags: farm/i }));

    expect(screen.queryByRole('button', { name: /remove filter tags: farm/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove filter featured: featured only/i })).toBeInTheDocument();
    expect(screen.getByText('Turnip')).toBeInTheDocument();
    expect(screen.queryByText('Broadsword')).not.toBeInTheDocument();
  });

  it('clears active and draft drawer filters from the footer action while keeping the drawer open', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /featured only/i }));
    await user.click(within(dialog).getByRole('button', { name: /apply filters/i }));

    expect(screen.queryByText('Broadsword')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /more filters/i }));
    const reopenedDialog = await screen.findByRole('dialog');
    await user.click(within(reopenedDialog).getByRole('button', { name: /clear filters/i }));

    expect(within(reopenedDialog).getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    expect(screen.getByText('Broadsword')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove filter featured: featured only/i })).not.toBeInTheDocument();
  });

  it('renders each card as the interactive surface instead of a layout wrapper button', () => {
    render(<ControlledCatalogHarness />);

    const turnipButton = screen.getByRole('button', { name: 'Turnip' });
    const cardWrapper = turnipButton.querySelector('[data-slot="card"]');

    expect(cardWrapper).not.toBeNull();
    expect(turnipButton.parentElement).not.toHaveAttribute('data-slot', 'card');
  });
});
