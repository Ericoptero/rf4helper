'use client';

import { usePathname, useRouter } from 'next/navigation';

import { CalendarView } from '@/components/Calendar/CalendarView';
import type { CalendarSearchParams } from '@/server/catalogQueries';
import type { Character, CropsData, Festival } from '@/lib/schemas';

function buildHref(pathname: string, search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

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
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchValue = (key: keyof CalendarSearchParams, value?: string) => {
    const nextSearch = { ...search } as Record<string, string | undefined>;

    if (!value) delete nextSearch[key];
    else nextSearch[key] = value;

    router.replace(buildHref(pathname, nextSearch), { scroll: false });
  };

  return (
    <CalendarView
      festivals={festivals}
      cropsData={cropsData}
      characters={characters}
      season={search.season}
      onSeasonChange={(season) => updateSearchValue('season', season === 'Spring' ? undefined : season)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
    />
  );
}
