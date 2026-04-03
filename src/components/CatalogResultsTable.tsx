import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import type { CatalogTableColumn } from './CatalogPageLayout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type DataTableColumnMeta = {
  className?: string;
  headerClassName?: string;
};

function getColumnSortDirection<T>(
  column: CatalogTableColumn<T>,
  sortValue: string | undefined,
) {
  if (!sortValue) {
    return null;
  }

  if (column.sortAscValue === sortValue) {
    return 'asc';
  }

  if (column.sortDescValue === sortValue) {
    return 'desc';
  }

  return null;
}

export function CatalogResultsTable<T>({
  visibleItems,
  tableColumns,
  getItemKey,
  onOpenItem,
  sortValue,
  onSortValueChange,
  defaultSortValue,
  hasMore,
  sentinelRef,
  scrollContainer,
}: {
  visibleItems: T[];
  tableColumns: CatalogTableColumn<T>[];
  getItemKey: (item: T) => string;
  onOpenItem: (item: T) => void;
  sortValue?: string;
  onSortValueChange?: (value: string) => void;
  defaultSortValue?: string;
  hasMore: boolean;
  sentinelRef: React.RefCallback<HTMLElement>;
  scrollContainer: HTMLElement | null;
}) {
  "use no memo";
  const [showStickyColumnShadow, setShowStickyColumnShadow] = React.useState(false);

  React.useEffect(() => {
    if (!scrollContainer) {
      return;
    }

    const syncShadowVisibility = () => {
      setShowStickyColumnShadow(scrollContainer.scrollLeft > 0);
    };

    syncShadowVisibility();
    scrollContainer.addEventListener('scroll', syncShadowVisibility, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', syncShadowVisibility);
    };
  }, [scrollContainer, tableColumns.length, visibleItems.length]);

  const handleHeaderSort = React.useCallback(
    (column: CatalogTableColumn<T>) => {
      if (!onSortValueChange || !defaultSortValue || !column.sortAscValue || !column.sortDescValue) {
        return;
      }

      const defaultDirection = column.defaultDirection ?? 'asc';
      const reverseDirection = defaultDirection === 'asc' ? 'desc' : 'asc';
      const activeDirection = getColumnSortDirection(column, sortValue);

      if (!activeDirection) {
        onSortValueChange(defaultDirection === 'asc' ? column.sortAscValue : column.sortDescValue);
        return;
      }

      if (activeDirection === defaultDirection) {
        onSortValueChange(reverseDirection === 'asc' ? column.sortAscValue : column.sortDescValue);
        return;
      }

      onSortValueChange(defaultSortValue);
    },
    [defaultSortValue, onSortValueChange, sortValue],
  );
  const columns = React.useMemo<ColumnDef<T>[]>(
    () =>
      tableColumns.map((column) => ({
        id: column.key,
        header: () => {
          const activeDirection = getColumnSortDirection(column, sortValue);
          const isSortable = Boolean(column.sortAscValue && column.sortDescValue && onSortValueChange);

          if (!isSortable) {
            return column.header;
          }

          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-auto min-h-0 gap-1 px-0 py-0 font-medium hover:bg-transparent',
                activeDirection ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={(event) => {
                event.stopPropagation();
                handleHeaderSort(column);
              }}
            >
              <span>{column.header}</span>
              {activeDirection === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : activeDirection === 'desc' ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const item = row.original;
          const content = column.cell(item);
          const tooltipContent = column.tooltipContent?.(item);

          if (!tooltipContent) {
            return content;
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-fit max-w-full">{content}</div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                collisionPadding={16}
                arrowClassName="fill-popover"
                className="border-0 bg-transparent p-0 shadow-none"
              >
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          );
        },
        meta: {
          className: column.className,
          headerClassName: column.headerClassName,
        } satisfies DataTableColumnMeta,
      })),
    [handleHeaderSort, onSortValueChange, sortValue, tableColumns],
  );
  const table = useReactTable({
    data: visibleItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getItemKey,
  });
  const stickyColumnShadowClass = cn(
    'lg:after:pointer-events-none lg:after:absolute lg:after:inset-y-0 lg:after:-right-3 lg:after:w-3 lg:after:bg-gradient-to-r lg:after:from-black/15 lg:after:to-transparent lg:after:transition-opacity dark:lg:after:from-black/45',
    showStickyColumnShadow ? 'lg:after:opacity-100' : 'lg:after:opacity-0',
  );

  return (
    <TooltipProvider delayDuration={120}>
      <div className="px-3 py-3">
        <Table
          className="min-w-max"
          scrollable={false}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const isFirstColumn = headerIndex === 0;

                  return (
                    <TableHead
                      key={header.id}
                      data-sticky-shadow={isFirstColumn ? (showStickyColumnShadow ? 'on' : 'off') : undefined}
                      className={cn(
                        meta?.headerClassName,
                        'lg:sticky lg:top-0 lg:bg-card lg:backdrop-blur',
                        isFirstColumn
                          ? cn('lg:left-0 lg:z-30', stickyColumnShadowClass)
                          : 'lg:z-20',
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="group cursor-pointer"
                onClick={() => onOpenItem(row.original)}
              >
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                  const isFirstColumn = cellIndex === 0;

                  return (
                    <TableCell
                      key={cell.id}
                      data-sticky-shadow={isFirstColumn ? (showStickyColumnShadow ? 'on' : 'off') : undefined}
                      className={cn(
                        meta?.className,
                        isFirstColumn
                          ? cn(
                              'lg:sticky lg:left-0 lg:z-10 lg:bg-card lg:transition-colors lg:group-hover:bg-muted',
                              stickyColumnShadowClass,
                            )
                          : undefined,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
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
    </TooltipProvider>
  );
}
