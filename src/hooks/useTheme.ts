import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = localStorage.getItem('rf4-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeHydration() {
  return () => {};
}

/**
 * Custom hook to manage dark mode with localStorage persistence.
 * Reads the user's system preference on first load, then persists
 * their manual choice in localStorage under "rf4-theme".
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const isHydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = theme;
    localStorage.setItem('rf4-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isHydrated } as const;
}
