import React, { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';

export interface PageLayoutProps<T> {
  data: T[];
  title: string;
  searchKey?: keyof T | ((item: T) => string);
  sortOptions?: { label: string; value: string; sortFn: (a: T, b: T) => number }[];
  filterOptions?: { label: string; value: string; filterFn: (item: T) => boolean }[];
  renderCard: (item: T, onClick: () => void) => React.ReactNode;
  renderDetails: (item: T) => React.ReactNode;
  detailsTitle?: (item: T) => string;
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
}: PageLayoutProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>(sortOptions?.[0]?.value || '');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];
    
    // Global text search
    if (searchTerm && searchKey) {
      result = result.filter(item => {
        const val = typeof searchKey === 'function' ? searchKey(item) : String(item[searchKey]);
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]  gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      <div className="flex gap-4 items-center flex-wrap">
        {searchKey && (
          <Input 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
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

      <ScrollArea className="flex-1 w-full rounded-md border p-6 bg-muted/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-1">
          {filteredAndSortedData.map((item, idx) => (
            <div key={idx} onClick={() => setSelectedItem(item)} className="cursor-pointer transition-transform hover:scale-[1.02]">
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

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] md:w-[600px] overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl">{detailsTitle ? detailsTitle(selectedItem) : 'Details'}</SheetTitle>
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
