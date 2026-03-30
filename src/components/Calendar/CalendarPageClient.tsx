'use client';

import { CalendarView } from '@/components/Calendar/CalendarView';
import { readDetailSearchParams, writeDetailSearchParams } from '@/components/details/detailTypes';
import { useCatalogRouteState } from '@/hooks/useCatalogRouteState';
import type { CalendarSearchParams } from '@/server/catalogQueries';
import type { Character, CropsData, Festival } from '@/lib/schemas';

export function CalendarPageClient({
  festivals,
  cropsData,
  characters,
  search,
}: {
  festivals: Festival[];
  cropsData: CropsData;
  characters: Record<string, Character>;
  search: CalendarSearchParams;
}) {
  const { patchSearch } = useCatalogRouteState({ search });
  const detailReference = readDetailSearchParams(search);

  return (
    <CalendarView
      festivals={festivals}
      cropsData={cropsData}
      characters={characters}
      season={search.season}
      onSeasonChange={(season) =>
        patchSearch({
          season: season === 'Spring' ? undefined : (season as CalendarSearchParams['season']),
        })
      }
      detailReference={detailReference}
      onDetailReferenceChange={(reference) => patchSearch({ ...writeDetailSearchParams(reference), detail: undefined })}
    />
  );
}
