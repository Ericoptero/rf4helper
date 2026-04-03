import React, { useMemo } from 'react';
import { Filter, LayoutGrid, LoaderCircle, Search, Table2, X } from 'lucide-react';

import { CatalogFilterSheet } from './CatalogFilterSheet';
import { CatalogResultsGrid } from './CatalogResultsGrid';
import { CatalogResultsTable } from './CatalogResultsTable';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useIncrementalReveal } from '@/hooks/useIncrementalReveal';
import { cn } from '@/lib/utils';

type CatalogSortOptionBase = {
  label: string;
  value: string;
};

export type ServerSortOption = CatalogSortOptionBase;

type CatalogFilterDefinitionBase = {
  key: string;
  label: string;
  placement?: 'primary' | 'advanced';
  allLabel?: string;
  control?: 'combobox' | 'boolean-toggle';
  selectionMode?: 'single' | 'multiple';
  options: Array<{ label: string; value: string }>;
};

export type ServerCatalogFilterDefinition = CatalogFilterDefinitionBase;

export type CatalogFilterValue = string | string[] | undefined;

export type CatalogTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  cell: (item: T) => React.ReactNode;
  tooltipContent?: (item: T) => React.ReactNode;
  sortAscValue?: string;
  sortDescValue?: string;
  defaultDirection?: 'asc' | 'desc';
};

export type CatalogPageLayoutProps<T> = {
  data: T[];
  totalCount?: number;
  title: string;
  sortValue?: string;
  defaultSortValue?: string;
  onSortValueChange?: (value: string) => void;
  filterValues?: Record<string, CatalogFilterValue>;
  onFilterValuesChange?: (values: Record<string, CatalogFilterValue>) => void;
  renderCard: (item: T, onOpen: () => void) => React.ReactNode;
  tableColumns?: CatalogTableColumn<T>[];
  getItemKey: (item: T) => string;
  onOpenItem: (item: T) => void;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  onCommitSearch?: () => void;
  onClearSearch?: () => void;
  onCancelPendingSearch?: () => void;
  extraControls?: React.ReactNode;
  viewMode?: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
  emptyState?: string;
  sortOptions?: ServerSortOption[];
  filters?: ServerCatalogFilterDefinition[];
  isRoutePending?: boolean;
  resultResetKeys?: readonly unknown[];
};

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

