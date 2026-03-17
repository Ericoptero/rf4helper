import { useMonsters } from '@/hooks/queries';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MonstersList() {
  const { data: monsters, isLoading } = useMonsters();

  if (isLoading) {
    return <div>Loading monsters...</div>;
  }

  const monstersList = Object.values(monsters || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monsters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Stats Summary</TableHead>
                <TableHead>Drops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monstersList.map((monster) => (
                <TableRow key={monster.id}>
                  <TableCell className="w-12">
                    <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center text-xs">
                       {monster.name.charAt(0)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{monster.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>HP: {monster.stats.hp}</span>
                      <span>ATK: {monster.stats.atk} / MATK: {monster.stats.matk}</span>
                      <span>DEF: {monster.stats.def} / MDEF: {monster.stats.mdef}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {monster.drops.map((drop, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {drop.name} ({drop.dropRate}%)
                        </Badge>
                      ))}
                      {monster.drops.length === 0 && <span className="text-muted-foreground text-xs">None</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {monstersList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No monsters found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
