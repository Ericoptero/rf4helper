import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIncrementalReveal } from './useIncrementalReveal';

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  private readonly callback: IntersectionObserverCallback;
  private readonly observedElements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? '';
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0];
    MockIntersectionObserver.instances.push(this);
  }

  disconnect() {
    this.observedElements.clear();
  }

  observe(element: Element) {
    this.observedElements.add(element);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  static trigger(element: Element, isIntersecting = true) {
    for (const observer of MockIntersectionObserver.instances) {
      if (!observer.observedElements.has(element)) {
        continue;
      }

      observer.callback(
        [
          {
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRatio: isIntersecting ? 1 : 0,
            intersectionRect: isIntersecting ? element.getBoundingClientRect() : new DOMRectReadOnly(),
            isIntersecting,
            rootBounds: null,
            target: element,
            time: Date.now(),
          } satisfies IntersectionObserverEntry,
        ],
        observer,
      );
    }
  }

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

function IncrementalRevealProbe({
  itemCount,
  batchSize,
  disabled = false,
  resetKeys = [],
  renderSentinel = true,
}: {
  itemCount: number;
  batchSize: number;
  disabled?: boolean;
  resetKeys?: readonly unknown[];
  renderSentinel?: boolean;
}) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { hasMore, sentinelRef, visibleCount } = useIncrementalReveal<HTMLDivElement>({
    itemCount,
    batchSize,
    disabled,
    resetKeys,
    rootRef,
  });

  return (
    <div ref={rootRef}>
      <div data-testid="visible-count">{visibleCount}</div>
      <div data-testid="has-more">{String(hasMore)}</div>
      {renderSentinel ? <div ref={sentinelRef} data-testid="sentinel" /> : null}
    </div>
  );
}

describe('useIncrementalReveal', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reveals items in batches and caps the total count when intersections keep firing', () => {
    render(<IncrementalRevealProbe itemCount={50} batchSize={24} />);

    expect(screen.getByTestId('visible-count')).toHaveTextContent('24');
    expect(screen.getByTestId('has-more')).toHaveTextContent('true');

    const sentinel = screen.getByTestId('sentinel');

    act(() => {
      MockIntersectionObserver.trigger(sentinel);
      MockIntersectionObserver.trigger(sentinel);
      MockIntersectionObserver.trigger(sentinel);
    });

    expect(screen.getByTestId('visible-count')).toHaveTextContent('50');
    expect(screen.getByTestId('has-more')).toHaveTextContent('false');
  });

  it('does not start observing when disabled or when the sentinel is absent', () => {
    const { rerender } = render(<IncrementalRevealProbe itemCount={50} batchSize={24} disabled />);

    expect(MockIntersectionObserver.instances).toHaveLength(0);

    rerender(<IncrementalRevealProbe itemCount={50} batchSize={24} renderSentinel={false} />);

    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('resets the visible count when the reset keys change', () => {
    const { rerender } = render(<IncrementalRevealProbe itemCount={50} batchSize={24} resetKeys={['a']} />);

    const sentinel = screen.getByTestId('sentinel');

    act(() => {
      MockIntersectionObserver.trigger(sentinel);
    });

    expect(screen.getByTestId('visible-count')).toHaveTextContent('48');

    rerender(<IncrementalRevealProbe itemCount={50} batchSize={24} resetKeys={['broadsword']} />);

    expect(screen.getByTestId('visible-count')).toHaveTextContent('24');
  });
});
