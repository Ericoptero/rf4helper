import Link from 'next/link';
import {
  CalendarDays,
  Fish,
  Gamepad2,
  Hammer,
  Map,
  Package,
  Skull,
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
    summary: 'Browse the full item database with stats, recipes, and sources.',
    countKey: 'items',
  },
  {
    href: '/monsters',
    label: 'Monsters',
    description: 'Grouped variants, drops, resistances and taming info.',
    icon: Skull,
    accentClass: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
    summary: 'Look up stats, drops, weaknesses, and taming details.',
    countKey: 'monsters',
  },
  {
    href: '/characters',
    label: 'Characters',
    description: 'Profiles, birthdays, gifts and battle information.',
    icon: Users,
    accentClass: 'border-pink-500/40 bg-pink-500/5 text-pink-400',
    summary: 'Gift preferences, schedules, and battle stats for every character.',
    countKey: 'characters',
  },
  {
    href: '/crafter',
    label: 'Crafter',
    description: 'Interactive loadout planner for inheritance, upgrades and food.',
    icon: Hammer,
    accentClass: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
    summary: 'Plan your equipment builds with inheritance and upgrade calculations.'
  },
  {
    href: '/calendar',
    label: 'Calendar',
    description: 'Festivals, birthdays, seasons and crop timing.',
    icon: CalendarDays,
    accentClass: 'border-violet-500/40 bg-violet-500/5 text-violet-400',
    summary: 'Check festival dates, birthdays, and crop schedules by season.'
  },
  {
    href: '/fishing',
    label: 'Fishing',
    description: 'Fish locations, shadow sizes and seasonal access.',
    icon: Fish,
    accentClass: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
    summary: 'See where and when to catch every fish.'
  },
  {
    href: '/maps',
    label: 'Maps',
    description: 'Chest regions, room groupings and checklist details.',
    icon: Map,
    accentClass: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    summary: 'Track treasure chests and loot across all areas.'
  },
  {
    href: '/player',
    label: 'Player',
    description: 'Orders, requests, rune abilities, skills and trophies.',
    icon: Gamepad2,
    accentClass: 'border-sky-500/40 bg-sky-500/5 text-sky-400',
    summary: 'Review orders, requests, skills, abilities, and trophies.'
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
        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Rune Factory 4 Helper
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
            Your quick-reference guide for Rune Factory 4. Look up items, monsters, characters, festivals, maps, and more.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {categories.map(({ href, label, description, icon: Icon, accentClass, countKey }) => (
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
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
