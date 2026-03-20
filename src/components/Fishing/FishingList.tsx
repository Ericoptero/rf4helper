import { useFish } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';
import { Coins, Fish as FishIcon, MapPin, Search } from 'lucide-react';
import type { Fish } from '@/lib/schemas';
import { resolveFishImage } from '@/lib/fishImages';

const SEASON_ORDER = ['Spring', 'Summer', 'Fall', 'Winter'];

function sortSeasons(seasons: string[] = []) {
  return [...seasons].sort((a, b) => SEASON_ORDER.indexOf(a) - SEASON_ORDER.indexOf(b));
}

function FishImage({
  fish,
  className,
  iconClassName,
}: {
  fish: Fish;
  className: string;
  iconClassName: string;
}) {
  const imageSrc = resolveFishImage(fish.image);

  if (imageSrc) {
    return <img src={imageSrc} alt={fish.name} className={className} />;
  }

  return <FishIcon className={iconClassName} aria-hidden="true" />;
}

function FishCard({ fish, onClick }: { fish: Fish, onClick: () => void }) {
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 font-bold text-lg shrink-0">
              <FishImage
                fish={fish}
                className="h-10 w-10 object-contain"
                iconClassName="w-6 h-6"
              />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight line-clamp-1">{fish.name}</CardTitle>
              {fish.shadow && <Badge variant="secondary" className="mt-1 capitalize px-2">{fish.shadow} Shadow</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-700 border-green-500/20">
            <Coins className="w-3 h-3" /> Buy: {fish.buy ?? '-'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 bg-red-500/10 text-red-700 border-red-500/20">
            <Coins className="w-3 h-3" /> Sell: {fish.sell ?? '-'}
          </Badge>
          {fish.locations && fish.locations.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
              <MapPin className="w-3 h-3" /> {fish.locations.length} Locations
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FishDetails({ fish }: { fish: Fish }) {
  const locationsByRegion = (fish.locations ?? []).reduce<Record<string, NonNullable<Fish['locations']>>>((acc, location) => {
    const existingLocations = acc[location.region] ?? [];
    existingLocations.push(location);
    acc[location.region] = existingLocations;
    return acc;
  }, {});

  const sortedRegions = Object.keys(locationsByRegion).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
         <div className="w-32 h-32 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 font-bold text-6xl shadow-sm shrink-0">
          <FishImage
            fish={fish}
            className="h-24 w-24 object-contain"
            iconClassName="w-16 h-16"
          />
         </div>
         <div className="text-center sm:text-left flex-1">
            <h2 className="text-3xl font-bold mb-2">{fish.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              {fish.shadow ? (
                <Badge className="capitalize">{fish.shadow} Shadow</Badge>
              ) : (
                <Badge variant="outline">Unknown Shadow</Badge>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 rounded-lg px-3 py-1.5 border border-green-500/20">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">Buy: {fish.buy ?? '-'}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-700 rounded-lg px-3 py-1.5 border border-red-500/20">
                <Coins className="w-4 h-4" />
                <span className="font-semibold">Sell: {fish.sell ?? '-'}</span>
              </div>
            </div>
         </div>
      </div>

      <div className="px-1 space-y-4">
         <h3 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
           <MapPin className="w-5 h-5 text-cyan-600" /> Locations by Region
         </h3>
         
         {sortedRegions.length > 0 ? (
           <div className="space-y-5">
             {sortedRegions.map((region) => (
               <section key={region} className="space-y-3">
                 <div className="border-b pb-2">
                   <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{region}</h4>
                 </div>
                 <div className="grid gap-3">
                   {locationsByRegion[region]?.map((location) => {
                     const sortedSeasons = sortSeasons(location.seasons);

                     return (
                       <div key={`${location.region}-${location.spot}`} className="rounded-lg border bg-muted/30 p-3">
                         <div className="flex items-start gap-3">
                           <Search className="mt-0.5 w-4 h-4 text-muted-foreground shrink-0" />
                           <div className="space-y-2">
                             <div className="text-sm font-semibold">{location.spot}</div>
                             <div className="flex flex-wrap gap-2">
                               {sortedSeasons.length > 0 && (
                                 <Badge variant="outline">Seasons: {sortedSeasons.join(', ')}</Badge>
                               )}
                               {location.map && (
                                 <Badge variant="outline">Map: {location.map}</Badge>
                               )}
                               {location.other && location.other.length > 0 && (
                                 <Badge variant="outline">Other: {location.other.join(', ')}</Badge>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </section>
             ))}
           </div>
         ) : (
           <div className="p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground text-sm">
             No known locations for this fish.
           </div>
         )}
      </div>
    </div>
  );
}

export function FishingList() {
  const { data: fishList, isLoading } = useFish();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading fish data...</div>;
  }
  
  const allFish = fishList || [];

  // Create distinct shadows for filter
  const shadowSet = new Set<string>();
  allFish.forEach(f => {
    if (f.shadow) shadowSet.add(f.shadow);
  });
  
  const filterOptions = Array.from(shadowSet).sort().map(s => ({
    label: `${s.charAt(0).toUpperCase() + s.slice(1)} Shadow`,
    value: s,
    filterFn: (fish: Fish) => fish.shadow === s
  }));

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Fish, b: Fish) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Fish, b: Fish) => b.name.localeCompare(a.name) },
    { label: 'Buy Price (High-Low)', value: 'buy-desc', sortFn: (a: Fish, b: Fish) => (b.buy || 0) - (a.buy || 0) },
    { label: 'Sell Price (High-Low)', value: 'sell-desc', sortFn: (a: Fish, b: Fish) => (b.sell || 0) - (a.sell || 0) },
  ];

  return (
    <PageLayout<Fish>
      data={allFish}
      title="Fishing Guide"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      renderCard={(fish, onClick) => <FishCard fish={fish} onClick={onClick} />}
      renderDetails={(fish) => <FishDetails fish={fish} />}
      detailsTitle={() => `Fish Details`}
    />
  );
}
