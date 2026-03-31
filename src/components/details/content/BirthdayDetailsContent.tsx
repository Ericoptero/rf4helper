import React from 'react';
import { Gift } from 'lucide-react';

import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import type { Character } from '@/lib/schemas';
import { Badge, CharacterAvatar, DetailSection, formatBirthday } from './shared';
import { formatName } from '@/lib/formatters';

export function BirthdayDetailsContent({ character }: { character: Character }) {
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
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Loves</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.love?.items?.length ? character.gifts.love.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Likes</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.like?.items?.length ? character.gifts.like.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Dislikes</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.dislike?.items?.length ? character.gifts.dislike.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Hates</h4>
            <div className="text-sm text-muted-foreground">
              {character.gifts?.hate?.items?.length ? character.gifts.hate.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
        </div>
      </DetailSection>
    </div>
  );
}
