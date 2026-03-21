import { useCallback, useMemo, useState } from 'react';
import type { DetailEntityReference } from './detailTypes';

export function useDetailDrawerHistory(initialEntry: DetailEntityReference | null = null) {
  const [stack, setStack] = useState<DetailEntityReference[]>(initialEntry ? [initialEntry] : []);

  const current = stack.at(-1) ?? null;
  const canGoBack = stack.length > 1;

  const openRoot = useCallback((entry: DetailEntityReference) => {
    setStack([entry]);
  }, []);

  const openLinked = useCallback((entry: DetailEntityReference) => {
    setStack((previous) => {
      if (previous.length === 0) {
        return [entry];
      }

      return [...previous, entry];
    });
  }, []);

  const back = useCallback(() => {
    setStack((previous) => (previous.length > 1 ? previous.slice(0, -1) : previous));
  }, []);

  const close = useCallback(() => {
    setStack([]);
  }, []);

  const syncTo = useCallback((entry: DetailEntityReference | null) => {
    setStack(entry ? [entry] : []);
  }, []);

  return useMemo(
    () => ({
      stack,
      current,
      canGoBack,
      openRoot,
      openLinked,
      back,
      close,
      syncTo,
    }),
    [back, canGoBack, close, current, openLinked, openRoot, stack, syncTo],
  );
}
