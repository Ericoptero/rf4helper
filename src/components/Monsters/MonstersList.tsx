import React from 'react';
import { useMonsters } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ghost, Heart, Sword, Shield, MapPin, Bone } from 'lucide-react';
import type { Monster } from '@/lib/schemas';

const monsterImages = import.meta.glob('@/assets/images/monsters/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function resolveMonsterImage(image?: string) {
  if (!image) return undefined;
  return monsterImages[`/src/assets${image}.png`];
}

type MonsterGroup = {
  key: string;
  displayName: string;
  representative: Monster;
  variants: Monster[];
  locations: string[];
  searchText: string;
};

function getMonsterGroupKey(monster: Monster) {
  return monster.variantGroup ?? monster.name;
}

function getRepresentativeVariant(variants: Monster[]) {
  return [...variants].sort((a, b) => {
    const aBase = a.variantSuffix ? 1 : 0;
    const bBase = b.variantSuffix ? 1 : 0;
    if (aBase !== bBase) return aBase - bBase;
    return a.name.localeCompare(b.name);
  })[0];
}

function buildMonsterGroups(monsters: Monster[]) {
  const groups = new Map<string, Monster[]>();

  for (const monster of monsters) {
    const key = getMonsterGroupKey(monster);
    const existing = groups.get(key) ?? [];
    existing.push(monster);
    groups.set(key, existing);
  }

  return [...groups.entries()].map(([key, variants]) => {
    const representative = getRepresentativeVariant(variants);
    const locations = [...new Set(variants.map((variant) => variant.location).filter((location): location is string => Boolean(location)))];
    const searchText = [
      key,
      ...variants.map((variant) => variant.name),
      ...locations,
    ].join(' ');

    return {
      key,
      displayName: key,
      representative,
      variants: [...variants].sort((a, b) => a.name.localeCompare(b.name)),
      locations,
      searchText,
    };
  });
}

function formatDropRates(dropRates: number[]) {
  if (dropRates.length === 0) return '—';
  return dropRates.map((rate) => `${rate}%`).join(', ');
}

const resistanceLabels: Record<string, string> = {
  normal: 'Physical',
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  wind: 'Wind',
  light: 'Light',
  dark: 'Dark',
  love: 'Love',
  poison: 'Poison',
  seal: 'Seal',
  paralysis: 'Paralysis',
  sleep: 'Sleep',
  fatigue: 'Fatigue',
  illness: 'Illness',
  faint: 'Faint',
  hpDrain: 'HP Drain',
  dizAttack: 'Diz Attack',
  dizResist: 'Diz Resist',
  knockDistance: 'Knock Distance',
  additionalStunTime: 'Stun Attack',
  knockResist: 'Knock Resist',
  critAttack: 'Crit Attack',
  critResist: 'Crit Resist',
};

function isMonsterActuallyTameable(monster: Monster) {
  return Boolean(monster.taming?.tameable && (monster.taming.befriend ?? 0) > 0);
}

