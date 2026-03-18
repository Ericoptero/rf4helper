import { useState, useMemo } from 'react';
import { useFestivals, useCrops, useCharacters } from '@/hooks/queries';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerFooter, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar as CalendarIcon, Wheat, Gift } from 'lucide-react';
import type { Festival, Crop, Character } from '@/lib/schemas';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

// Helper to format ids nicely
function formatName(id: string) {
  return id.replace(/^item-|recipe-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Mocked RF4 Birthdays since it's missing from characters.json
const BIRTHDAYS: Record<string, { season: string, day: number }> = {
  "Amber": { season: "Spring", day: 26 },
  "Arthur": { season: "Summer", day: 4 },
  "Bado": { season: "Winter", day: 10 },
  "Clorica": { season: "Spring", day: 12 },
  "Dolce": { season: "Winter", day: 18 },
  "Doug": { season: "Fall", day: 6 },
  "Dylas": { season: "Fall", day: 9 },
  "Forte": { season: "Summer", day: 22 },
  "Illuminata": { season: "Spring", day: 23 },
  "Jones": { season: "Winter", day: 7 },
  "Kiel": { season: "Winter", day: 2 },
  "Leon": { season: "Summer", day: 9 },
  "Lin Fa": { season: "Spring", day: 8 },
  "Margaret": { season: "Spring", day: 21 },
  "Nancy": { season: "Fall", day: 23 },
  "Porcoline": { season: "Fall", day: 21 },
  "Vishnal": { season: "Fall", day: 17 },
  "Volkanon": { season: "Summer", day: 6 },
  "Xiao Pai": { season: "Summer", day: 26 },
};

type EventItem = 
  | { type: 'festival', data: Festival }
  | { type: 'birthday', data: Character }
  | { type: 'crop', data: Crop };

function EventDetailsNode({ event }: { event: EventItem | null }) {
  if (!event) return null;

  if (event.type === 'festival') {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
             <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{event.data.name}</h2>
            <div className="flex gap-2 mt-1">
              <Badge>{event.data.season ? `${event.data.season} ${event.data.day}` : 'Multi-Season'}</Badge>
              {event.data.orderable && <Badge variant="secondary">Orderable</Badge>}
            </div>
          </div>
        </div>
        <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed">
           {event.data.description || 'No description available for this festival.'}
        </div>
      </div>
    );
  }

  if (event.type === 'birthday') {
    const bday = BIRTHDAYS[event.data.name];
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 text-2xl font-bold">
             {event.data.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{event.data.name}'s Birthday</h2>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="border-pink-200 text-pink-700 bg-pink-50">
                 <Gift className="w-3 h-3 mr-1" /> {bday ? `${bday.season} ${bday.day}` : 'Unknown'}
              </Badge>
              <Badge>{event.data.category}</Badge>
            </div>
          </div>
        </div>
        
        {/* Gift Preferences */}
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b pb-1 text-pink-600">Loves</h4>
            <div className="text-sm text-muted-foreground">
              {event.data.gifts?.love?.items?.length ? event.data.gifts.love.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b pb-1 text-green-600">Likes</h4>
            <div className="text-sm text-muted-foreground">
              {event.data.gifts?.like?.items?.length ? event.data.gifts.like.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b pb-1 text-red-600">Dislikes</h4>
            <div className="text-sm text-muted-foreground">
               {event.data.gifts?.dislike?.items?.length ? event.data.gifts.dislike.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm border-b pb-1 text-neutral-600">Hates</h4>
            <div className="text-sm text-muted-foreground">
              {event.data.gifts?.hate?.items?.length ? event.data.gifts.hate.items.map(formatName).join(', ') : 'None'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'crop') {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
             <Wheat className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{event.data.name}</h2>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-green-600 hover:bg-green-700">Crop</Badge>
              {event.data.regrows && <Badge variant="secondary">Regrows</Badge>}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
           {event.data.growTime && (
             <div className="bg-muted p-3 rounded-lg text-center">
               <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Growth</div>
               <div className="text-lg font-bold">{event.data.growTime} Days</div>
             </div>
           )}
           {event.data.harvested !== undefined && (
             <div className="bg-muted p-3 rounded-lg text-center">
               <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Yield</div>
               <div className="text-lg font-bold">{event.data.harvested}</div>
             </div>
           )}
           {event.data.seedBuy !== null && event.data.seedBuy !== undefined && (
             <div className="bg-muted p-3 rounded-lg text-center">
               <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Seed Cost</div>
               <div className="text-lg font-bold text-amber-600">{event.data.seedBuy}G</div>
             </div>
           )}
           {event.data.cropSell !== null && event.data.cropSell !== undefined && (
             <div className="bg-muted p-3 rounded-lg text-center">
               <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Sell For</div>
               <div className="text-lg font-bold text-amber-600">{event.data.cropSell}G</div>
             </div>
           )}
        </div>
        
        {(event.data.goodSeasons || event.data.badSeasons) && (
          <div className="flex flex-col gap-2 mt-4 bg-muted/50 p-4 rounded-lg border">
            {event.data.goodSeasons && event.data.goodSeasons.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-24">Good Seasons:</span>
                <div className="flex gap-1">
                  {event.data.goodSeasons.map(s => <Badge key={s} variant="outline" className="border-green-200 bg-green-50 text-green-700">{s}</Badge>)}
                </div>
              </div>
            )}
            {event.data.badSeasons && event.data.badSeasons.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold w-24">Bad Seasons:</span>
                <div className="flex gap-1">
                  {event.data.badSeasons.map(s => <Badge key={s} variant="outline" className="border-red-200 bg-red-50 text-red-700">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function CalendarView() {
  const { data: festivals, isLoading: isFDL } = useFestivals();
  const { data: cropsData, isLoading: isCDL } = useCrops();
  const { data: charactersMap, isLoading: isChL } = useCharacters();
  
  const [activeSeason, setActiveSeason] = useState('Spring');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const characters = useMemo(() => Object.values(charactersMap || {}), [charactersMap]);
  const crops = useMemo(() => cropsData?.regularCrops || [], [cropsData]);

  const seasonFestivals = useMemo(() => {
    return (festivals || []).filter(f => f.season === activeSeason);
  }, [festivals, activeSeason]);

  const seasonBirthdays = useMemo(() => {
    return characters.filter(c => BIRTHDAYS[c.name] && BIRTHDAYS[c.name].season === activeSeason);
  }, [characters, activeSeason]);
  
  const seasonGoodCrops = useMemo(() => {
    return crops.filter(c => c.goodSeasons?.includes(activeSeason));
  }, [crops, activeSeason]);

  if (isFDL || isCDL || isChL) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading calendar data...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="w-8 h-8 text-primary" /> Rune Factory 4 Calendar
        </h1>
      </div>
      
      <Tabs value={activeSeason} onValueChange={setActiveSeason} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            {SEASONS.map(s => (
              <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 p-6 gap-6 w-full">
          {/* 75% Calendar Grid */}
          <div className="flex-3 flex flex-col border rounded-xl overflow-hidden bg-background shadow-sm">
             <div className="bg-muted p-3 border-b text-center font-semibold uppercase tracking-widest text-muted-foreground">
               {activeSeason} Season
             </div>
             <div className="flex-1 grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 auto-rows-fr bg-border gap-px">
               {Array.from({ length: 30 }).map((_, i) => {
                 const day = i + 1;
                 const dayFestivals = seasonFestivals.filter(f => f.day === day);
                 const dayBirthdays = seasonBirthdays.filter(c => BIRTHDAYS[c.name].day === day);
                 
                 return (
                   <div key={day} className="bg-background p-2 flex flex-col relative min-h-[100px] hover:bg-muted/30 transition-colors">
                     <span className="text-sm font-semibold opacity-50 absolute top-2 left-2">{day}</span>
                     <div className="mt-6 flex-1 flex flex-col gap-1 overflow-hidden">
                       {/* Festivals */}
                       {dayFestivals.map(fest => (
                         <button 
                           key={fest.id}
                           onClick={() => setSelectedEvent({ type: 'festival', data: fest })}
                           className="text-[10px] md:text-xs bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 border px-1.5 py-0.5 rounded truncate text-left transition-colors font-medium flex items-center gap-1"
                         >
                           <Sparkles className="w-3 h-3 shrink-0" /> <span className="truncate">{fest.name}</span>
                         </button>
                       ))}
                       {/* Birthdays */}
                       {dayBirthdays.map(char => (
                         <button 
                           key={char.id}
                           onClick={() => setSelectedEvent({ type: 'birthday', data: char })}
                           className="text-[10px] md:text-xs bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 border px-1.5 py-0.5 rounded truncate text-left transition-colors font-medium flex items-center gap-1"
                         >
                           <Gift className="w-3 h-3 shrink-0" /> <span className="truncate">{char.name}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* 25% Sidebar */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
             <Card className="flex-1 flex flex-col min-h-0">
               <CardHeader className="py-4 border-b bg-muted/10">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Wheat className="w-5 h-5 text-green-600" /> Best Crops
                 </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full">
                   <div className="p-4 grid grid-cols-2 lg:grid-cols-1 gap-2">
                     {seasonGoodCrops.length > 0 ? seasonGoodCrops.map(crop => (
                       <button
                         key={crop.id}
                         onClick={() => setSelectedEvent({ type: 'crop', data: crop })}
                         className="flex items-center justify-between p-2 rounded-lg border bg-card hover:border-green-500/50 hover:bg-green-50/50 transition-colors text-left"
                       >
                         <span className="font-medium text-sm">{crop.name}</span>
                         <span className="text-xs text-muted-foreground">{crop.growTime}d</span>
                       </button>
                     )) : (
                       <div className="text-sm text-muted-foreground p-2">No specific bonus crops.</div>
                     )}
                   </div>
                 </ScrollArea>
               </CardContent>
             </Card>

             <Card className="flex-1 flex flex-col min-h-0">
               <CardHeader className="py-4 border-b bg-muted/10">
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-purple-600" /> Season Overview
                 </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 p-0 overflow-hidden">
                 <ScrollArea className="h-full">
                   <div className="p-4 space-y-4">
                     <div>
                       <h4 className="text-sm font-bold text-muted-foreground mb-2">Upcoming Festivals</h4>
                       <div className="space-y-2">
                         {seasonFestivals.map(fest => (
                           <button
                             key={fest.id}
                             onClick={() => setSelectedEvent({ type: 'festival', data: fest })}
                             className="w-full flex items-center gap-2 p-2 rounded-lg border bg-card hover:border-purple-500/50 hover:bg-purple-50/50 transition-colors text-left"
                           >
                              <Badge variant="outline" className="w-8 justify-center border-purple-200 text-purple-700 bg-purple-50 shrink-0">
                                {fest.day || '-'}
                              </Badge>
                              <span className="font-medium text-sm truncate">{fest.name}</span>
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

      {/* Detail Drawer */}
      <Drawer open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl px-4 py-2">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Event Details</DrawerTitle>
              <DrawerDescription>View specific details for this event</DrawerDescription>
            </DrawerHeader>
            <EventDetailsNode event={selectedEvent} />
            <DrawerFooter className="px-0 pt-6">
              <DrawerClose asChild>
                <Button variant="outline">Close Details</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
