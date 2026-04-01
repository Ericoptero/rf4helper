'use client';

import { type ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Menu, Moon, Sun } from 'lucide-react';

import { appNavSections } from '@/lib/navigation';
import { useTheme } from '@/hooks/useTheme';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { appSurfaceClassNames } from '@/lib/catalogPresentation';
import { cn } from '@/lib/utils';

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  className,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  className?: string;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      data-status={active ? 'active' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function ThemeToggleButton({
  theme,
  toggleTheme,
  isHydrated,
}: {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isHydrated: boolean;
}) {
  const ariaLabel = isHydrated
    ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
    : 'Toggle color theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background/60 transition-colors hover:bg-muted"
      aria-label={ariaLabel}
    >
      {isHydrated ? (
        theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-600" />
        )
      ) : (
        <span
          aria-hidden="true"
          className="block h-4 w-4 rounded-full bg-muted-foreground/40"
        />
      )}
    </button>
  );
}

function BrandLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <img
      src="/brand/barrett-logo.png"
      alt="Barrett logo"
      className={mobile ? 'h-10 w-auto shrink-0' : 'h-12 w-auto shrink-0'}
    />
  );
}

function SidebarFooter() {
  return (
    <a
      href="https://github.com/Ericoptero/rf4helper"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Github className="h-5 w-5 shrink-0" />
      <span className="truncate text-sm font-medium">Ericoptero/rf4helper</span>
    </a>
  );
}

function NavigationContent({
  pathname,
  itemClassName,
  renderItem,
}: {
  pathname: string;
  itemClassName: string;
  renderItem?: (item: ReactNode, key: string) => ReactNode;
}) {
  return (
    <nav className="space-y-6">
      {appNavSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <div className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {section.title}
          </div>
          <div className="space-y-1">
            {section.items.map(({ to, label, icon }) => {
              const navItem = (
                <NavItem
                  key={to}
                  href={to}
                  label={label}
                  icon={icon}
                  pathname={pathname}
                  className={itemClassName}
                />
              );

              return renderItem ? renderItem(navItem, to) : navItem;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { theme, toggleTheme, isHydrated } = useTheme();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <aside
          className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:w-64 lg:flex-col ${appSurfaceClassNames.sidebar}`}
        >
          <div className="flex items-center justify-between border-b px-4 py-4">
            <Link href="/" className="flex items-center">
              <BrandLogo />
            </Link>
            <ThemeToggleButton
              theme={theme}
              toggleTheme={toggleTheme}
              isHydrated={isHydrated}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavigationContent pathname={pathname} itemClassName="px-3 py-2.5" />
          </div>

          <div className="border-t px-4 py-4">
            <SidebarFooter />
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
                    className={`w-[88vw] max-w-sm p-0 ${appSurfaceClassNames.drawer}`}
                  >
                    <SheetHeader className="border-b px-4 py-4 text-left">
                      <SheetTitle>Navigation</SheetTitle>
                      <SheetDescription>
                        Browse the Rune Factory 4 codex sections.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-1 flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-3 py-4">
                        <NavigationContent
                          pathname={pathname}
                          itemClassName="px-3 py-3"
                          renderItem={(item, key) => (
                            <SheetClose asChild key={key}>
                              {item}
                            </SheetClose>
                          )}
                        />
                      </div>

                      <div className="border-t px-4 py-4">
                        <SidebarFooter />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center">
                  <BrandLogo mobile />
                </Link>
              </div>

              <ThemeToggleButton
                theme={theme}
                toggleTheme={toggleTheme}
                isHydrated={isHydrated}
              />
            </div>
          </div>

          <main className="min-w-0 flex-1 lg:pl-64">{children}</main>
        </div>
      </div>
    </div>
  );
}
