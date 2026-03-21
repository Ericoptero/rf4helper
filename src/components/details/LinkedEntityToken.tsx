import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDetailDrawer } from './DetailDrawerContext';
import type { DetailEntityReference } from './detailTypes';

export function LinkedEntityToken({
  reference,
  label,
  meta,
  imageSrc,
  icon,
  className,
}: {
  reference: DetailEntityReference;
  label: string;
  meta?: ReactNode;
  imageSrc?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const { openLinked } = useDetailDrawer();

  return (
    <button
      type="button"
      onClick={() => openLinked(reference)}
      className={cn(
        'inline-flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2.5 py-1.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted',
        className,
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background/70 text-muted-foreground">
        {imageSrc ? <img src={imageSrc} alt={`${label} image`} className="h-5 w-5 rounded object-contain" /> : icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{label}</span>
        {meta ? <span className="block truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      <Badge variant="outline" className="ml-1 shrink-0">
        <ChevronRight className="h-3 w-3" />
      </Badge>
    </button>
  );
}
