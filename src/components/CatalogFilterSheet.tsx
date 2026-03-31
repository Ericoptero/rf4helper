import React from 'react';

import { CatalogFilterCombobox } from './CatalogFilterCombobox';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { CatalogFilterValue, ServerCatalogFilterDefinition } from './CatalogPageLayout';

function normalizeFilterValue(value: CatalogFilterValue) {
  if (Array.isArray(value)) {
    return [...value];
  }

  return value;
}

export function CatalogFilterSheet({
  open,
  onOpenChange,
  quickToggleFilters,
  quickToggleValues,
  detailedFilters,
  draftFilterValues,
  setDraftFilterValues,
  onClearFilters,
  onApplyFilters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickToggleFilters: ServerCatalogFilterDefinition[];
  quickToggleValues: string[];
  detailedFilters: ServerCatalogFilterDefinition[];
  draftFilterValues: Record<string, CatalogFilterValue>;
  setDraftFilterValues: React.Dispatch<React.SetStateAction<Record<string, CatalogFilterValue>>>;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <Button type="button" className="h-11 flex-1 rounded-xl" onClick={onApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
