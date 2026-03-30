import React from 'react';
import { Calendar as CalendarIcon, Sparkles, Wheat } from 'lucide-react';
import { useCharacters, useCrops, useFestivals } from '@/hooks/queries';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { resolveCharacterImage } from '@/lib/characterImages';
import type { Character } from '@/lib/schemas';
import { DetailDrawerProvider, useDetailDrawer } from '@/components/details/DetailDrawerContext';
import { UniversalDetailsDrawer } from '@/components/details/UniversalDetailsDrawer';
import { getSemanticBadgeClass } from '@/components/details/semanticBadges';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

function CharacterIcon({ character }: { character: Character }) {
  const iconSrc = resolveCharacterImage(character.icon.sm);

  if (iconSrc) {
    return <img src={iconSrc} alt={`${character.name} icon`} className="h-6 w-6 rounded-full object-contain shrink-0" />;
  }

  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-200 text-[10px] font-semibold text-pink-800">
      {character.name.charAt(0)}
    </div>
  );
}

function CalendarContent({
  festivalsData,
  cropsData,
  charactersData,
  season,
  onSeasonChange,
}: {
  festivalsData?: import('@/lib/schemas').Festival[];
  cropsData?: import('@/lib/schemas').CropsData;
  charactersData?: Record<string, Character>;
  season: string;
  onSeasonChange: (season: string) => void;
}) {
  const { data: fetchedFestivals, isLoading: festivalsLoading } = useFestivals({
    enabled: !festivalsData,
  });
  const { data: fetchedCropsData, isLoading: cropsLoading } = useCrops({
    enabled: !cropsData,
  });
  const { data: fetchedCharactersMap, isLoading: charactersLoading } = useCharacters({
    enabled: !charactersData,
  });
  const { openRoot } = useDetailDrawer();
  const festivals = festivalsData ?? fetchedFestivals;
  const resolvedCropsData = cropsData ?? fetchedCropsData;
  const charactersMap = charactersData ?? fetchedCharactersMap;

  const characters = React.useMemo(() => Object.values(charactersMap || {}), [charactersMap]);
  const crops = React.useMemo(() => resolvedCropsData?.regularCrops || [], [resolvedCropsData]);

  const seasonFestivals = React.useMemo(() => (festivals || []).filter((festival) => festival.season === season), [festivals, season]);
  const seasonBirthdays = React.useMemo(() => characters.filter((character) => character.birthday?.season === season), [characters, season]);
  const seasonGoodCrops = React.useMemo(() => crops.filter((crop) => crop.goodSeasons?.includes(season)), [crops, season]);

  if ((!festivalsData && festivalsLoading) || (!cropsData && cropsLoading) || (!charactersData && charactersLoading)) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading calendar data...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card/90 p-6 shadow-sm">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <CalendarIcon className="h-8 w-8 text-primary" /> Rune Factory 4 Calendar
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore seasonal festivals, birthdays, and crop timing in one planner.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Festivals This Season</div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-3xl font-bold">{seasonFestivals.length}</div>
                <Badge variant="secondary" className={getSemanticBadgeClass('calendar')}>Festival Days</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/90 shadow-sm">
            <CardContent className="space-y-2 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Birthdays</div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-3xl font-bold">{seasonBirthdays.length}</div>
                <Badge variant="secondary" className={getSemanticBadgeClass('character')}>Villagers</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/90 shadow-sm sm:col-span-2 xl:col-span-1">
            <CardContent className="space-y-2 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Top Crops</div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-3xl font-bold">{seasonGoodCrops.length}</div>
                <Badge variant="secondary" className={getSemanticBadgeClass('success')}>Good Seasons</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={season} onValueChange={onSeasonChange} className="flex min-h-[calc(100vh-15rem)] flex-col">
          <div className="rounded-3xl border bg-card/90 p-4 shadow-sm">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              {SEASONS.map((entry) => (
                <TabsTrigger key={entry} value={entry}>{entry}</TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
            <div className="flex flex-[3] flex-col overflow-hidden rounded-3xl border bg-card/90 shadow-sm">
              <div className="border-b bg-muted p-3 text-center font-semibold uppercase tracking-widest text-muted-foreground">
                {season} Season
              </div>
              <div className="grid flex-1 auto-rows-fr grid-cols-5 gap-px bg-border md:grid-cols-6 lg:grid-cols-7">
                {Array.from({ length: 30 }).map((_, index) => {
                  const day = index + 1;
                  const dayFestivals = seasonFestivals.filter((festival) => festival.day === day);
                  const dayBirthdays = seasonBirthdays.filter((character) => character.birthday?.day === day);

                  return (
                    <div key={day} className="relative flex min-h-[100px] flex-col bg-background p-2 transition-colors hover:bg-muted/30">
                      <span className="absolute left-2 top-2 text-sm font-semibold opacity-50">{day}</span>
                      <div className="mt-6 flex flex-1 flex-col gap-1 overflow-hidden">
                        {dayFestivals.map((festival) => (
                          <button
                            key={festival.id}
                            type="button"
                            onClick={() => openRoot({ type: 'festival', id: festival.id })}
                            className="truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors md:text-xs"
                          >
                            <span className="inline-flex items-center gap-1 rounded-full px-1 py-0.5">
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span className="truncate">{festival.name}</span>
                            </span>
                          </button>
                        ))}
                        {dayBirthdays.map((character) => (
                          <button
                            key={character.id}
                            type="button"
                            onClick={() => openRoot({ type: 'birthday', id: character.id })}
                            className="truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors md:text-xs"
                          >
                            <span className="inline-flex items-center gap-1 rounded-full px-1 py-0.5">
                              <CharacterIcon character={character} />
                              <span className="truncate">{character.name}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <Card className="flex min-h-0 flex-1 flex-col">
                <CardHeader className="border-b bg-muted/10 py-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wheat className="h-5 w-5 text-green-600" /> Best Crops
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-1">
                      {seasonGoodCrops.length > 0 ? seasonGoodCrops.map((crop) => (
                        <button
                          key={crop.id}
                          type="button"
                          onClick={() => openRoot({ type: 'crop', id: crop.id })}
                          className="flex items-center justify-between rounded-lg border bg-card p-2 text-left transition-colors hover:border-green-500/50 hover:bg-green-50/50"
                        >
                          <span className="font-medium text-sm">{crop.name}</span>
                          <span className="text-xs text-muted-foreground">{crop.growTime}d</span>
                        </button>
                      )) : (
                        <div className="p-2 text-sm text-muted-foreground">No specific bonus crops.</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="flex min-h-0 flex-1 flex-col">
                <CardHeader className="border-b bg-muted/10 py-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" /> Season Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
                      <div>
                        <h4 className="mb-2 text-sm font-bold text-muted-foreground">Upcoming Festivals</h4>
                        <div className="space-y-2">
                          {seasonFestivals.map((festival) => (
                            <button
                              key={festival.id}
                              type="button"
                              onClick={() => openRoot({ type: 'festival', id: festival.id })}
                              className="flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left transition-colors hover:border-purple-500/50 hover:bg-purple-50/50"
                            >
                              <Badge variant="outline" className={getSemanticBadgeClass('calendar')}>
                                {festival.day || '-'}
                              </Badge>
                              <span className="truncate text-sm font-medium">{festival.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>

      <UniversalDetailsDrawer />
    </>
  );
}

export function CalendarView({
  festivals,
  cropsData,
  characters,
  season,
  onSeasonChange,
  detailValue,
  onDetailValueChange,
}: {
  festivals?: import('@/lib/schemas').Festival[];
  cropsData?: import('@/lib/schemas').CropsData;
  characters?: Record<string, Character>;
  season?: string;
  onSeasonChange?: (season: string) => void;
  detailValue?: string;
  onDetailValueChange?: (value?: string) => void;
} = {}) {
  const [internalSeason, setInternalSeason] = React.useState('Spring');
  const [internalDetailValue, setInternalDetailValue] = React.useState<string | undefined>();

  return (
    <DetailDrawerProvider
      detailValue={detailValue ?? internalDetailValue}
      onDetailValueChange={onDetailValueChange ?? setInternalDetailValue}
    >
      <CalendarContent
        festivalsData={festivals}
        cropsData={cropsData}
        charactersData={characters}
        season={season ?? internalSeason}
        onSeasonChange={onSeasonChange ?? setInternalSeason}
      />
    </DetailDrawerProvider>
  );
}
