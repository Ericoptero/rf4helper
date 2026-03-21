import { Link, Outlet } from '@tanstack/react-router';
import { Menu, Moon, Sun } from 'lucide-react';
import { appNavSections } from '@/lib/navigation';
import { useTheme } from '@/hooks/useTheme';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function AppShell() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:w-64 lg:flex-col lg:border-r lg:bg-card/85 lg:backdrop-blur">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                RF4
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Rune Factory 4</div>
                <div className="truncate text-xs text-muted-foreground">
                  Enchanted Codex
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background/60 transition-colors hover:bg-muted"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-6">
              {appNavSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <div className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="border-t px-4 py-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                L
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Lest</div>
                <div className="truncate text-xs text-muted-foreground">
                  Selphia helper
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <div className="border-b bg-card/80 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Open navigation menu"
                      className="shrink-0"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[88vw] max-w-sm p-0"
                  >
                    <SheetHeader className="border-b px-4 py-4 text-left">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>
                        Browse the Rune Factory 4 codex sections.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-3 py-4">
                        <nav className="space-y-6">
                          {appNavSections.map((section) => (
                            <div key={section.title} className="space-y-2">
                              <div className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {section.title}
                              </div>
                              <div className="space-y-1">
                                {section.items.map(({ to, label, icon: Icon }) => (
                                  <SheetClose asChild key={to}>
                                    <Link
                                      to={to}
                                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                                    >
                                      <Icon className="h-4 w-4" />
                                      <span>{label}</span>
                                    </Link>
                                  </SheetClose>
                                ))}
                              </div>
                            </div>
                          ))}
                        </nav>
                      </div>

                      <div className="border-t px-4 py-4">
                        <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            L
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">Lest</div>
                            <div className="truncate text-xs text-muted-foreground">
                              Selphia helper
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Link to="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                    RF4
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Rune Factory 4</div>
                    <div className="text-xs text-muted-foreground">Enchanted Codex</div>
                  </div>
                </Link>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background/60 transition-colors hover:bg-muted"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            </div>
          </div>

          <main className="min-w-0 flex-1 lg:pl-64">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
