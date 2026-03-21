import { cn } from '@/lib/utils';

const semanticBadgeClasses = {
  info: 'border-sky-300/80 bg-sky-100 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200',
  success:
    'border-emerald-300/80 bg-emerald-100 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200',
  warning:
    'border-amber-300/90 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200',
  danger: 'border-rose-300/80 bg-rose-100 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200',
  neutral: 'border-border/70 bg-muted text-foreground dark:bg-muted/60',
  item: 'border-indigo-300/80 bg-indigo-100 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200',
  character:
    'border-pink-300/80 bg-pink-100 text-pink-700 dark:border-pink-400/30 dark:bg-pink-500/15 dark:text-pink-200',
  monster:
    'border-orange-300/80 bg-orange-100 text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200',
  fish: 'border-cyan-300/80 bg-cyan-100 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-200',
  map: 'border-blue-300/80 bg-blue-100 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-200',
  calendar:
    'border-violet-300/80 bg-violet-100 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200',
} as const;

export type SemanticBadgeVariant = keyof typeof semanticBadgeClasses;

export function getSemanticBadgeClass(variant: SemanticBadgeVariant, className?: string) {
  return cn(semanticBadgeClasses[variant], className);
}
