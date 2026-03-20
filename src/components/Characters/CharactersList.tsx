import { useCharacters } from '@/hooks/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/PageLayout';
import { Smile } from 'lucide-react';
import type { Character } from '@/lib/schemas';
import { formatName } from '@/lib/formatters';

function CharacterCard({ character, onClick }: { character: Character, onClick: () => void }) {
  // Mock friendship value for now
  const friendshipLevel = 0;
  
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
               {character.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">{character.category}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mt-4 text-muted-foreground bg-muted/30 p-2 rounded-md">
          <Smile className="w-5 h-5 text-green-500" />
          <span className="font-medium text-foreground">{friendshipLevel}</span>
          <span className="text-xs">/ 99</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterDetails({ character }: { character: Character }) {
  const renderGifts = (title: string, data: { items: string[], categories: string[] }, colorClass: string) => {
    if (!data.items.length && !data.categories.length) return null;
    return (
      <div className="mb-4">
        <h4 className={`text-sm font-semibold mb-2 ${colorClass}`}>{title}</h4>
        <div className="flex flex-wrap gap-2">
          {data.categories.map(c => (
             <Badge key={c} variant="outline" className="bg-muted/50 border-primary/20">{c}</Badge>
          ))}
          {data.items.map(i => (
            <Badge key={i} variant="secondary">{formatName(i)}</Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-muted/20 rounded-xl border">
         <div className="w-32 h-32 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-6xl shadow-sm shrink-0">
           {character.name.charAt(0)}
         </div>
         <div className="text-center sm:text-left flex-1">
            <h2 className="text-3xl font-bold mb-2">{character.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
              <Badge>{character.category}</Badge>
              <Badge variant="outline">Birthday: Unknown</Badge>
            </div>
            <div className="inline-flex items-center justify-center sm:justify-start gap-2 text-muted-foreground bg-background rounded-lg p-2 border">
              <Smile className="w-6 h-6 text-green-500" />
              <span className="font-semibold text-foreground text-xl">0</span>
              <span>/ 999</span>
            </div>
         </div>
      </div>

      <div className="px-1">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Gift Preferences</h3>
        {renderGifts('Loves', character.gifts.love, 'text-pink-500')}
        {renderGifts('Likes', character.gifts.like, 'text-orange-500')}
        {renderGifts('Neutral', character.gifts.neutral, 'text-blue-500')}
        {renderGifts('Dislikes', character.gifts.dislike, 'text-purple-500')}
        {renderGifts('Hates', character.gifts.hate, 'text-red-500')}
      </div>
    </div>
  );
}

export function CharactersList() {
  const { data: characters, isLoading } = useCharacters();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading characters...</div>;
  }

  const charsList = Object.values(characters || {});
  
  // Create distinct categories for filter
  const categories = Array.from(new Set(charsList.map(c => c.category))).sort();
  const filterOptions = categories.map(c => ({
    label: c,
    value: c,
    filterFn: (char: Character) => char.category === c
  }));

  const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc', sortFn: (a: Character, b: Character) => a.name.localeCompare(b.name) },
    { label: 'Name (Z-A)', value: 'name-desc', sortFn: (a: Character, b: Character) => b.name.localeCompare(a.name) },
    { label: 'Category', value: 'cat-asc', sortFn: (a: Character, b: Character) => a.category.localeCompare(b.category) },
  ];

  return (
    <PageLayout<Character>
      data={charsList}
      title="Characters"
      searchKey="name"
      sortOptions={sortOptions}
      filterOptions={filterOptions}
      renderCard={(char, onClick) => <CharacterCard character={char} onClick={onClick} />}
      renderDetails={(char) => <CharacterDetails character={char} />}
      detailsTitle={() => `Character Profile`}
    />
  );
}
