import React from 'react';
import { Wheat } from 'lucide-react';

import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { Badge, DetailSection } from './shared';
import type { Crop } from '@/lib/schemas';

export function CropDetailsContent({ crop }: { crop: Crop }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
            <Wheat className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{crop.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge className={getSemanticBadgeClass('success')}>Crop</Badge>
              {crop.regrows ? <Badge variant="outline" className={getSemanticBadgeClass('info')}>Regrows</Badge> : null}
            </div>
          </div>
        </div>
      </div>
      <DetailSection title="Growth" icon={<Wheat className="h-4 w-4 text-emerald-300" />}>
        <div className="space-y-1">
          {crop.growTime ? <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"><span className="text-sm text-muted-foreground">Growth</span><span className="ml-auto text-sm font-semibold">{crop.growTime} Days</span></div> : null}
          {crop.harvested !== undefined ? <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"><span className="text-sm text-muted-foreground">Yield</span><span className="ml-auto text-sm font-semibold">{crop.harvested}</span></div> : null}
          {crop.seedBuy != null ? <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"><span className="text-sm text-muted-foreground">Seed Cost</span><span className="ml-auto text-sm font-semibold">{crop.seedBuy}G</span></div> : null}
          {crop.cropSell != null ? <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2"><span className="text-sm text-muted-foreground">Sell For</span><span className="ml-auto text-sm font-semibold">{crop.cropSell}G</span></div> : null}
        </div>
      </DetailSection>
    </div>
  );
}
