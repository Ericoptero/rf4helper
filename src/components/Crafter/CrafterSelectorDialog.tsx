import * as React from 'react';
import { Check, Search, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CRAFTER_RARITY_PLACEHOLDER_ID } from '@/lib/crafter';
import { cn } from '@/lib/utils';
import type { Item } from '@/lib/schemas';

export type CrafterItemPreviewData = {
  imageSrc?: string;
  stats: string[];
  statusAttacks: string[];
  others: string[];
  resistanceGroups: Array<{ title: string; values: string[] }>;
  effects: string[];
  rarity?: number;
};

type CrafterSelectorDialogProps = {
  open: boolean;
  title: string;
  description: string;
  selectedItem?: Item;
  selectedItemId?: string;
  selectedLevel?: number;
  canEditLevel: boolean;
  options: Item[];
  getItemPreviewData: (item?: Item) => CrafterItemPreviewData;
  onOpenChange: (open: boolean) => void;
  onApply: (updates: { itemId?: string; level: number }) => void;
  onClear: () => void;
};

type CrafterSortMode = 'name-asc' | 'name-desc' | 'rarity-desc' | 'rarity-asc';

export function CrafterSelectorDialog({
  open,
  title,
  description,
  selectedItem,
  selectedItemId,
  selectedLevel = 1,
  canEditLevel,
  options,
  getItemPreviewData,
  onOpenChange,
  onApply,
  onClear,
}: CrafterSelectorDialogProps) {
  const [query, setQuery] = React.useState('');
  const [draftItemId, setDraftItemId] = React.useState<string | undefined>();
  const [draftLevel, setDraftLevel] = React.useState(selectedLevel);
  const [sortMode, setSortMode] = React.useState<CrafterSortMode>('name-asc');

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setDraftItemId(selectedItemId);
    setDraftLevel(selectedLevel);
    setSortMode('name-asc');
  }, [open, selectedItemId, selectedLevel]);

  const visibleOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = options.filter((item) => {
      if (item.id === CRAFTER_RARITY_PLACEHOLDER_ID) return true;
      if (!normalizedQuery) return true;
      return item.name.toLowerCase().includes(normalizedQuery) || item.type.toLowerCase().includes(normalizedQuery);
    });

    const pinned = filtered.filter((item) => item.id === CRAFTER_RARITY_PLACEHOLDER_ID);
    const sortable = filtered
      .filter((item) => item.id !== CRAFTER_RARITY_PLACEHOLDER_ID)
      .map((item) => ({
        item,
        rarity: item.rarityPoints ?? getItemPreviewData(item).rarity ?? 0,
      }))
      .sort((left, right) => {
        switch (sortMode) {
          case 'name-desc':
            return right.item.name.localeCompare(left.item.name);
          case 'rarity-desc':
            return right.rarity - left.rarity || left.item.name.localeCompare(right.item.name);
          case 'rarity-asc':
            return left.rarity - right.rarity || left.item.name.localeCompare(right.item.name);
          case 'name-asc':
          default:
            return left.item.name.localeCompare(right.item.name);
        }
      })
      .map(({ item }) => item);

    return [...pinned, ...sortable];
  }, [getItemPreviewData, options, query, sortMode]);

  const draftItem = draftItemId ? options.find((item) => item.id === draftItemId) : undefined;
  const previewItem = draftItem ?? selectedItem;
  const previewData = getItemPreviewData(previewItem);
  const resolvedItemId = draftItemId ?? selectedItemId;
  const handleApply = () => {
    if (!resolvedItemId) return;
    onApply({
      itemId: resolvedItemId,
      level: canEditLevel ? draftLevel : 1,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] max-h-[85vh] gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="contents"
          onKeyDownCapture={(event) => {
            if (event.key !== 'Enter' || event.defaultPrevented) return;
            const target = event.target as HTMLElement | null;
            const tagName = target?.tagName;
            const role = target?.getAttribute('role');
            const isTextInput =
              tagName === 'TEXTAREA' ||
              (tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') ||
              target?.isContentEditable;
            const isListboxNavigation = role === 'option' || role === 'listbox';
            if (isTextInput || isListboxNavigation || !resolvedItemId) return;
            event.preventDefault();
            handleApply();
          }}
          onSubmit={(event) => {
            event.preventDefault();
            handleApply();
          }}
        >
          <div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
            <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="flex min-h-0 flex-col gap-4">
                <div className="flex min-h-0 flex-col gap-3">
                  <Select value={sortMode} onValueChange={(value) => setSortMode(value as CrafterSortMode)}>
                    <SelectTrigger aria-label="Sort items" className="h-11 min-w-[11rem] rounded-xl">
                      <SelectValue placeholder="Sort items" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="rarity-desc">Rarity (High-Low)</SelectItem>
                      <SelectItem value="rarity-asc">Rarity (Low-High)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      aria-label="Search items"
                      placeholder="Search items"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {visibleOptions.map((item) => {
                    const isSelected = draftItemId === item.id;
                    const itemPreview = getItemPreviewData(item);
                    const isPlaceholder = item.id === CRAFTER_RARITY_PLACEHOLDER_ID;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDraftItemId(item.id);
                          if (draftItemId !== item.id) {
                            setDraftLevel(10);
                          }
                        }}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                          isPlaceholder && 'border-amber-500/40 bg-amber-500/10',
                          isSelected ? 'border-primary bg-primary/5' : 'bg-card hover:border-primary/40 hover:bg-muted/40',
                        )}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {itemPreview.imageSrc ? (
                            <img
                              src={itemPreview.imageSrc}
                              alt={`${item.name} icon`}
                              className="h-8 w-8 object-contain"
                              loading="eager"
                              decoding="sync"
                            />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-medium">{item.name}</span>
                              {isPlaceholder ? (
                                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                                  Pinned
                                </span>
                              ) : null}
                            </div>
                            {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{item.type}</div>
                          {itemPreview.stats.length > 0 ? (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {itemPreview.stats.slice(0, 3).map((entry) => (
                                <span key={entry}>{entry}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}

                  {visibleOptions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      No items found.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 rounded-3xl border bg-muted/30">
                <div className="h-full min-h-0 space-y-4 overflow-y-auto p-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected Item</div>
                    <div className="mt-2 text-lg font-semibold">{previewItem?.name ?? 'Empty slot'}</div>
                    <div className="text-sm text-muted-foreground">{previewItem?.type ?? 'Choose an item to preview its summary.'}</div>
                  </div>

                  <div className="flex h-20 items-center justify-center rounded-2xl border bg-background/70">
                    {previewData.imageSrc ? (
                      <img
                        src={previewData.imageSrc}
                        alt={`${previewItem?.name ?? 'Selected item'} icon`}
                        className="h-16 w-16 object-contain"
                        loading="eager"
                        decoding="sync"
                      />
                    ) : (
                      <Sparkles className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  {previewData.stats.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stats</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {previewData.stats.map((entry) => (
                          <span key={entry} className="rounded-full border bg-background px-3 py-1">
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {previewData.statusAttacks.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status Attack</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {previewData.statusAttacks.map((entry) => (
                          <span key={entry} className="rounded-full border bg-background px-3 py-1">
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {previewData.others.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Others</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {previewData.others.map((entry) => (
                          <span key={entry} className="rounded-full border bg-background px-3 py-1">
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {previewData.resistanceGroups.map((group) => (
                    <div key={group.title} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.title}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {group.values.map((entry) => (
                          <span key={entry} className="rounded-full border bg-background px-3 py-1">
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {previewData.effects.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bonus Effects</div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {previewData.effects.map((effect) => (
                          <div key={effect}>{effect}</div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {canEditLevel ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-medium" htmlFor="crafter-selector-level">
                          Item level
                        </label>
                        <span className="text-sm text-muted-foreground">Lv. {draftLevel}</span>
                      </div>
                      <Slider
                        id="crafter-selector-level"
                        aria-label="Item level"
                        min={1}
                        max={10}
                        step={1}
                        value={[draftLevel]}
                        onValueChange={(value) => setDraftLevel(Math.max(1, Math.min(10, value[0] ?? 1)))}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClear();
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Clear Slot
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!resolvedItemId}>
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
