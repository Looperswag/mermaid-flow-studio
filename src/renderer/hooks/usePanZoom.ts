import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { SvgDimensions } from '../lib/renderMermaid';

export type ZoomMode = 'fit' | 'manual';

interface Offset {
  x: number;
  y: number;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
const FIT_PADDING = 48;

function clampScale(value: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

interface UsePanZoomOptions {
  /** The scroll/viewport container the diagram is rendered inside. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Natural dimensions of the current diagram, or null when nothing is rendered. */
  dimensions: SvgDimensions | null;
}

export interface PanZoom {
  scale: number;
  offset: Offset;
  mode: ZoomMode;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
}

/**
 * Owns scale + translate state for the preview, and wires cursor-anchored wheel zoom,
 * pointer-drag panning, and ResizeObserver-driven auto-fit directly onto the container.
 * In `fit` mode the diagram re-centers whenever the container or diagram size changes —
 * this is what makes the layout track the window.
 */
export function usePanZoom({ containerRef, dimensions }: UsePanZoomOptions): PanZoom {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [mode, setMode] = useState<ZoomMode>('fit');

  // Mirror state into refs so the imperative event handlers always read fresh values.
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const dimsRef = useRef(dimensions);
  dimsRef.current = dimensions;

  const computeFit = useCallback(() => {
    const container = containerRef.current;
    const dims = dimsRef.current;
    if (!container || !dims) {
      return null;
    }

    const availW = Math.max(container.clientWidth - FIT_PADDING * 2, 40);
    const availH = Math.max(container.clientHeight - FIT_PADDING * 2, 40);
    const next = clampScale(Math.min(availW / dims.width, availH / dims.height, 1.5));
    return {
      scale: next,
      offset: {
        x: (container.clientWidth - dims.width * next) / 2,
        y: (container.clientHeight - dims.height * next) / 2,
      },
    };
  }, [containerRef]);

  const applyFit = useCallback(() => {
    const next = computeFit();
    if (!next) {
      return;
    }
    setScale(next.scale);
    setOffset(next.offset);
    setMode('fit');
  }, [computeFit]);

  const zoomAround = useCallback(
    (factor: number, anchorX: number, anchorY: number) => {
      const current = scaleRef.current;
      const next = clampScale(current * factor);
      if (next === current) {
        return;
      }
      const off = offsetRef.current;
      const pointX = (anchorX - off.x) / current;
      const pointY = (anchorY - off.y) / current;
      setOffset({ x: anchorX - pointX * next, y: anchorY - pointY * next });
      setScale(next);
      setMode('manual');
    },
    [],
  );

  const zoomByButton = useCallback(
    (factor: number) => {
      const container = containerRef.current;
      const anchorX = container ? container.clientWidth / 2 : 0;
      const anchorY = container ? container.clientHeight / 2 : 0;
      zoomAround(factor, anchorX, anchorY);
    },
    [containerRef, zoomAround],
  );

  const zoomIn = useCallback(() => zoomByButton(1.15), [zoomByButton]);
  const zoomOut = useCallback(() => zoomByButton(1 / 1.15), [zoomByButton]);

  const reset = useCallback(() => {
    const container = containerRef.current;
    const dims = dimsRef.current;
    if (container && dims) {
      setOffset({
        x: (container.clientWidth - dims.width) / 2,
        y: (container.clientHeight - dims.height) / 2,
      });
    } else {
      setOffset({ x: 0, y: 0 });
    }
    setScale(1);
    setMode('manual');
  }, [containerRef]);

  // Re-fit when a new diagram renders (different dimensions) while in fit mode.
  // Depend on primitive width/height — not the object identity — so a caller passing a
  // fresh `dimensions` object on every render can't trigger a setState→re-render loop.
  useEffect(() => {
    if (modeRef.current !== 'fit') {
      return;
    }
    const next = computeFit();
    if (next) {
      setScale(next.scale);
      setOffset(next.offset);
    }
  }, [dimensions?.width, dimensions?.height, computeFit]);

  // ResizeObserver: track container size changes and re-fit (debounced via rAF).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (modeRef.current !== 'fit') {
          return;
        }
        const next = computeFit();
        if (next) {
          setScale(next.scale);
          setOffset(next.offset);
        }
      });
    });

    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [containerRef, computeFit]);

  // Cursor-anchored wheel zoom (non-passive so we can preventDefault page scroll).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.0015);
      zoomAround(factor, event.clientX - rect.left, event.clientY - rect.top);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, zoomAround]);

  // Pointer-drag panning.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startOffset: Offset = { x: 0, y: 0 };

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startOffset = offsetRef.current;
      container.setPointerCapture(event.pointerId);
      container.classList.add('is-grabbing');
    };

    const handleMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (modeRef.current !== 'manual' && (dx !== 0 || dy !== 0)) {
        setMode('manual');
      }
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const handleUp = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      dragging = false;
      try {
        container.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer may already be released; ignore.
      }
      container.classList.remove('is-grabbing');
    };

    container.addEventListener('pointerdown', handleDown);
    container.addEventListener('pointermove', handleMove);
    container.addEventListener('pointerup', handleUp);
    container.addEventListener('pointercancel', handleUp);
    return () => {
      container.removeEventListener('pointerdown', handleDown);
      container.removeEventListener('pointermove', handleMove);
      container.removeEventListener('pointerup', handleUp);
      container.removeEventListener('pointercancel', handleUp);
    };
  }, [containerRef]);

  return { scale, offset, mode, zoomIn, zoomOut, reset, fit: applyFit };
}
