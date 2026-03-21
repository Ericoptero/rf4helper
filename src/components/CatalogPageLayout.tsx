import React, { useCallback, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type SortOption<T> = {
  label: string;
  value: string;
  sortFn: (a: T, b: T) => number;
};

type FilterOption<T> = {
  label: string;
  value: string;
  filterFn: (item: T) => boolean;
};

export interface CatalogPageLayoutProps<T> {
  data: T[];
  title: string;
  searchKey?: keyof T | ((item: T) => string);
  sortOptions?: SortOption<T>[];
  filterOptions?: FilterOption<T>[];
  renderCard: (item: T, onClick: () => void) => React.ReactNode;
  renderDetails: (item: T) => React.ReactNode;
  detailsTitle?: (item: T) => string;
  isLoading?: boolean;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  extraControls?: React.ReactNode;
  detailEmptyState?: string;
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
  title,
  searchKey,
  sortOptions,
  filterOptions,
  renderCard,
  renderDetails,
  detailsTitle,
  isLoading = false,
  searchTerm,
  onSearchTermChange,
  extraControls,
}: CatalogPageLayoutProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>(sortOptions?.[0]?.value || '');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const resolvedSearchTerm = searchTerm ?? internalSearchTerm;
  const setResolvedSearchTerm = onSearchTermChange ?? setInternalSearchTerm;

  const handleClearSearch = useCallback(() => setResolvedSearchTerm(''), [setResolvedSearchTerm]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (resolvedSearchTerm && searchKey) {
      const lower = resolvedSearchTerm.toLowerCase();
      result = result.filter((item) => {
        const value =
          typeof searchKey === 'function' ? searchKey(item) : String(item[searchKey]);
        return String(value).toLowerCase().includes(lower);
      });
    }

    if (filterBy !== 'all' && filterOptions) {
      const activeFilter = filterOptions.find((option) => option.value === filterBy);
      if (activeFilter) {
        result = result.filter(activeFilter.filterFn);
      }
    }

    if (sortBy && sortOptions) {
      const activeSort = sortOptions.find((option) => option.value === sortBy);
      if (activeSort) {
        result.sort(activeSort.sortFn);
      }
    }

    return result;
  }, [data, filterBy, filterOptions, resolvedSearchTerm, searchKey, sortBy, sortOptions]);

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
        {searchKey && (
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={resolvedSearchTerm}
              onChange={(event) => setResolvedSearchTerm(event.target.value)}
              className="h-11 rounded-xl border-border/70 bg-card pl-9 pr-9"
            />
            {resolvedSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {extraControls}

        {filterOptions && filterOptions.length > 0 && (
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl bg-card">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {sortOptions && sortOptions.length > 0 && (
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl bg-card">
              <SelectValue placeholder="Sort..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="min-w-0 rounded-3xl border bg-card/90 p-4 shadow-sm">
        <ScrollArea className="h-[calc(100vh-15rem)] min-h-[28rem] pr-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredAndSortedData.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="text-left transition-transform hover:-translate-y-0.5"
              >
                {renderCard(item, () => setSelectedItem(item))}
              </button>
            ))}
            {filteredAndSortedData.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed px-6 py-20 text-center text-muted-foreground">
                No results found.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Sheet
        modal={false}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <SheetContent
          side="right"
          className="w-full p-0 sm:max-w-xl lg:max-w-2xl"
          overlayClassName="bg-black/40 lg:bg-black/10 lg:pointer-events-none"
        >
          {selectedItem && (
            <>
              <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <SheetHeader className="pr-14">
                  <SheetTitle>{detailsTitle ? detailsTitle(selectedItem) : 'Details'}</SheetTitle>
                  <SheetDescription className="sr-only">
                    View the selected entry details.
                  </SheetDescription>
                </SheetHeader>
              </div>
              <div
                data-testid="catalog-detail-scroll"
                className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-6"
              >
                {renderDetails(selectedItem)}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