function MonsterCard({ group, onClick }: { group: MonsterGroup, onClick: () => void }) {
  const imageSrc = resolveMonsterImage(group.representative.image);
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
               {imageSrc ? (
                 <img src={imageSrc} alt={group.displayName} className="h-10 w-10 object-contain" />
               ) : (
                 <img src="/src/assets/images/monsters/unknown.png" alt={group.displayName} className="h-10 w-10 object-contain" />
               )}
            </div>
            <div>
              <CardTitle className="text-lg leading-tight line-clamp-1">{group.displayName}</CardTitle>
              {group.variants.some(isMonsterActuallyTameable) && (
                <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-700 hover:bg-green-500/20">Tameable</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
           <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
             <Heart className="w-3 h-3" /> {group.representative.stats.hp}
           </div>
           <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
             <Sword className="w-3 h-3" /> {group.representative.stats.atk}
           </div>
           <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
             <Shield className="w-3 h-3" /> {group.representative.stats.def}
           </div>
        </div>
        {group.locations.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {group.locations.map((location) => (
              <div key={location} className="flex items-center gap-1 w-full truncate">
                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{location}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonsterDetails({ group }: { group: MonsterGroup }) {
  const [selectedVariantName, setSelectedVariantName] = React.useState(group.representative.name);

  React.useEffect(() => {
    setSelectedVariantName(group.representative.name);
  }, [group]);

  const monster = group.variants.find((variant) => variant.name === selectedVariantName) ?? group.representative;
  const imageSrc = resolveMonsterImage(monster.image);
  const StatNode = ({ icon: Icon, label, value, colorClass }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number | null | undefined;
    colorClass?: string;
  }) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border bg-muted/30 ${colorClass}`}>
      <div className="flex items-center gap-1 text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-xl font-black">{value ?? '—'}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div className="flex items-center gap-6 p-6 bg-orange-500/5 rounded-xl border border-orange-500/20 shrink-0">
         <div className="w-24 h-24 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
           {imageSrc ? (
             <img src={imageSrc} alt={monster.name} className="h-20 w-20 object-contain" />
           ) : (
             <Ghost className="w-12 h-12" />
           )}
         </div>
         <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{group.displayName}</h2>
            <div className="flex flex-wrap gap-2">
              {isMonsterActuallyTameable(monster) ? (
                <Badge className="bg-green-600">Tameable</Badge>
              ) : (
                <Badge variant="destructive">Not Tameable</Badge>
              )}
              {monster.location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {monster.location}
                </Badge>
              )}
            </div>
         </div>
      </div>

      <ScrollArea className="flex-1 px-1 min-h-0">
        <div className="space-y-6 pb-6 mt-2">
           {group.variants.length > 1 && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Other Version</h3>
               <Tabs value={monster.name} onValueChange={setSelectedVariantName}>
                 <TabsList className="flex h-auto w-full justify-start gap-2 flex-wrap">
                   {group.variants.map((variant) => (
                     <TabsTrigger key={variant.name} value={variant.name}>
                       {variant.location ?? variant.name}
                     </TabsTrigger>
                   ))}
                 </TabsList>
               </Tabs>
             </div>
           )}

           {monster.description && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Description</h3>
               <p className="text-sm leading-6 text-muted-foreground">{monster.description}</p>
             </div>
           )}

           {monster.nickname && monster.nickname.length > 0 && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Nicknames</h3>
               <div className="flex flex-wrap gap-2">
                 {monster.nickname.map((nickname) => (
                   <Badge key={nickname} variant="outline" className="bg-muted/30">
                     {nickname}
                   </Badge>
                 ))}
               </div>
             </div>
           )}

           <div>
             <h3 className="text-xl font-bold mb-3 border-b pb-2">Stats</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
               <StatNode icon={Sword} label="LV" value={monster.stats.baseLevel} colorClass="text-slate-700" />
               <StatNode icon={Sword} label="EXP" value={monster.stats.exp} colorClass="text-emerald-700" />
               <StatNode icon={Heart} label="HP" value={monster.stats.hp} colorClass="text-red-700" />
               <StatNode icon={Sword} label="ATK" value={monster.stats.atk} colorClass="text-orange-700" />
               <StatNode icon={Shield} label="DEF" value={monster.stats.def} colorClass="text-blue-700" />
               <StatNode icon={Sword} label="M.ATK" value={monster.stats.matk} colorClass="text-purple-700" />
               <StatNode icon={Shield} label="M.DEF" value={monster.stats.mdef} colorClass="text-indigo-700" />
               <StatNode icon={Sword} label="STR" value={monster.stats.str} />
               <StatNode icon={Sword} label="INT" value={monster.stats.int} />
               <StatNode icon={Shield} label="VIT" value={monster.stats.vit} />
               <StatNode icon={Sword} label="BONUS" value={monster.stats.bonus} colorClass="text-amber-700" />
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
                     <Badge variant="secondary">Rate: {formatDropRates(drop.dropRates)}</Badge>
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
                   if ((value ?? 0) > 0) color = 'text-green-600 bg-green-50 border-green-200';
                   if ((value ?? 0) < 0) color = 'text-red-600 bg-red-50 border-red-200';
                   return (
                     <div key={element} className={`flex justify-between items-center p-2 rounded border text-xs font-semibold ${color}`}>
                       <span>{resistanceLabels[element] ?? element}</span>
                       <span>{value ?? '—'}{typeof value === 'number' ? '%' : ''}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}

           {isMonsterActuallyTameable(monster) && ((monster.taming?.produce?.length ?? 0) > 0 || (monster.taming?.favorite?.length ?? 0) > 0 || monster.taming?.befriend !== null || monster.taming?.cycle) && (
             <div>
               <h3 className="text-xl font-bold mb-3 border-b pb-2">Taming Info</h3>
               <div className="space-y-2">
                 {monster.taming?.befriend !== null && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Befriend:</span>
                     <span className="text-sm">{monster.taming?.befriend}</span>
                   </div>
                 )}
                 {monster.taming?.isRideable !== null && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Rideable:</span>
                     <span className="text-sm">{monster.taming?.isRideable ? 'Yes' : 'No'}</span>
                   </div>
                 )}
                 {monster.taming?.favorite && monster.taming.favorite.length > 0 && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Favorite Item:</span>
                     <span className="text-sm">{monster.taming.favorite.map((item) => `${item.name}${item.favorite !== null ? ` (${item.favorite})` : ''}`).join(', ')}</span>
                   </div>
                 )}
                 {monster.taming?.produce && monster.taming.produce.length > 0 && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Produces:</span>
                     <span className="text-sm">{monster.taming.produce.map((item) => `${item.name}${item.level !== null ? ` (Lv ${item.level}+)` : ''}`).join(', ')}</span>
                   </div>
                 )}
                 {monster.taming?.cycle && (
                   <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                     <span className="font-semibold text-sm w-32">Cycle:</span>
                     <span className="text-sm">{monster.taming.cycle}</span>
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
  const groupedMonsters = buildMonsterGroups(allMonsters);

  const filterOptions = [
    { label: 'Tameable', value: 'tameable', filterFn: (group: MonsterGroup) => group.variants.some(isMonsterActuallyTameable) },
    { label: 'Bosses', value: 'boss', filterFn: (group: MonsterGroup) => group.variants.some((monster) => !!monster.location?.toLowerCase().includes('boss')) },
  ];

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: MonsterGroup, b: MonsterGroup) => a.displayName.localeCompare(b.displayName) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: MonsterGroup, b: MonsterGroup) => b.displayName.localeCompare(a.displayName) },
    { label: 'HP (High-Low)', value: 'hp-desc', sortFn: (a: MonsterGroup, b: MonsterGroup) => (b.representative.stats.hp ?? 0) - (a.representative.stats.hp ?? 0) },
    { label: 'ATK (High-Low)', value: 'atk-desc', sortFn: (a: MonsterGroup, b: MonsterGroup) => (b.representative.stats.atk ?? 0) - (a.representative.stats.atk ?? 0) },
  ];

  return (
    <PageLayout<MonsterGroup>
      data={groupedMonsters}
      title="Monsters Compendium"
      searchKey={(group) => group.searchText}
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      renderCard={(group, onClick) => <MonsterCard group={group} onClick={onClick} />}
      renderDetails={(group) => <MonsterDetails group={group} />}
      detailsTitle={() => `Monster Info`}
    />
  );
}
