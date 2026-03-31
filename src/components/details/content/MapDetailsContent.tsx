import React from 'react';
import { Box, MapPin, Search } from 'lucide-react';

import { LinkedEntityToken } from '@/components/details/LinkedEntityToken';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';
import { Badge } from '@/components/ui/badge';
import type { MapRegionRecord } from '@/lib/mapFishingRelations';
import { DetailSection } from './shared';

export function MapDetailsContent({ region }: { region: MapRegionRecord }) {
  const rooms = Object.entries(
    region.chests.reduce((acc, chest) => {
      const room = chest.roomCode || 'Unknown';
      if (!acc[room]) {
        acc[room] = [];
      }
      acc[room].push(chest);
      return acc;
    }, {} as Record<string, typeof region.chests>),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/5 p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
            <MapPin className="h-12 w-12" />
          </div>
          <div className="min-w-0 space-y-3 text-center">
            <h2 className="break-words text-3xl font-bold">{region.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getSemanticBadgeClass('warning')}>
                {region.chests.length} Total Chests
              </Badge>
              <Badge variant="outline" className={getSemanticBadgeClass('fish')}>
                {region.fishingLocations.length} Fishing Locations
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {region.fishingLocations.length > 0 ? (
        <DetailSection title="Fishing Locations" icon={<Search className="h-4 w-4 text-cyan-300" />}>
          <div className="flex flex-wrap gap-2">
            {region.fishingLocations.map((location, index) => (
              <LinkedEntityToken
                key={`${location.fishId}-${location.spot}-${index}`}
                reference={{ type: 'fish', id: location.fishId }}
                label={location.fishName}
                meta={`${location.sourceRegion} · ${location.spot}`}
                icon={<Search className="h-3.5 w-3.5" />}
              />
            ))}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Chests by Room" icon={<Box className="h-4 w-4 text-amber-300" />}>
        <div className="space-y-4">
          {rooms.map(([roomCode, chests]) => (
            <div key={roomCode} className="overflow-hidden rounded-xl border">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3 font-semibold">
                Room: {roomCode}
                <Badge variant="outline" className={getSemanticBadgeClass('neutral')}>
                  {chests.length} chest{chests.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-3 p-4">
                {chests.map((chest) => (
                  <div key={chest.id} className="rounded-xl border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Box className="h-4 w-4 text-amber-300" />
                      <span>{chest.itemName || 'Unknown Item'}</span>
                    </div>
                    {chest.notes ? <p className="mt-2 text-sm text-muted-foreground italic">{`(${chest.notes})`}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DetailSection>
    </div>
  );
}
