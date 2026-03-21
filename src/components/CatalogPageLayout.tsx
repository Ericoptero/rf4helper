import React, { useMemo } from 'react';
import { Filter, Search, Table2, LayoutGrid, X } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

export type SortOption<T> = {
  label: string;
  value: string;
  sortFn: (a: T, b: T) => number;
};

export type CatalogFilterDefinition<T> = {
  key: string;
  label: string;
  placement?: 'primary' | 'advanced';
  allLabel?: string;
  options: Array<{ label: string; value: string }>;
  predicate: (item: T, value: string) => boolean;
};

export type CatalogTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (item: T) => React.ReactNode;
};

export interface CatalogPageLayoutProps<T> {
  data: T[];
  title: string;
  searchKey?: keyof T | ((item: T) => string);
  sortOptions?: SortOption<T>[];
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filters?: CatalogFilterDefinition<T>[];
  filterValues?: Record<string, string | undefined>;
  onFilterValueChange?: (key: string, value: string | undefined) => void;
  renderCard: (item: T, onOpen: () => void) => React.ReactNode;
  tableColumns?: CatalogTableColumn<T>[];
  getItemKey: (item: T) => string;
  onOpenItem: (item: T) => void;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  extraControls?: React.ReactNode;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  emptyState?: string;
}

function CatalogSkeletonCard() {
  return (
    <div className="h-44 rounded-2xl border bg-card p-4">
      <div className="h-full animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

function FilterSelect<T>({
  definition,
  value,
  onValueChange,
}: {
  definition: CatalogFilterDefinition<T>;
  value?: string;
  onValueChange: (value?: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={`filter-${definition.key}`}>
        {definition.label}
      </label>
      <Select value={value ?? 'all'} onValueChange={(nextValue) => onValueChange(nextValue === 'all' ? undefined : nextValue)}>
        <SelectTrigger
          id={`filter-${definition.key}`}
          aria-label={definition.label}
          className="h-11 w-full rounded-xl bg-card"
        >
          <SelectValue placeholder={definition.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{definition.allLabel ?? `All ${definition.label}`}</SelectItem>
          {definition.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CatalogPageLayout<T>({
  data,
  title,
  searchKey,
  sortOptions,
  sortValue,
  onSortValueChange,
  filters,
  filterValues,
  onFilterValueChange,
  renderCard,
  tableColumns,
  getItemKey,
  onOpenItem,
  isLoading = false,
  searchTerm = '',
  onSearchTermChange,
  extraControls,
  viewMode = 'cards',
  onViewModeChange,
  emptyState = 'No results found.',
}: CatalogPageLayoutProps<T>) {
  const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false);
  const primaryFilters = (filters ?? []).filter((filter) => filter.placement !== 'advanced');
  const advancedFilters = (filters ?? []).filter((filter) => filter.placement === 'advanced');

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm && searchKey) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const value = typeof searchKey === 'function' ? searchKey(item) : String(item[searchKey]);
        return String(value).toLowerCase().includes(lower);
      });
    }

    for (const definition of filters ?? []) {
      const activeValue = filterValues?.[definition.key];
      if (!activeValue) {
        continue;
      }

      result = result.filter((item) => definition.predicate(item, activeValue));
    }

    if (sortValue && sortOptions) {
      const activeSort = sortOptions.find((option) => option.value === sortValue);
      if (activeSort) {
        result.sort(activeSort.sortFn);
      }
    }

    return result;
  }, [data, filterValues, filters, searchKey, searchTerm, sortOptions, sortValue]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-72 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-10 w-40 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-10 w-40 animate-pulse rounded-xl bg-muted/60" />
        </div>
        <div className="rounded-3xl border bg-card/90 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CatalogSkeletonCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredAndSortedData.length === data.length
              ? `${data.length.toLocaleString()} total`
              : `${filteredAndSortedData.length.toLocaleString()} of ${data.length.toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {searchKey ? (
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange?.(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-card pl-9 pr-9"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchTermChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        {extraControls}

        {primaryFilters.map((definition) => (
          <div key={definition.key} className="w-full sm:w-[220px]">
            <FilterSelect
              definition={definition}
              value={filterValues?.[definition.key]}
              onValueChange={(value) => onFilterValueChange?.(definition.key, value)}
            />
          </div>
        ))}

        {sortOptions && sortOptions.length > 0 ? (
          <Select value={sortValue} onValueChange={onSortValueChange}>
            <SelectTrigger className="h-11 w-[220px] rounded-xl bg-card" aria-label="Sort">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {advancedFilters.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setFiltersSheetOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        ) : null}

        <div className="ml-auto inline-flex items-center rounded-xl border bg-card p-1">
          <Button
            type="button"
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            data-state={viewMode === 'cards' ? 'on' : 'off'}
            onClick={() => onViewModeChange?.('cards')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Cards
          </Button>
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            data-state={viewMode === 'table' ? 'on' : 'off'}
            onClick={() => onViewModeChange?.('table')}
          >
            <Table2 className="mr-2 h-4 w-4" />
            Table
          </Button>
        </div>
      </div>

      <div className="min-w-0 rounded-3xl border bg-card/90 p-4 shadow-sm">
        <ScrollArea className="h-[calc(100vh-15rem)] min-h-[28rem] pr-2">
          {viewMode === 'table' && tableColumns && tableColumns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((column) => (
                    <TableHead key={column.key}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((item) => (
                  <TableRow
                    key={getItemKey(item)}
                    className="cursor-pointer"
                    onClick={() => onOpenItem(item)}
                  >
                    {tableColumns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredAndSortedData.map((item) => (
                <div key={getItemKey(item)} className={cn('min-w-0')}>
                  {renderCard(item, () => onOpenItem(item))}
                </div>
              ))}
            </div>
          )}

          {filteredAndSortedData.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
              {emptyState}
            </div>
          ) : null}
        </ScrollArea>
      </div>

      <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Refine the current list using more specific criteria.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {advancedFilters.map((definition) => (
              <FilterSelect
                key={definition.key}
                definition={definition}
                value={filterValues?.[definition.key]}
                onValueChange={(value) => onFilterValueChange?.(definition.key, value)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
