import Link from 'next/link';
import {
  CalendarDays,
  Fish,
  Gamepad2,
  Hammer,
  Map,
  Package,
  Skull,
  Sparkles,
  Users,
} from 'lucide-react';

import { appSurfaceClassNames } from '@/lib/catalogPresentation';
import { getDataIndex } from '@/server/data/loaders';

type CategoryCard = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  summary: string;
  countKey?: 'items' | 'characters' | 'monsters';
};

const categories: CategoryCard[] = [
  {
    href: '/items',
    label: 'Items',
    description: 'Weapons, armor, crops, medicine and crafting sources.',
    icon: Package,
    accentClass: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400',
    summary: 'Search-heavy browser with crafting and stat details.',
    countKey: 'items',
  },
  {
    href: '/monsters',
    label: 'Monsters',
    description: 'Grouped variants, drops, resistances and taming info.',
    icon: Skull,
    accentClass: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
    summary: 'Bestiary split view with variant-aware details.',
    countKey: 'monsters',
  },
  {
    href: '/characters',
    label: 'Characters',
    description: 'Profiles, birthdays, gifts and battle information.',
    icon: Users,
    accentClass: 'border-pink-500/40 bg-pink-500/5 text-pink-400',
    summary: 'Companion profiles with rich support data.',
    countKey: 'characters',
  },
  {
    href: '/crafter',
    label: 'Crafter',
    description: 'Interactive loadout planner for inheritance, upgrades and food.',
    icon: Hammer,
    accentClass: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
    summary: 'Single-page build planner with live totals and craft steps.',
  },
  {
    href: '/calendar',
    label: 'Calendar',
    description: 'Festivals, birthdays, seasons and crop timing.',
    icon: CalendarDays,
    accentClass: 'border-violet-500/40 bg-violet-500/5 text-violet-400',
    summary: 'Season planner with event and crop context.',
  },
  {
    href: '/fishing',
    label: 'Fishing',
    description: 'Fish locations, shadow sizes and seasonal access.',
    icon: Fish,
    accentClass: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
    summary: 'Region-grouped fishing reference.',
  },
  {
    href: '/maps',
    label: 'Maps',
    description: 'Chest regions, room groupings and checklist details.',
    icon: Map,
    accentClass: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    summary: 'Treasure tracking by region and room.',
  },
  {
    href: '/player',
    label: 'Player',
    description: 'Orders, requests, rune abilities, skills and trophies.',
    icon: Gamepad2,
    accentClass: 'border-sky-500/40 bg-sky-500/5 text-sky-400',
    summary: 'Progression dashboard grouped by system.',
  },
];

export default async function HomePage() {
  const index = await getDataIndex();
  const counts = {
    items: index.files.items?.count,
    characters: index.files.characters?.count,
    monsters: index.files.monsters?.count,
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className={`${appSurfaceClassNames.shell} p-6`}>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Enchanted Codex
        </div>
        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Rune Factory 4 Helper
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
            A premium searchable reference for items, monsters, characters,
            festivals, maps, and progression systems across Selphia.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {categories.map(({ href, label, description, icon: Icon, accentClass, summary, countKey }) => (
          <Link
            key={href}
            href={href}
            className={`group ${appSurfaceClassNames.interactivePanel} p-5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`rounded-xl border px-3 py-3 ${accentClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              {countKey && counts[countKey] != null ? (
                <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {counts[countKey]!.toLocaleString()}
                </div>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              <h2 className="text-lg font-semibold transition-colors group-hover:text-primary">
                {label}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                {summary}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
