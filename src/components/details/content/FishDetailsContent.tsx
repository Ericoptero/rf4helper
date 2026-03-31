import React from 'react';
import { MapPin, Search } from 'lucide-react';

import { resolveFishImage } from '@/lib/fishImages';
import type { Fish } from '@/lib/schemas';
import { DetailSection } from './shared';
import { Badge } from '@/components/ui/badge';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';

export function FishDetailsContent({ fish }: { fish: Fish }) {
  const locationsByRegion = (fish.locations ?? []).reduce<Record<string, NonNullable<Fish['locations']>>>((acc, location) => {
    const existingLocations = acc[location.region] ?? [];
    existingLocations.push(location);
    acc[location.region] = existingLocations;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
            {resolveFishImage(fish.image) ? (
              <img src={resolveFishImage(fish.image)} alt={fish.name} className="h-24 w-24 object-contain" />
            ) : (
              <Search className="h-16 w-16" />
            )}
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{fish.name}</h2>
            <div className="flex flex-wrap gap-2">
              {fish.shadow ? <Badge className={getSemanticBadgeClass('fish')}>{fish.shadow} Shadow</Badge> : null}
              <Badge variant="outline" className={getSemanticBadgeClass('success')}>Buy: {fish.buy ?? '-'}</Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('danger')}>Sell: {fish.sell ?? '-'}</Badge>
            </div>
          </div>
        </div>
      </div>

      <DetailSection title="Locations by Region" icon={<MapPin className="h-4 w-4 text-cyan-300" />}>
        {Object.keys(locationsByRegion).length > 0 ? (
          <div className="space-y-5">
            {Object.keys(locationsByRegion).sort().map((region) => (
              <section key={region} className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{region}</h4>
                <div className="grid gap-3">
                  {locationsByRegion[region]?.map((location) => (
                    <div key={`${location.region}-${location.spot}`} className="rounded-xl border bg-muted/30 p-3">
                      <div className="text-sm font-semibold">{location.spot}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {location.seasons?.length ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('calendar')}>
                            Seasons: {location.seasons.join(', ')}
                          </Badge>
                        ) : null}
                        {location.map ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('map')}>
                            Map: {location.map}
                          </Badge>
                        ) : null}
                        {location.other?.length ? (
                          <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                            Other: {location.other.join(', ')}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            No known locations for this fish.
          </div>
        )}
      </DetailSection>
    </div>
  );
}
