import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import {
  CalendarDays,
  Fish,
  Map,
  Package,
  Users,
  Skull,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { useItems, useCharacters, useMonsters } from "@/hooks/queries";

interface CategoryCard {
  to: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  borderColor: string;
  iconColor: string;
  useCount?: string;
}

const categories: CategoryCard[] = [
  {
    to: "/items",
    label: "Items",
    description: "Browse weapons, armor, potions, crops, and more",
    icon: Package,
    gradient: "from-indigo-500/15 to-indigo-500/5",
    borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
    iconColor: "text-indigo-500",
    useCount: "items",
  },
  {
    to: "/monsters",
    label: "Bestiary",
    description: "Monster stats, drops, resistances, and taming info",
    icon: Skull,
    gradient: "from-orange-500/15 to-orange-500/5",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    iconColor: "text-orange-500",
    useCount: "monsters",
  },
  {
    to: "/characters",
    label: "Characters",
    description: "NPCs, gift preferences, and friendship data",
    icon: Users,
    gradient: "from-pink-500/15 to-pink-500/5",
    borderColor: "border-pink-500/20 hover:border-pink-500/40",
    iconColor: "text-pink-500",
    useCount: "characters",
  },
  {
    to: "/calendar",
    label: "Calendar",
    description: "Festivals, birthdays, and seasonal events",
    icon: CalendarDays,
    gradient: "from-emerald-500/15 to-emerald-500/5",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    iconColor: "text-emerald-500",
  },
  {
    to: "/fishing",
    label: "Fishing",
    description: "Fish locations, shadows, and selling prices",
    icon: Fish,
    gradient: "from-cyan-500/15 to-cyan-500/5",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    iconColor: "text-cyan-500",
  },
  {
    to: "/maps",
    label: "Maps",
    description: "Chest locations and region breakdowns",
    icon: Map,
    gradient: "from-amber-500/15 to-amber-500/5",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    iconColor: "text-amber-500",
  },
  {
    to: "/player",
    label: "Player",
    description: "Orders, requests, skills, abilities, and trophies",
    icon: Gamepad2,
    gradient: "from-purple-500/15 to-purple-500/5",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    iconColor: "text-purple-500",
  },
];

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: items } = useItems();
  const { data: characters } = useCharacters();
  const { data: monsters } = useMonsters();

  const counts: Record<string, number | undefined> = {
    items: items ? Object.keys(items).length : undefined,
    characters: characters ? Object.keys(characters).length : undefined,
    monsters: monsters ? Object.keys(monsters).length : undefined,
  };

  return (
    <div className="flex flex-col items-center gap-10 px-4 py-12 sm:py-16 md:py-20">
      {/* ─── Hero Section ─── */}
      <div className="text-center max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Enchanted Codex
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Rune Factory 4{" "}
          <span className="text-primary">Helper</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
          Your complete companion for items, monsters, characters, recipes, and
          more. Explore the world of Selphia.
        </p>
      </div>

      {/* ─── Category Cards Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-5xl">
        {categories.map(
          (
            { to, label, description, icon: Icon, gradient, borderColor, iconColor, useCount },
            idx
          ) => (
            <Link
              key={to}
              to={to}
              className={`group relative flex flex-col gap-3 p-5 rounded-xl border bg-linear-to-br ${gradient} ${borderColor} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 animate-card-in`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center ${iconColor} shadow-sm`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {useCount && counts[useCount] != null && (
                  <span className="text-xs font-bold text-muted-foreground bg-background/60 rounded-full px-2.5 py-0.5">
                    {counts[useCount]!.toLocaleString()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold group-hover:text-primary transition-colors">
                  {label}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {description}
                </p>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
