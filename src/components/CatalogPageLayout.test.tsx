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
};

const entries: Entry[] = [
  { id: 'turnip', name: 'Turnip', type: 'Crop', region: 'Selphia Plains' },
  { id: 'broadsword', name: 'Broadsword', type: 'Weapon', region: 'Selphia' },
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
    key: 'type',
    label: 'Type',
    placement: 'primary',
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
];

const tableColumns: CatalogTableColumn<Entry>[] = [
  { key: 'name', header: 'Name', cell: (entry) => entry.name },
  { key: 'type', header: 'Type', cell: (entry) => entry.type },
];

function ControlledCatalogHarness() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');
  const [sortValue, setSortValue] = React.useState('name-asc');
  const [filterValues, setFilterValues] = React.useState<Record<string, string | undefined>>({});

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

  it('opens advanced filters in a separate sheet and applies them', async () => {
    const user = userEvent.setup();

    render(<ControlledCatalogHarness />);

    await user.click(screen.getByRole('button', { name: /more filters/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Advanced Filters')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /region/i }));
    await user.click(await screen.findByRole('option', { name: 'Selphia Plains' }));
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.getByText('Turnip')).toBeInTheDocument();
    expect(screen.queryByText('Broadsword')).not.toBeInTheDocument();
  });

  it('renders each card as the interactive surface instead of a layout wrapper button', () => {
    render(<ControlledCatalogHarness />);

    const turnipButton = screen.getByRole('button', { name: 'Turnip' });
    const cardWrapper = turnipButton.querySelector('[data-slot="card"]');

    expect(cardWrapper).not.toBeNull();
    expect(turnipButton.parentElement).not.toHaveAttribute('data-slot', 'card');
  });
});
