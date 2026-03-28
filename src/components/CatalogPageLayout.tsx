import React, { useMemo } from 'react';
import { Filter, LayoutGrid, Search, Table2, X } from 'lucide-react';

import { CatalogFilterCombobox } from './CatalogFilterCombobox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { useIncrementalReveal } from '@/hooks/useIncrementalReveal';
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
  control?: 'combobox' | 'boolean-toggle';
  selectionMode?: 'single' | 'multiple';
  options: Array<{ label: string; value: string }>;
  predicate: (item: T, value: string) => boolean;
};

export type CatalogFilterValue = string | string[] | undefined;

export type CatalogTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (item: T) => React.ReactNode;
};

export interface CatalogPageLayoutProps<T> {
  data: T[];
  totalCount?: number;
  title: string;
  searchKey?: keyof T | ((item: T) => string);
  sortOptions?: SortOption<T>[];
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  filters?: CatalogFilterDefinition<T>[];
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValueChange?: (key: string, value: CatalogFilterValue) => void;
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
  disableClientFiltering?: boolean;
}

function normalizeFilterValue(value: CatalogFilterValue) {
  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

function areFilterValuesEqual(left: CatalogFilterValue, right: CatalogFilterValue) {
  if (Array.isArray(left) || Array.isArray(right)) {
    const leftValues = Array.isArray(left) ? left : left ? [left] : [];
    const rightValues = Array.isArray(right) ? right : right ? [right] : [];

    if (leftValues.length !== rightValues.length) {
      return false;
    }

    return leftValues.every((value, index) => value === rightValues[index]);
  }

  return left === right;
}

function getFilterValueList(value: CatalogFilterValue) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function CatalogSkeletonCard() {
  return (
    <div className="h-44 rounded-2xl border bg-card p-4">
      <div className="h-full animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

export function CatalogPageLayout<T>({
  data,
  totalCount,
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
  disableClientFiltering = false,
}: CatalogPageLayoutProps<T>) {
  const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false);
  const [draftFilterValues, setDraftFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  const orderedFilters = useMemo(() => {
    return [...(filters ?? [])].sort((left, right) => {
      const leftBoolean = left.control === 'boolean-toggle' ? 0 : 1;
      const rightBoolean = right.control === 'boolean-toggle' ? 0 : 1;

      if (leftBoolean !== rightBoolean) {
        return leftBoolean - rightBoolean;
      }

      if ((left.placement === 'advanced') === (right.placement === 'advanced')) {
        return 0;
      }

      return left.placement === 'primary' ? -1 : 1;
    });
  }, [filters]);

  React.useEffect(() => {
    if (!filtersSheetOpen) {
      return;
    }

    setDraftFilterValues(
      Object.fromEntries(
        orderedFilters.map((definition) => [definition.key, normalizeFilterValue(filterValues?.[definition.key])]),
      ),
    );
  }, [filterValues, filtersSheetOpen, orderedFilters]);

  const filteredAndSortedData = useMemo(() => {
    if (disableClientFiltering) {
      return data;
    }

    let result = [...data];

    if (searchTerm && searchKey) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const value = typeof searchKey === 'function' ? searchKey(item) : String(item[searchKey]);
        return String(value).toLowerCase().includes(lower);
      });
    }

    for (const definition of orderedFilters) {
      const activeValue = filterValues?.[definition.key];
      const activeValues = getFilterValueList(activeValue);

      if (activeValues.length === 0) {
        continue;
      }

      result = result.filter((item) => activeValues.some((value) => definition.predicate(item, value)));
    }

    if (sortValue && sortOptions) {
      const activeSort = sortOptions.find((option) => option.value === sortValue);
      if (activeSort) {
        result.sort(activeSort.sortFn);
      }
    }

    return result;
  }, [data, disableClientFiltering, filterValues, orderedFilters, searchKey, searchTerm, sortOptions, sortValue]);

  const quickToggleFilters = useMemo(
    () => orderedFilters.filter((definition) => definition.control === 'boolean-toggle'),
    [orderedFilters],
  );
  const detailedFilters = useMemo(
    () => orderedFilters.filter((definition) => definition.control !== 'boolean-toggle'),
    [orderedFilters],
  );

  const resolvedTotalCount = totalCount ?? data.length;
  const appliedFilterChips = useMemo(() => {
    return orderedFilters.flatMap((definition) => {
      const values = getFilterValueList(filterValues?.[definition.key]);

      return values.map((value) => ({
        key: `${definition.key}:${value}`,
        filterKey: definition.key,
        value,
        label: definition.options.find((option) => option.value === value)?.label ?? value,
        filterLabel: definition.label,
      }));
    });
  }, [filterValues, orderedFilters]);

  const { hasMore, sentinelRef, visibleCount } = useIncrementalReveal<HTMLElement>({
    itemCount: filteredAndSortedData.length,
    batchSize: viewMode === 'table' ? 40 : 24,
    resetKeys: [data, filterValues, filteredAndSortedData.length, searchTerm, sortValue, viewMode],
    rootRef: viewportRef,
  });
  const visibleItems = filteredAndSortedData.slice(0, visibleCount);
  const quickToggleValues = quickToggleFilters.flatMap((definition) =>
    draftFilterValues[definition.key] ? [definition.key] : [],
  );

  const commitFilterValues = (nextValues: Record<string, CatalogFilterValue>) => {
    for (const definition of orderedFilters) {
      const nextValue = nextValues[definition.key];
      const currentValue = filterValues?.[definition.key];

      if (areFilterValuesEqual(currentValue, nextValue)) {
        continue;
      }

      onFilterValueChange?.(definition.key, nextValue);
    }
  };

  const handleApplyFilters = () => {
    commitFilterValues(draftFilterValues);
    setFiltersSheetOpen(false);
  };

  const handleClearFilters = () => {
    const clearedValues = Object.fromEntries(orderedFilters.map((definition) => [definition.key, undefined]));
    setDraftFilterValues(clearedValues);
    commitFilterValues(clearedValues);
  };

  const handleRemoveAppliedFilter = (filterKey: string, value: string) => {
    const currentValue = filterValues?.[filterKey];
    const currentValues = getFilterValueList(currentValue);
    const nextValues = currentValues.filter((entry) => entry !== value);

    onFilterValueChange?.(filterKey, Array.isArray(currentValue) ? (nextValues.length > 0 ? nextValues : undefined) : undefined);
  };

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
            {filteredAndSortedData.length === resolvedTotalCount
              ? `${resolvedTotalCount.toLocaleString()} total`
              : `${filteredAndSortedData.length.toLocaleString()} of ${resolvedTotalCount.toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {searchKey ? (
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search"
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

          {sortOptions && sortOptions.length > 0 ? (
            <Select value={sortValue} onValueChange={onSortValueChange}>
              <SelectTrigger size="lg" className="h-11 w-full rounded-xl bg-card lg:w-[220px]" aria-label="Sort">
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

          {orderedFilters.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl lg:min-w-[9.75rem]"
              onClick={() => setFiltersSheetOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          ) : null}

          <div className="inline-flex h-11 items-center rounded-xl border bg-card p-1">
            <Button
              type="button"
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="default"
              className="h-9 rounded-lg px-3"
              data-state={viewMode === 'cards' ? 'on' : 'off'}
              onClick={() => onViewModeChange?.('cards')}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="default"
              className="h-9 rounded-lg px-3"
              data-state={viewMode === 'table' ? 'on' : 'off'}
              onClick={() => onViewModeChange?.('table')}
            >
              <Table2 className="mr-2 h-4 w-4" />
              Table
            </Button>
          </div>
        </div>
        {extraControls ? <div className="mt-3">{extraControls}</div> : null}
      </div>

      {appliedFilterChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {appliedFilterChips.map((chip) => (
            <Button
              key={chip.key}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              aria-label={`Remove filter ${chip.filterLabel}: ${chip.label}`}
              onClick={() => handleRemoveAppliedFilter(chip.filterKey, chip.value)}
            >
              {chip.filterLabel}: {chip.label}
              <X className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      ) : null}

      <div className="min-w-0 rounded-3xl border bg-card/90 p-4 shadow-sm">
        <ScrollArea className="h-[calc(100vh-15rem)] min-h-[28rem] pr-2" viewportRef={viewportRef}>
          {viewMode === 'table' && tableColumns && tableColumns.length > 0 ? (
            <div className="px-3 py-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead key={column.key}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((item) => (
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
                  {hasMore ? (
                    <TableRow ref={sentinelRef as React.Ref<HTMLTableRowElement>} data-testid="catalog-infinite-scroll-sentinel" aria-hidden="true">
                      <TableCell colSpan={tableColumns.length} className="h-1 p-0" />
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="px-3 py-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {visibleItems.map((item) => (
                  <div key={getItemKey(item)} className={cn('min-w-0')}>
                    {renderCard(item, () => onOpenItem(item))}
                  </div>
                ))}
                {hasMore ? (
                  <div
                    ref={sentinelRef as React.Ref<HTMLDivElement>}
                    data-testid="catalog-infinite-scroll-sentinel"
                    className="col-span-full h-1 w-full"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          )}

          {filteredAndSortedData.length === 0 ? (
            <div className="px-3 py-3">
              <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
                {emptyState}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </div>

      <Sheet open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-xl">
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
            <SheetHeader className="px-6 py-4">
              <SheetTitle>Advanced Filters</SheetTitle>
              <SheetDescription>
                Refine the current list using more specific criteria.
              </SheetDescription>
            </SheetHeader>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-6 pb-28 pt-6">
              {quickToggleFilters.length > 0 ? (
                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Quick Toggles</h3>
                    <p className="text-xs text-muted-foreground">Fast binary filters for the current list.</p>
                  </div>
                  <ToggleGroup
                    type="multiple"
                    value={quickToggleValues}
                    onValueChange={(values) => {
                      const selectedKeys = new Set(values);
                      setDraftFilterValues((previous) => ({
                        ...previous,
                        ...Object.fromEntries(
                          quickToggleFilters.map((definition) => [
                            definition.key,
                            selectedKeys.has(definition.key) ? (definition.options[0]?.value ?? 'yes') : undefined,
                          ]),
                        ),
                      }));
                    }}
                  >
                    {quickToggleFilters.map((definition) => (
                      <ToggleGroupItem
                        key={definition.key}
                        value={definition.key}
                        aria-label={definition.options[0]?.label ?? definition.label}
                      >
                        {definition.options[0]?.label ?? definition.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </section>
              ) : null}

              {detailedFilters.length > 0 ? (
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Detailed Filters</h3>
                    <p className="text-xs text-muted-foreground">Refine the results with categories and multi-select options.</p>
                  </div>
                  <div className="space-y-5">
                    {detailedFilters.map((definition) => (
                      <CatalogFilterCombobox
                        key={definition.key}
                        label={definition.label}
                        options={definition.options}
                        multiple={definition.selectionMode === 'multiple'}
                        allLabel={definition.allLabel}
                        value={draftFilterValues[definition.key]}
                        onValueChange={(value) =>
                          setDraftFilterValues((previous) => ({
                            ...previous,
                            [definition.key]: normalizeFilterValue(value),
                          }))
                        }
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </ScrollArea>
          <div className="border-t bg-background/95 px-6 py-4 backdrop-blur">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button type="button" className="h-11 flex-1 rounded-xl" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
