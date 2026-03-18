import { useMonsters } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ghost, Heart, Sword, Shield, MapPin, Bone } from 'lucide-react';
import type { Monster } from '@/lib/schemas';

function MonsterCard({ monster, onClick }: { monster: Monster, onClick: () => void }) {
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
               <Ghost className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight line-clamp-1">{monster.name}</CardTitle>
              {monster.taming?.tameable && (
                <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-700 hover:bg-green-500/20">Tameable</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
           <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
             <Heart className="w-3 h-3" /> {monster.stats.hp}
           </div>
           <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
             <Sword className="w-3 h-3" /> {monster.stats.atk}
           </div>
           <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
             <Shield className="w-3 h-3" /> {monster.stats.def}
           </div>
        </div>
        {monster.taming?.region && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground w-full truncate">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{monster.taming.region}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonsterDetails({ monster }: { monster: Monster }) {
  const StatNode = ({ icon: Icon, label, value, colorClass }: any) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 ${colorClass}`}>
      <div className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div className="flex items-center gap-6 p-6 bg-orange-500/5 rounded-xl border border-orange-500/20 shrink-0">
         <div className="w-24 h-24 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
           <Ghost className="w-12 h-12" />
         </div>
         <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{monster.name}</h2>
            <div className="flex flex-wrap gap-2">
              {monster.taming?.tameable ? (
                <Badge className="bg-green-600">Tameable</Badge>
              ) : (
                <Badge variant="destructive">Not Tameable</Badge>
              )}
              {monster.taming?.region && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {monster.taming.region}
                </Badge>
              )}
            </div>
         </div>
      </div>

      <ScrollArea className="flex-1 px-1 min-h-0">
        <div className="space-y-6 pb-6 mt-2">
           <div>
             <h3 className="text-xl font-bold mb-3 border-b pb-2">Stats</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               <StatNode icon={Heart} label="HP" value={monster.stats.hp} colorClass="text-red-700" />
               <StatNode icon={Sword} label="ATK" value={monster.stats.atk} colorClass="text-orange-700" />
               <StatNode icon={Shield} label="DEF" value={monster.stats.def} colorClass="text-blue-700" />
               <StatNode icon={Sword} label="M.ATK" value={monster.stats.matk} colorClass="text-purple-700" />
               <StatNode icon={Shield} label="M.DEF" value={monster.stats.mdef} colorClass="text-indigo-700" />
               <StatNode icon={Sword} label="STR" value={monster.stats.str} />
               <StatNode icon={Sword} label="INT" value={monster.stats.int} />
               <StatNode icon={Shield} label="VIT" value={monster.stats.vit} />
             </div>
           </div>

           {(monster.drops || []).length > 0 && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2 flex items-center gap-2">
                 <Bone className="w-5 h-5 text-muted-foreground" /> Drops
               </h3>
               <div className="grid sm:grid-cols-2 gap-2">
                 {monster.drops.map((drop, idx) => (
                   <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                     <span className="font-medium text-sm">{drop.name}</span>
                     <Badge variant="secondary">Rate: {drop.dropRate}</Badge>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {monster.resistances && Object.keys(monster.resistances).length > 0 && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Resistances & Weaknesses</h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                 {Object.entries(monster.resistances).map(([element, value]) => {
                   let color = 'text-muted-foreground';
                   if (value > 0) color = 'text-green-600 bg-green-50 border-green-200';
                   if (value < 0) color = 'text-red-600 bg-red-50 border-red-200';
                   return (
                     <div key={element} className={`flex justify-between items-center p-2 rounded border text-xs font-semibold ${color}`}>
                       <span className="capitalize">{element}</span>
                       <span>{value}%</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}

           {monster.taming?.tameable && (monster.taming.produceName || monster.taming.friendItem) && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Taming Info</h3>
               <div className="space-y-2">
                 {monster.taming.produceName && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Produces:</span>
                     <span className="text-sm">{monster.taming.produceName}</span>
                   </div>
                 )}
                 {monster.taming.friendItem && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Favorite Item:</span>
                     <span className="text-sm">{monster.taming.friendItem}</span>
                   </div>
                 )}
               </div>
             </div>
           )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MonstersList() {
  const { data: monstersMap, isLoading } = useMonsters();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading monsters...</div>;
  }

  const allMonsters = Object.values(monstersMap || {});

  const filterOptions = [
    { label: 'Tameable', value: 'tameable', filterFn: (m: Monster) => !!m.taming?.tameable },
    { label: 'Bosses', value: 'boss', filterFn: (m: Monster) => !!m.taming?.region?.toLowerCase().includes('boss') },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Monster, b: Monster) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Monster, b: Monster) => b.name.localeCompare(a.name) },
    { label: 'HP (High-Low)', value: 'hp-desc', sortFn: (a: Monster, b: Monster) => b.stats.hp - a.stats.hp },
    { label: 'ATK (High-Low)', value: 'atk-desc', sortFn: (a: Monster, b: Monster) => b.stats.atk - a.stats.atk },
  ];

  return (
    <PageLayout<Monster>
      data={allMonsters}
      title="Monsters Compendium"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      renderCard={(monster, onClick) => <MonsterCard monster={monster} onClick={onClick} />}
      renderDetails={(monster) => <MonsterDetails monster={monster} />}
      detailsTitle={() => `Monster Info`}
    />
  );
}
