import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia(query);
      const handleChange = () => {
        onStoreChange();
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    },
    getSnapshot,
    () => false,
  );
}
