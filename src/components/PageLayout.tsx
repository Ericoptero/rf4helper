import React, { useState, useMemo, useCallback } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Search, X } from 'lucide-react';

export interface PageLayoutProps<T> {
  data: T[];
  title: string;
  searchKey?: keyof T | ((item: T) => string);
  sortOptions?: { label: string; value: string; sortFn: (a: T, b: T) => number }[];
  filterOptions?: { label: string; value: string; filterFn: (item: T) => boolean }[];
  renderCard: (item: T, onClick: () => void) => React.ReactNode;
  renderDetails: (item: T) => React.ReactNode;
  detailsTitle?: (item: T) => string;
  isLoading?: boolean;
}

// Skeleton card for loading states
function SkeletonCard() {
  return (
    <div className="h-40 rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-6 w-12 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export function PageLayout<T>({
  data,
  title,
  searchKey,
  sortOptions,
  filterOptions,
  renderCard,
  renderDetails,
  detailsTitle,
  isLoading = false,
}: PageLayoutProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>(sortOptions?.[0]?.value || '');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    
    // Global text search
    if (searchTerm && searchKey) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => {
        const val = typeof searchKey === 'function' ? searchKey(item) : String(item[searchKey]);
        return String(val).toLowerCase().includes(lower);
      });
    }

    // Custom Filters
    if (filterBy !== 'all' && filterOptions) {
      const activeFilter = filterOptions.find(f => f.value === filterBy);
      if (activeFilter) {
        result = result.filter(activeFilter.filterFn);
      }
    }

    // Sorting
    if (sortBy && sortOptions) {
      const activeSort = sortOptions.find(s => s.value === sortBy);
      if (activeSort) {
        result.sort(activeSort.sortFn);
      }
    }

    return result;
  }, [data, searchTerm, searchKey, filterBy, filterOptions, sortBy, sortOptions]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded skeleton-shimmer" />
        </div>
        <div className="flex gap-4 items-center">
          <div className="h-10 w-64 rounded-lg skeleton-shimmer" />
        </div>
        <div className="flex-1 w-full rounded-xl border p-6 bg-muted/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-4 p-4">
      {/* Header with title and result count */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="text-sm text-muted-foreground font-medium tabular-nums">
          {filteredAndSortedData.length === data.length
            ? `${data.length.toLocaleString()} total`
            : `${filteredAndSortedData.length.toLocaleString()} of ${data.length.toLocaleString()}`}
        </span>
      </div>
      
      {/* Search & Filters bar */}
      <div className="flex gap-3 items-center flex-wrap">
        {searchKey && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {filterOptions && filterOptions.length > 0 && (
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {filterOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {sortOptions && sortOptions.length > 0 && (
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid content area */}
      <ScrollArea className="flex-1 w-full rounded-xl border p-6 bg-muted/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 p-1">
          {filteredAndSortedData.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer transition-transform hover:scale-[1.02] animate-card-in"
              style={{ animationDelay: `${Math.min(idx, 20) * 30}ms` }}
            >
              {renderCard(item, () => setSelectedItem(item))}
            </div>
          ))}
          {filteredAndSortedData.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] md:w-[600px] overflow-y-auto backdrop-blur-sm">
          {selectedItem && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{detailsTitle ? detailsTitle(selectedItem) : 'Details'}</SheetTitle>
                <SheetDescription className="sr-only">
                  Detailed information for the selected entry.
                </SheetDescription>
              </SheetHeader>
              <div className="pb-8">
                {renderDetails(selectedItem)}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
