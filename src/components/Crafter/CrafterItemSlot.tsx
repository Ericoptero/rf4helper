import * as React from 'react';
import {
  Anvil,
  Gem,
  Layers3,
  Lock,
  Package,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';

import { type CrafterItemPreviewData } from '@/components/Crafter/CrafterSelectorDialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CRAFTER_RARITY_PLACEHOLDER_ID } from '@/lib/crafterRarity';
import { cn } from '@/lib/utils';
import type { CrafterGridNode } from './crafterTypes';
import { getItemTypeIcon, resolveCrafterItemImage } from './crafterFormatters';

const SLOT_SIZE_CLASS = 'h-24 w-24';

function getSlotChipClasses(nodeType: CrafterGridNode['type']) {
  switch (nodeType) {
    case 'base':
    case 'foodBase':
      return 'bg-primary/10 text-primary';
    case 'inherit':
    case 'upgrade':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getRarityBadgeClasses(rarity: number) {
  if (rarity >= 9) return 'border-amber-500/50 bg-amber-500 text-amber-950';
  if (rarity >= 7) return 'border-violet-500/50 bg-violet-500 text-violet-950';
  if (rarity >= 5) return 'border-sky-500/50 bg-sky-500 text-sky-950';
  if (rarity >= 3) return 'border-emerald-500/50 bg-emerald-500 text-emerald-950';
  return 'border-border bg-muted text-muted-foreground';
}

function renderSlotIcon(node: CrafterGridNode, className?: string) {
  if (node.item?.id === CRAFTER_RARITY_PLACEHOLDER_ID) {
    return <Star className={className} />;
  }

  if (node.item) {
    const ItemIcon = getItemTypeIcon(node.item.type);
    return <ItemIcon className={className} />;
  }

  switch (node.type) {
    case 'base':
    case 'foodBase':
      return <Sparkles className={className} />;
    case 'inherit':
      return <Gem className={className} />;
    case 'upgrade':
      return <Package className={className} />;
    case 'recipe':
    default:
      return <Plus className={className} />;
  }
}

export function CrafterItemSlot({
  node,
  onClick,
  caption,
  previewData,
}: {
  node: CrafterGridNode;
  onClick: () => void;
  caption: string;
  previewData: CrafterItemPreviewData;
}) {
  const accessibleName = node.item ? (node.itemName ?? node.item.name ?? node.label) : node.label;
  const imageSrc = resolveCrafterItemImage(node.item);
  const isFixedSlot = node.interactionMode === 'fixed';
  const isCategorySlot = node.interactionMode === 'category';

  const slotButton = (
    <button
      type="button"
      aria-label={accessibleName}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-xl border-2 bg-card/80 px-2 pb-2 pt-3 transition-all',
        SLOT_SIZE_CLASS,
        isCategorySlot && 'border-dashed border-primary/40 bg-primary/5 hover:border-primary',
        isFixedSlot && 'border-solid border-primary/25 bg-primary/5 hover:border-primary/50',
        node.item
          ? 'border-solid border-border hover:border-primary hover:shadow-md'
          : 'border-dashed border-muted-foreground/30 bg-muted/50 hover:border-primary hover:bg-muted',
      )}
    >
      {node.item ? (
        <>
          <Badge variant="secondary" className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center gap-1 rounded-md border px-1 text-[10px]">
            <Anvil className="h-3 w-3" />
            {node.level}
          </Badge>
          <Badge
            variant="secondary"
            className={cn('absolute -right-1 -top-1 flex h-5 min-w-5 items-center gap-1 rounded-md border px-1 text-[10px]', getRarityBadgeClasses(node.rarity))}
          >
            <Star className="h-3 w-3" />
            {node.rarity}
          </Badge>
        </>
      ) : null}

      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', getSlotChipClasses(node.type))}>
        {imageSrc ? (
          <img src={imageSrc} alt={`${node.itemName ?? node.item?.name ?? node.label} icon`} className="h-8 w-8 object-contain" />
        ) : (
          renderSlotIcon(node, 'h-4 w-4')
        )}
      </div>

      {node.item ? (
        <span className="mt-1 max-w-full truncate px-1 text-[10px] font-medium text-foreground">
          {node.itemName ?? node.label}
        </span>
      ) : (
        <span className="mt-1 text-[10px] text-muted-foreground">{node.label}</span>
      )}

      {node.interactionLabel ? (
        <span
          className={cn(
            'mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
            isCategorySlot
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-background/80 text-muted-foreground',
          )}
        >
          {isCategorySlot ? <Layers3 className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
          {node.interactionLabel}
        </span>
      ) : null}
    </button>
  );

  const captionContent = <p className="text-[11px] font-medium leading-tight text-muted-foreground">{caption}</p>;

  if (!node.item) {
    return (
      <div className="mt-1 flex w-24 flex-none flex-col items-center gap-2 text-center">
        {slotButton}
        {captionContent}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <div className="mt-1 flex w-24 flex-none flex-col items-center gap-2 text-center">
          <TooltipTrigger asChild>{slotButton}</TooltipTrigger>
          {captionContent}
        </div>
        <TooltipContent
          side="right"
          sideOffset={6}
          arrowClassName="fill-popover"
          className="max-w-xs rounded-xl border border-border bg-popover px-3 py-3 text-popover-foreground shadow-lg"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold">{node.item.name}</span>
              <Badge variant="outline">Lv. {node.level}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{node.item.type}</p>
            {previewData.stats.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {previewData.stats.slice(0, 4).map((entry) => (
                  <Badge key={entry} variant="secondary" className="h-auto rounded-md px-2 py-1 text-[10px]">
                    {entry}
                  </Badge>
                ))}
              </div>
            ) : null}
            {previewData.statusAttacks.length > 0 ? (
              <div className="space-y-1">
                {previewData.statusAttacks.slice(0, 3).map((entry) => (
                  <p key={entry} className="text-xs text-muted-foreground">
                    {entry}
                  </p>
                ))}
              </div>
            ) : null}
            {previewData.effects.length > 0 ? (
              <div className="space-y-1">
                {previewData.effects.slice(0, 2).map((effect) => (
                  <p key={effect} className="text-xs text-primary">
                    {effect}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CrafterOverviewCard({
  node,
  onClick,
  previewData,
}: {
  node: CrafterGridNode;
  onClick: () => void;
  previewData: CrafterItemPreviewData;
}) {
  return (
    <Card className="rounded-2xl border bg-background/40 shadow-none transition-colors hover:border-primary/40">
      <CardContent className="flex items-center gap-3 p-3">
        <CrafterItemSlot node={node} onClick={onClick} caption={node.label} previewData={previewData} />
        <div className="min-w-0 space-y-1">
          <div className="font-medium">{node.label}</div>
          <div className="truncate text-sm text-muted-foreground">{node.itemName ?? node.meta ?? node.emptyLabel}</div>
          <div className="text-xs text-muted-foreground">
            Rarity {node.rarity} · Tier {node.tier}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