function CatalogSearchBar({
  searchTerm,
  onSearchTermChange,
  onCommitSearch,
  onClearSearch,
  isRoutePending,
}: {
  searchTerm: string;
  onSearchTermChange?: (value: string) => void;
  onCommitSearch?: () => void;
  onClearSearch?: () => void;
  isRoutePending?: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search"
        aria-busy={isRoutePending}
        placeholder="Search..."
        value={searchTerm}
        onChange={(event) => onSearchTermChange?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') {
            return;
          }

          event.preventDefault();
          onCommitSearch?.();
        }}
        className="h-11 rounded-xl border-border/70 bg-card pl-9 pr-16"
      />
      {isRoutePending ? (
        <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </span>
      ) : null}
      {searchTerm ? (
        <button
          type="button"
          onClick={() => {
            if (onClearSearch) {
              onClearSearch();
              return;
            }

            onSearchTermChange?.('');
            onCommitSearch?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function CatalogViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'cards' | 'table';
  onViewModeChange?: (value: 'cards' | 'table') => void;
}) {
  return (
    <div className="inline-flex h-11 items-center rounded-xl border bg-card p-1">
      <Button
        type="button"
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="default"
        className="h-9 rounded-lg px-3"
        aria-label="Cards"
        data-state={viewMode === 'cards' ? 'on' : 'off'}
        onClick={() => onViewModeChange?.('cards')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="default"
        className="h-9 rounded-lg px-3"
        aria-label="Table"
        data-state={viewMode === 'table' ? 'on' : 'off'}
        onClick={() => onViewModeChange?.('table')}
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CatalogAppliedFilters({
  chips,
  onRemove,
}: {
  chips: Array<{ key: string; filterKey: string; value: string; label: string; filterLabel: string }>;
  onRemove: (filterKey: string, value: string) => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Button
          key={chip.key}
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          aria-label={`Remove filter ${chip.filterLabel}: ${chip.label}`}
          onClick={() => onRemove(chip.filterKey, chip.value)}
        >
          {chip.filterLabel}: {chip.label}
          <X className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}

export function CatalogPageLayout<T>({
  data,
  totalCount,
  title,
  sortValue,
  defaultSortValue,
  onSortValueChange,
  filterValues,
  onFilterValuesChange,
  renderCard,
  tableColumns,
  getItemKey,
  onOpenItem,
  isLoading = false,
  searchTerm = '',
  onSearchTermChange,
  onCommitSearch,
  onClearSearch,
  onCancelPendingSearch,
  extraControls,
  viewMode = 'cards',
  onViewModeChange,
  emptyState = 'No results found.',
  sortOptions,
  filters,
  isRoutePending = false,
  resultResetKeys,
}: CatalogPageLayoutProps<T>) {
  const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false);
  const [draftFilterValues, setDraftFilterValues] = React.useState<Record<string, CatalogFilterValue>>({});
  const [resultsViewportElement, setResultsViewportElement] = React.useState<HTMLElement | null>(null);
  const resultsViewportRef = React.useCallback((node: HTMLElement | null) => {
    setResultsViewportElement(node);
  }, []);
  const hasSearchControl = Boolean(onSearchTermChange || searchTerm);

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
  const revealResetKeys = useMemo(
    () =>
      resultResetKeys ?? [
        data.length,
        searchTerm,
        sortValue,
        ...appliedFilterChips.map((chip) => chip.key),
      ],
    [appliedFilterChips, data.length, resultResetKeys, searchTerm, sortValue],
  );

  const { hasMore, sentinelRef, visibleCount } = useIncrementalReveal<HTMLElement>({
    itemCount: data.length,
    batchSize: viewMode === 'table' ? 40 : 24,
    resetKeys: revealResetKeys,
    rootElement: resultsViewportElement,
  });
  const visibleItems = data.slice(0, visibleCount);
  const quickToggleValues = quickToggleFilters.flatMap((definition) =>
    draftFilterValues[definition.key] ? [definition.key] : [],
  );
  const resolvedDefaultSortValue = defaultSortValue ?? sortOptions?.[0]?.value;
  const activeTableSort = useMemo(
    () => tableColumns?.find((column) => column.sortAscValue === sortValue || column.sortDescValue === sortValue),
    [sortValue, tableColumns],
  );
  const activeTableSortDirection = useMemo(() => {
    if (!activeTableSort || !sortValue) {
      return null;
    }

    if (activeTableSort.sortAscValue === sortValue) {
      return 'asc';
    }

    if (activeTableSort.sortDescValue === sortValue) {
      return 'desc';
    }

    return null;
  }, [activeTableSort, sortValue]);
  const toolbarSortValue = useMemo(() => {
    if (!sortOptions?.length) {
      return sortValue;
    }

    return sortOptions.some((option) => option.value === sortValue)
      ? sortValue
      : resolvedDefaultSortValue;
  }, [resolvedDefaultSortValue, sortOptions, sortValue]);
  const showTableSortHelper = viewMode === 'table'
    && Boolean(tableColumns?.some((column) => column.sortAscValue && column.sortDescValue));

  const normalizeFilterRecord = React.useCallback(
    (values: Record<string, CatalogFilterValue>) =>
      Object.fromEntries(
        orderedFilters.map((definition) => [definition.key, normalizeFilterValue(values[definition.key])]),
      ),
    [orderedFilters],
  );

  const commitFilterValues = (nextValues: Record<string, CatalogFilterValue>) => {
    const normalizedNextValues = normalizeFilterRecord(nextValues);
    const hasChanges = orderedFilters.some((definition) => {
      const currentValue = filterValues?.[definition.key];
      return !areFilterValuesEqual(currentValue, normalizedNextValues[definition.key]);
    });

    if (!hasChanges) {
      return;
    }

    onFilterValuesChange?.(normalizedNextValues);
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
    const nextFilterValues = {
      ...normalizeFilterRecord(filterValues ?? {}),
      [filterKey]: Array.isArray(currentValue) ? (nextValues.length > 0 ? nextValues : undefined) : undefined,
    };

    onFilterValuesChange?.(nextFilterValues);
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
            {data.length === resolvedTotalCount
              ? `${resolvedTotalCount.toLocaleString()} total`
              : `${data.length.toLocaleString()} of ${resolvedTotalCount.toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border bg-card/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch" aria-busy={isRoutePending}>
          {hasSearchControl ? (
            <CatalogSearchBar
              searchTerm={searchTerm}
              onSearchTermChange={onSearchTermChange}
              onCommitSearch={onCommitSearch}
              onClearSearch={onClearSearch}
              isRoutePending={isRoutePending}
            />
          ) : null}

          {sortOptions && sortOptions.length > 0 ? (
            <Select value={toolbarSortValue} onValueChange={onSortValueChange}>
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
              className="h-11 rounded-xl lg:min-w-39"
              onClick={() => {
                onCancelPendingSearch?.();
                setFiltersSheetOpen(true);
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          ) : null}

          <CatalogViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
        {extraControls ? <div className="mt-3">{extraControls}</div> : null}
        {showTableSortHelper ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {activeTableSort && activeTableSortDirection
              ? `Sorted by ${activeTableSort.header} (${activeTableSortDirection === 'asc' ? 'ascending' : 'descending'}). Click a column header to reverse or reset.`
              : 'Click a column header to sort.'}
          </p>
        ) : null}
      </div>

      <CatalogAppliedFilters chips={appliedFilterChips} onRemove={handleRemoveAppliedFilter} />

      <div
        className={cn(
          'min-w-0 rounded-3xl border bg-card/90 p-4 shadow-sm transition-colors',
          isRoutePending ? 'border-primary/30' : null,
        )}
        aria-busy={isRoutePending}
      >
        {viewMode === 'table' && tableColumns && tableColumns.length > 0 ? (
          <div
            ref={resultsViewportRef}
            data-testid="catalog-table-results-scroll"
            className="h-[calc(100vh-15rem)] min-h-112 overflow-auto"
          >
            <CatalogResultsTable
              visibleItems={visibleItems}
              tableColumns={tableColumns}
              getItemKey={getItemKey}
              onOpenItem={onOpenItem}
              sortValue={sortValue}
              onSortValueChange={onSortValueChange}
              defaultSortValue={resolvedDefaultSortValue}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              scrollContainer={resultsViewportElement}
            />

            {data.length === 0 ? (
              <div className="px-3 py-3">
                <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
                  {emptyState}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <ScrollArea
            data-testid="catalog-cards-scroll-area"
            className="h-[calc(100vh-15rem)] min-h-112 pr-2"
            viewportRef={resultsViewportRef}
          >
            <CatalogResultsGrid
              visibleItems={visibleItems}
              getItemKey={getItemKey}
              renderCard={renderCard}
              onOpenItem={onOpenItem}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
            />

            {data.length === 0 ? (
              <div className="px-3 py-3">
                <div className="rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
                  {emptyState}
                </div>
              </div>
            ) : null}
          </ScrollArea>
        )}
      </div>

      <CatalogFilterSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        quickToggleFilters={quickToggleFilters}
        quickToggleValues={quickToggleValues}
        detailedFilters={detailedFilters}
        draftFilterValues={draftFilterValues}
        setDraftFilterValues={setDraftFilterValues}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}
