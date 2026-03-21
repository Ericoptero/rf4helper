import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { CalendarView } from '@/components/Calendar/CalendarView';

const calendarSearchSchema = z.object({
  season: z.enum(['Spring', 'Summer', 'Fall', 'Winter']).optional().catch(undefined),
  detail: z.string().trim().min(1).optional().catch(undefined),
});

type CalendarSearch = z.infer<typeof calendarSearchSchema>;

export const Route = createFileRoute('/calendar')({
  validateSearch: (search: Record<string, unknown>): CalendarSearch =>
    calendarSearchSchema.parse(search),
  component: CalendarRoute,
});

function CalendarRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const updateSearchValue = (key: keyof CalendarSearch, value?: string) => {
    void navigate({
      search: (previous) => {
        const next = { ...previous };
        if (!value) {
          delete next[key];
          return next;
        }

        next[key] = value as never;
        return next;
      },
      replace: true,
    });
  };

  return (
    <CalendarView
      season={search.season}
      onSeasonChange={(season) => updateSearchValue('season', season === 'Spring' ? undefined : season)}
      detailValue={search.detail}
      onDetailValueChange={(value) => updateSearchValue('detail', value)}
    />
  );
}
