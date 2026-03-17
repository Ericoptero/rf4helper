import { useCharacters } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CharactersList() {
  const { data: characters, isLoading } = useCharacters();

  if (isLoading) {
    return <div>Loading characters...</div>;
  }

  const charsList = Object.values(characters || {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {charsList.map((char) => (
        <Card key={char.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{char.name}</CardTitle>
              <Badge variant="secondary">{char.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {char.gifts.love && (char.gifts.love.items.length > 0 || char.gifts.love.categories.length > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-rose-500 mb-1">Loves</h4>
                  <p className="text-sm text-muted-foreground">
                    {[...char.gifts.love.items, ...char.gifts.love.categories].join(', ')}
                  </p>
                </div>
              )}
              {char.gifts.like && (char.gifts.like.items.length > 0 || char.gifts.like.categories.length > 0) && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Likes</h4>
                  <p className="text-sm text-muted-foreground">
                    {[...char.gifts.like.items, ...char.gifts.like.categories].join(', ')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {charsList.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-12">
          No characters found.
        </div>
      )}
    </div>
  );
}
