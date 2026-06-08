import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { fitScaleToContainer } from '../lib/previewFit';
import type { SvgDimensions } from '../lib/renderMermaid';

function clampScale(value: number): number {
  return Math.max(0.25, Math.min(20, value));
}

interface ZoomTarget {
  dimensions: SvgDimensions;
}

export interface UsePreviewZoomResult {
  scale: number;
  previewRef: RefObject<HTMLDivElement | null>;
  fitMode: boolean;
  setFitMode: (value: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;
}

/**
 * Owns preview zoom/fit state. While `fitMode` is on, the diagram auto-fits to the
 * container and re-fits on window/pane resize; any manual zoom turns fit off.
 */
export function usePreviewZoom(preview: ZoomTarget | null): UsePreviewZoomResult {
  const [scale, setScale] = useState(1);
  // True while the preview should auto-fit (follows window/diagram); a manual zoom turns it off.
  const [fitMode, setFitModeState] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Refs mirrored from state/props for the ResizeObserver callback.
  const fitModeRef = useRef(fitMode);
  fitModeRef.current = fitMode;
  const previewDimsRef = useRef<SvgDimensions | null>(null);
  previewDimsRef.current = preview?.dimensions ?? null;

  // Auto-fit when a new diagram renders, but only while the user hasn't manually zoomed.
  useEffect(() => {
    if (!preview || !fitMode) {
      return;
    }
    setScale(fitScaleToContainer(previewRef.current, preview.dimensions));
  }, [preview, fitMode]);

  // Track container size and re-fit on window/pane resize while in fit mode.
  useEffect(() => {
    const container = previewRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!fitModeRef.current || !previewDimsRef.current) {
          return;
        }
        setScale(fitScaleToContainer(container, previewDimsRef.current));
      });
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const setFitMode = useCallback((value: boolean) => {
    setFitModeState(value);
  }, []);

  const zoomIn = useCallback(() => {
    setFitModeState(false);
    setScale((current) => clampScale(current + 0.1));
  }, []);

  const zoomOut = useCallback(() => {
    setFitModeState(false);
    setScale((current) => clampScale(current - 0.1));
  }, []);

  const resetZoom = useCallback(() => {
    setFitModeState(false);
    setScale(1);
  }, []);

  const fitToView = useCallback(() => {
    setFitModeState(true);
  }, []);

  return { scale, previewRef, fitMode, setFitMode, zoomIn, zoomOut, resetZoom, fitToView };
}
