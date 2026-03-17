import { useItems } from '@/hooks/queries';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ItemsList() {
  const { data: items, isLoading } = useItems();

  if (isLoading) {
    return <div>Loading items...</div>;
  }

  const itemsList = Object.values(items || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Buy Price (G)</TableHead>
                <TableHead>Sell Price (G)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-12">
                    {/* Placeholder image until a real asset pipeline is set up */}
                    <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center text-xs">
                       {item.name.charAt(0)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.buy ?? '-'}</TableCell>
                  <TableCell>{item.sell ?? '-'}</TableCell>
                </TableRow>
              ))}
              {itemsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No items found.
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
