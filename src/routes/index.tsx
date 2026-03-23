import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
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
import { useCharacters, useItems, useMonsters } from '@/hooks/queries';

type CategoryCard = {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  summary: string;
  useCount?: 'items' | 'characters' | 'monsters';
};

const categories: CategoryCard[] = [
  {
    to: '/items',
    label: 'Items',
    description: 'Weapons, armor, crops, medicine and crafting sources.',
    icon: Package,
    accentClass: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400',
    summary: 'Search-heavy browser with crafting and stat details.',
    useCount: 'items',
  },
  {
    to: '/monsters',
    label: 'Monsters',
    description: 'Grouped variants, drops, resistances and taming info.',
    icon: Skull,
    accentClass: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
    summary: 'Bestiary split view with variant-aware details.',
    useCount: 'monsters',
  },
  {
    to: '/characters',
    label: 'Characters',
    description: 'Profiles, birthdays, gifts and battle information.',
    icon: Users,
    accentClass: 'border-pink-500/40 bg-pink-500/5 text-pink-400',
    summary: 'Companion profiles with rich support data.',
    useCount: 'characters',
  },
  {
    to: '/crafter',
    label: 'Crafter',
    description: 'Interactive loadout planner for inheritance, upgrades and food.',
    icon: Hammer,
    accentClass: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
    summary: 'Single-page build planner with live totals and craft steps.',
  },
  {
    to: '/calendar',
    label: 'Calendar',
    description: 'Festivals, birthdays, seasons and crop timing.',
    icon: CalendarDays,
    accentClass: 'border-violet-500/40 bg-violet-500/5 text-violet-400',
    summary: 'Season planner with event and crop context.',
  },
  {
    to: '/fishing',
    label: 'Fishing',
    description: 'Fish locations, shadow sizes and seasonal access.',
    icon: Fish,
    accentClass: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
    summary: 'Region-grouped fishing reference.',
  },
  {
    to: '/maps',
    label: 'Maps',
    description: 'Chest regions, room groupings and checklist details.',
    icon: Map,
    accentClass: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    summary: 'Treasure tracking by region and room.',
  },
  {
    to: '/player',
    label: 'Player',
    description: 'Orders, requests, rune abilities, skills and trophies.',
    icon: Gamepad2,
    accentClass: 'border-sky-500/40 bg-sky-500/5 text-sky-400',
    summary: 'Progression dashboard grouped by system.',
  },
];

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const { data: items } = useItems();
  const { data: characters } = useCharacters();
  const { data: monsters } = useMonsters();

  const counts = {
    items: items ? Object.keys(items).length : undefined,
    characters: characters ? Object.keys(characters).length : undefined,
    monsters: monsters ? Object.keys(monsters).length : undefined,
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/90 p-6 shadow-sm">
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
        {categories.map(({ to, label, description, icon: Icon, accentClass, summary, useCount }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border bg-card/90 p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`rounded-xl border px-3 py-3 ${accentClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              {useCount && counts[useCount] != null && (
                <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {counts[useCount]!.toLocaleString()}
                </div>
              )}
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
