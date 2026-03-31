import React from 'react';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';

import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { Badge, DetailSection } from './shared';
import type { Festival } from '@/lib/schemas';

export function FestivalDetailsContent({ festival }: { festival: Festival }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <Sparkles className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{festival.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge className={getSemanticBadgeClass('calendar')}>
                {festival.season ? `${festival.season} ${festival.day}` : 'Multi-Season'}
              </Badge>
              {festival.orderable ? <Badge variant="outline" className={getSemanticBadgeClass('success')}>Orderable</Badge> : null}
            </div>
          </div>
        </div>
      </div>
      <DetailSection title="Description" icon={<CalendarIcon className="h-4 w-4 text-violet-300" />}>
        <p className="break-words rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          {festival.description || 'No description available for this festival.'}
        </p>
      </DetailSection>
    </div>
  );
}
