import { CalendarPageClient } from '@/components/Calendar/CalendarPageClient';
import { parseCalendarSearchParams } from '@/server/catalogQueries';
import { getCharactersData, getCropsData, getFestivalsData } from '@/server/data/loaders';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [festivals, cropsData, characters, rawSearchParams] = await Promise.all([
    getFestivalsData(),
    getCropsData(),
    getCharactersData(),
    searchParams,
  ]);
  const search = parseCalendarSearchParams(rawSearchParams);

  return (
    <CalendarPageClient
      festivals={festivals}
      cropsData={cropsData}
      characters={characters}
      search={search}
    />
  );
}
