import React from 'react';
import type { DetailEntityReference } from './detailTypes';
import { useDetailDrawerHistory } from './useDetailDrawerHistory';

type DetailDrawerContextValue = {
  current: DetailEntityReference | null;
  canGoBack: boolean;
  openRoot: (entry: DetailEntityReference) => void;
  openLinked: (entry: DetailEntityReference) => void;
  back: () => void;
  close: () => void;
};

const DetailDrawerContext = React.createContext<DetailDrawerContextValue | null>(null);

export function DetailDrawerProvider({
  detailReference,
  onDetailReferenceChange,
  children,
}: {
  detailReference?: DetailEntityReference | null;
  onDetailReferenceChange: (reference: DetailEntityReference | null) => void;
  children: React.ReactNode;
}) {
  const history = useDetailDrawerHistory();
  const internalNavigationRef = React.useRef(false);

  React.useEffect(() => {
    if (internalNavigationRef.current) {
      internalNavigationRef.current = false;
      return;
    }

    const current = history.current;
    const next = detailReference ?? null;

    if (current?.type === next?.type && current?.id === next?.id) {
      return;
    }

    history.syncTo(next);
  }, [detailReference, history]);

  const value: DetailDrawerContextValue = {
    current: history.current,
    canGoBack: history.canGoBack,
    openRoot: (entry) => {
      history.openRoot(entry);
      internalNavigationRef.current = true;
      onDetailReferenceChange(entry);
    },
    openLinked: (entry) => {
      history.openLinked(entry);
      internalNavigationRef.current = true;
      onDetailReferenceChange(entry);
    },
    back: () => {
      const previous = history.stack.at(-2) ?? null;
      history.back();
      internalNavigationRef.current = true;
      onDetailReferenceChange(previous);
    },
    close: () => {
      history.close();
      internalNavigationRef.current = true;
      onDetailReferenceChange(null);
    },
  };

  return <DetailDrawerContext.Provider value={value}>{children}</DetailDrawerContext.Provider>;
}

export function useDetailDrawer() {
  const context = React.useContext(DetailDrawerContext);

  if (!context) {
    throw new Error('useDetailDrawer must be used within DetailDrawerProvider');
  }

  return context;
}
