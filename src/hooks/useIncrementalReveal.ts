"use client"

import * as React from 'react';

type UseIncrementalRevealOptions = {
  itemCount: number;
  batchSize: number;
  resetKeys?: readonly unknown[];
  rootElement?: Element | null;
  disabled?: boolean;
};

export function useIncrementalReveal<TElement extends Element = HTMLDivElement>({
  itemCount,
  batchSize,
  resetKeys = [],
  rootElement,
  disabled = false,
}: UseIncrementalRevealOptions) {
  const [sentinelElement, setSentinelElement] = React.useState<TElement | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(() => Math.min(itemCount, batchSize));
  const resetSignature = React.useMemo(() => JSON.stringify(resetKeys), [resetKeys]);
  const batchSizeRef = React.useRef(batchSize);

  React.useEffect(() => {
    batchSizeRef.current = batchSize;
  }, [batchSize]);

  const sentinelRef = React.useCallback((node: TElement | null) => {
    setSentinelElement(node);
  }, []);

  React.useEffect(() => {
    setVisibleCount(Math.min(itemCount, batchSizeRef.current));
  }, [itemCount, resetSignature]);

  const loadMore = React.useCallback(() => {
    setVisibleCount((current) => {
      if (current >= itemCount) {
        return current;
      }

      return Math.min(itemCount, current + batchSize);
    });
  }, [batchSize, itemCount]);

  React.useEffect(() => {
    if (disabled || visibleCount >= itemCount || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    if (!sentinelElement) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      {
        root: rootElement ?? null,
        rootMargin: '160px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(sentinelElement);

    return () => observer.disconnect();
  }, [disabled, itemCount, loadMore, rootElement, sentinelElement, visibleCount]);

  return {
    hasMore: visibleCount < itemCount,
    sentinelRef,
    visibleCount,
  };
}
