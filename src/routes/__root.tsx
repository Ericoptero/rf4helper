import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import {
  Home,
  CalendarDays,
  Fish,
  Map,
  Package,
  Users,
  Skull,
  Gamepad2,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/fishing", label: "Fishing", icon: Fish },
  { to: "/maps", label: "Maps", icon: Map },
  { to: "/items", label: "Items", icon: Package },
  { to: "/characters", label: "Characters", icon: Users },
  { to: "/monsters", label: "Monsters", icon: Skull },
  { to: "/player", label: "Player", icon: Gamepad2 },
] as const;

const RootLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* ─── Top Navigation Bar ─── */}
        <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg supports-backdrop-filter:bg-card/60">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-4 h-14">
            {/* Logo / Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm group-hover:shadow-md transition-shadow">
                RF4
              </div>
              <span className="text-lg font-bold hidden sm:inline tracking-tight">
                Rune Factory 4 Helper
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap [&.active]:text-primary [&.active]:bg-primary/10 [&.active]:animate-nav-pill"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors shrink-0 cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </header>

        {/* ─── Page Content ─── */}
        <main className="flex-1 max-w-screen-2xl mx-auto w-full">
          <Outlet />
        </main>

        {/* ─── Dev tools (development only) ─── */}
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </div>
    </TooltipProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
