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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {crop.growTime ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Growth</div><div className="mt-1 text-lg font-semibold">{crop.growTime} Days</div></div> : null}
          {crop.harvested !== undefined ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Yield</div><div className="mt-1 text-lg font-semibold">{crop.harvested}</div></div> : null}
          {crop.seedBuy != null ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Seed Cost</div><div className="mt-1 text-lg font-semibold">{crop.seedBuy}G</div></div> : null}
          {crop.cropSell != null ? <div className="rounded-xl border bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Sell For</div><div className="mt-1 text-lg font-semibold">{crop.cropSell}G</div></div> : null}
        </div>
      </DetailSection>
    </div>
  );
}
