import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import type { CatalogTableColumn } from './CatalogPageLayout';

export function CatalogResultsTable<T>({
  visibleItems,
  tableColumns,
  getItemKey,
  onOpenItem,
  hasMore,
  sentinelRef,
}: {
  visibleItems: T[];
  tableColumns: CatalogTableColumn<T>[];
  getItemKey: (item: T) => string;
  onOpenItem: (item: T) => void;
  hasMore: boolean;
  sentinelRef: React.RefCallback<HTMLElement>;
}) {
  return (
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
  );
}
