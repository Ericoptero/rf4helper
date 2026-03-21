import { useChests } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CatalogPageLayout } from '@/components/CatalogPageLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Box } from 'lucide-react';
import type { Chest } from '@/lib/schemas';
import { useMemo } from 'react';

type MapRegion = {
  id: string;
  name: string;
  chests: Chest[];
};

function MapCard({ region, onClick }: { region: MapRegion; onClick: () => void }) {
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
               <MapPin className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{region.name}</CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-4 text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Box className="w-4 h-4" />
          <span className="font-medium text-foreground">{region.chests.length}</span>
          <span className="text-xs">Chests</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MapDetails({ region }: { region: MapRegion }) {
  // Group by roomCode
  const rooms = useMemo(() => {
    const grouped = region.chests.reduce((acc, chest) => {
      const room = chest.roomCode || 'Unknown';
      if (!acc[room]) {
        acc[room] = [];
      }
      acc[room].push(chest);
      return acc;
    }, {} as Record<string, Chest[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [region.chests]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6 p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
         <div className="w-24 h-24 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
           <MapPin className="w-12 h-12" />
         </div>
         <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{region.name}</h2>
            <div className="inline-flex items-center gap-2 text-muted-foreground bg-background rounded-lg p-2 border">
              <Box className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-foreground">{region.chests.length} Total Chests</span>
            </div>
         </div>
      </div>

      <div className="px-1 space-y-6">
        {rooms.map(([roomCode, chests]) => (
          <div key={roomCode} className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-3 border-b font-semibold flex items-center gap-2">
              <span>Room: {roomCode}</span>
              <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                {chests.length} chest{chests.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-4 space-y-3">
              {chests.map((chest) => (
                <div key={chest.id} className="flex items-start gap-3">
                  <Checkbox id={chest.id} className="mt-1" />
                  <label htmlFor={chest.id} className="text-sm font-medium leading-none cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Box className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{chest.itemName || 'Unknown Item'}</span>
                    </div>
                    {chest.notes && (
                      <p className="text-sm text-muted-foreground italic mt-1 ml-6">{`(${chest.notes})`}</p>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MapsList() {
  const { data: chests, isLoading } = useChests();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading maps...</div>;
  }

  // Create regions from chests
  const mapRegions = useMemo(() => {
    if (!chests) return [];
    
    const regionsMap = chests.reduce((acc, chest) => {
      const region = chest.region || 'Unknown Region';
      if (!acc[region]) {
        acc[region] = {
          id: region,
          name: region,
          chests: []
        };
      }
      acc[region].chests.push(chest);
      return acc;
    }, {} as Record<string, MapRegion>);

    return Object.values(regionsMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [chests]);

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: MapRegion, b: MapRegion) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: MapRegion, b: MapRegion) => b.name.localeCompare(a.name) },
    { label: 'Chests (High-Low)', value: 'chests-desc', sortFn: (a: MapRegion, b: MapRegion) => b.chests.length - a.chests.length },
    { label: 'Chests (Low-High)', value: 'chests-asc', sortFn: (a: MapRegion, b: MapRegion) => a.chests.length - b.chests.length },
  ];

  return (
    <CatalogPageLayout<MapRegion>
      data={mapRegions}
      title="World Maps & Chests"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={[]}
      renderCard={(region, onClick) => <MapCard region={region} onClick={onClick} />}
      renderDetails={(region) => <MapDetails region={region} />}
      detailsTitle={() => `Map Details`}
      detailEmptyState="Select a region to inspect room groupings and chest checklists."
    />
  );
}
