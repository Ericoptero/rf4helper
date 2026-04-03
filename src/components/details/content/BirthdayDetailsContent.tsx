import React from 'react';
import { Gift } from 'lucide-react';

import { LinkedEntityToken } from '@/components/details/LinkedEntityToken';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import type { Character, Item } from '@/lib/schemas';
import {
  Badge,
  CharacterAvatar,
  DetailSection,
  formatBirthday,
  getLinkedItemDisplay,
  ItemRecipeTooltipContent,
} from './shared';

function BirthdayGiftGroup({
  title,
  itemIds,
  items,
}: {
  title: string;
  itemIds: string[];
  items?: Record<string, Item>;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      {itemIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {itemIds.map((itemId) => {
            const linkedItem = getLinkedItemDisplay(items, itemId);
            return (
              <LinkedEntityToken
                key={`${title}-${itemId}`}
                reference={{ type: 'item', id: itemId }}
                label={linkedItem.label}
                imageSrc={linkedItem.imageSrc}
                icon={<Gift className="h-3.5 w-3.5" />}
                tooltipContent={<ItemRecipeTooltipContent itemId={itemId} items={items} />}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">None</div>
      )}
    </div>
  );
}

export function BirthdayDetailsContent({
  character,
  items,
}: {
  character: Character;
  items?: Record<string, Item>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-pink-400/20 bg-pink-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-300">
            <CharacterAvatar character={character} />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{character.name}'s Birthday</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('character')}>
                <Gift className="mr-1 h-3 w-3" />
                {formatBirthday(character)}
              </Badge>
              <Badge className={getSemanticBadgeClass('character')}>{character.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      <DetailSection title="Gift Preferences" icon={<Gift className="h-4 w-4 text-pink-300" />}>
        <div className="space-y-4">
          <BirthdayGiftGroup title="Loves" itemIds={character.gifts?.love?.items ?? []} items={items} />
          <BirthdayGiftGroup title="Likes" itemIds={character.gifts?.like?.items ?? []} items={items} />
          <BirthdayGiftGroup title="Dislikes" itemIds={character.gifts?.dislike?.items ?? []} items={items} />
          <BirthdayGiftGroup title="Hates" itemIds={character.gifts?.hate?.items ?? []} items={items} />
        </div>
      </DetailSection>
    </div>
  );
}
