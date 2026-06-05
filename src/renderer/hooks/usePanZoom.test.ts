import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePanZoom } from './usePanZoom';

// Stable references so the fit effect runs once — a fresh containerRef or dimensions
// object per render would churn the effects (matching how useRef behaves in the app).
const dims = { width: 200, height: 100 };

describe('usePanZoom', () => {
  it('zooms in/out, switches to manual mode, and clamps scale to bounds', () => {
    const containerRef = { current: document.createElement('div') };
    const { result } = renderHook(() => usePanZoom({ containerRef, dimensions: dims }));

    const initial = result.current.scale;
    act(() => result.current.zoomIn());
    expect(result.current.scale).toBeGreaterThan(initial);
    expect(result.current.mode).toBe('manual');

    act(() => {
      for (let i = 0; i < 40; i += 1) {
        result.current.zoomIn();
      }
    });
    expect(result.current.scale).toBeLessThanOrEqual(4);

    act(() => {
      for (let i = 0; i < 60; i += 1) {
        result.current.zoomOut();
      }
    });
    expect(result.current.scale).toBeGreaterThanOrEqual(0.2);
  });

  it('reset returns to 100% and fit switches back to fit mode', () => {
    const containerRef = { current: document.createElement('div') };
    const { result } = renderHook(() => usePanZoom({ containerRef, dimensions: dims }));

    act(() => result.current.reset());
    expect(result.current.scale).toBe(1);
    expect(result.current.mode).toBe('manual');

    act(() => result.current.fit());
    expect(result.current.mode).toBe('fit');
  });
});
