import React from 'react';
import { decodeDetailEntity, encodeDetailEntity, type DetailEntityReference } from './detailTypes';
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
  detailValue,
  onDetailValueChange,
  children,
}: {
  detailValue?: string;
  onDetailValueChange: (value?: string) => void;
  children: React.ReactNode;
}) {
  const history = useDetailDrawerHistory();
  const internalNavigationRef = React.useRef(false);
  const currentEncoded = history.current ? encodeDetailEntity(history.current) : undefined;

  React.useEffect(() => {
    if (internalNavigationRef.current) {
      internalNavigationRef.current = false;
      return;
    }

    const decoded = decodeDetailEntity(detailValue);
    const encoded = decoded ? encodeDetailEntity(decoded) : undefined;

    if (encoded === currentEncoded) {
      return;
    }

    history.syncTo(decoded);
  }, [currentEncoded, detailValue, history]);

  const value = React.useMemo<DetailDrawerContextValue>(() => {
    return {
      current: history.current,
      canGoBack: history.canGoBack,
      openRoot: (entry) => {
        history.openRoot(entry);
        internalNavigationRef.current = true;
        onDetailValueChange(encodeDetailEntity(entry));
      },
      openLinked: (entry) => {
        history.openLinked(entry);
        internalNavigationRef.current = true;
        onDetailValueChange(encodeDetailEntity(entry));
      },
      back: () => {
        const previous = history.stack.at(-2) ?? null;
        history.back();
        internalNavigationRef.current = true;
        onDetailValueChange(previous ? encodeDetailEntity(previous) : undefined);
      },
      close: () => {
        history.close();
        internalNavigationRef.current = true;
        onDetailValueChange(undefined);
      },
    };
  }, [history, onDetailValueChange]);

  return <DetailDrawerContext.Provider value={value}>{children}</DetailDrawerContext.Provider>;
}

export function useDetailDrawer() {
  const context = React.useContext(DetailDrawerContext);

  if (!context) {
    throw new Error('useDetailDrawer must be used within DetailDrawerProvider');
  }

  return context;
}
