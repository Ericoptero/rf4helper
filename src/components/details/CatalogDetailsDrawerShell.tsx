import type { ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useDetailDrawer } from './DetailDrawerContext';

export type ResolvedDetailContent = {
  title: string;
  content: ReactNode;
} | null;

export function CatalogDetailsDrawerShell({ resolved }: { resolved: ResolvedDetailContent }) {
  const { canGoBack, back, close } = useDetailDrawer();

  return (
    <Sheet open={!!resolved} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl lg:max-w-2xl" showCloseButton={false}>
        {resolved ? (
          <>
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center gap-2 px-4 py-3">
                {canGoBack ? (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={back}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <SheetHeader className="p-0 pr-12">
                    <SheetTitle>{resolved.title}</SheetTitle>
                    <SheetDescription className="sr-only">
                      View the selected entry details.
                    </SheetDescription>
                  </SheetHeader>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={close}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <ScrollArea data-testid="catalog-detail-scroll" className="min-h-0 flex-1">
              <div className="px-6 pb-6 pt-6">{resolved.content}</div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
