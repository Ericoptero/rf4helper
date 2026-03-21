import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Fish,
  Gamepad2,
  Home,
  Map,
  Package,
  Skull,
  Users,
} from 'lucide-react';

export type AppNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type AppNavSection = {
  title: string;
  items: AppNavItem[];
};

export const appNavSections: AppNavSection[] = [
  {
    title: 'Codex',
    items: [
      { to: '/', label: 'Home', icon: Home },
      { to: '/items', label: 'Items', icon: Package },
      { to: '/characters', label: 'Characters', icon: Users },
      { to: '/monsters', label: 'Monsters', icon: Skull },
      { to: '/fishing', label: 'Fishing', icon: Fish },
      { to: '/maps', label: 'Maps', icon: Map },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Progress',
    items: [{ to: '/player', label: 'Player', icon: Gamepad2 }],
  },
];
