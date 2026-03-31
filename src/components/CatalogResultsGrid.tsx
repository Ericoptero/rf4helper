import React from 'react';

import { cn } from '@/lib/utils';

export function CatalogResultsGrid<T>({
  visibleItems,
  getItemKey,
  renderCard,
  onOpenItem,
  hasMore,
  sentinelRef,
}: {
  visibleItems: T[];
  getItemKey: (item: T) => string;
  renderCard: (item: T, onOpen: () => void) => React.ReactNode;
  onOpenItem: (item: T) => void;
  hasMore: boolean;
  sentinelRef: React.RefCallback<HTMLElement>;
}) {
  return (
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
  );
}
