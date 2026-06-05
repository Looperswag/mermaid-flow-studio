import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useResizableSplit } from './useResizableSplit';

function makeContainerRef() {
  return { current: document.createElement('div') };
}

// The keyboard handler only needs `key`, `shiftKey`, and `preventDefault`.
function key(name: string, shiftKey = false) {
  return { key: name, shiftKey, preventDefault: () => {} } as never;
}

describe('useResizableSplit', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clamps the initial ratio into the allowed range', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ containerRef: makeContainerRef(), defaultRatio: 0.95, max: 0.6 }),
    );
    expect(result.current.ratio).toBeCloseTo(0.6, 5);
  });

  it('nudges the ratio with arrow keys and clamps at the bounds', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ containerRef: makeContainerRef(), defaultRatio: 0.34 }),
    );

    act(() => result.current.separatorProps.onKeyDown(key('ArrowRight')));
    expect(result.current.ratio).toBeCloseTo(0.36, 5);

    act(() => result.current.separatorProps.onKeyDown(key('Home')));
    expect(result.current.ratio).toBeCloseTo(0.24, 5);
  });

  it('persists the ratio to localStorage when a storage key is provided', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ containerRef: makeContainerRef(), defaultRatio: 0.34, storageKey: 'mfs:test' }),
    );

    act(() => result.current.separatorProps.onKeyDown(key('ArrowRight')));
    expect(Number.parseFloat(window.localStorage.getItem('mfs:test') ?? '')).toBeCloseTo(0.36, 5);
  });
});
