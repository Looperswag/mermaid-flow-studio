import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

interface UseResizableSplitOptions {
  /** The split container; its width defines the draggable range. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Smallest fraction the left pane may occupy. */
  min?: number;
  /** Largest fraction the left pane may occupy. */
  max?: number;
  /** Initial fraction (overridden by a persisted value if present). */
  defaultRatio?: number;
  /** localStorage key for persistence; omit to disable persistence. */
  storageKey?: string;
}

export interface ResizableSplit {
  /** Left-pane width as a fraction of the container (0–1). */
  ratio: number;
  isDragging: boolean;
  /** Spread onto the divider element to make it draggable and keyboard-accessible. */
  separatorProps: {
    role: 'separator';
    tabIndex: 0;
    'aria-orientation': 'vertical';
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-valuenow': number;
    onPointerDown: (event: ReactPointerEvent) => void;
    onKeyDown: (event: ReactKeyboardEvent) => void;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readStored(storageKey: string | undefined, fallback: number): number {
  if (!storageKey || typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw === null ? NaN : Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function useResizableSplit({
  containerRef,
  min = 0.24,
  max = 0.6,
  defaultRatio = 0.34,
  storageKey,
}: UseResizableSplitOptions): ResizableSplit {
  const [ratio, setRatio] = useState(() => clamp(readStored(storageKey, defaultRatio), min, max));
  const [isDragging, setIsDragging] = useState(false);

  const persist = useCallback(
    (value: number) => {
      if (!storageKey || typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(storageKey, value.toFixed(4));
      } catch {
        // Storage may be unavailable (private mode); ignore.
      }
    },
    [storageKey],
  );

  const ratioFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) {
        return ratio;
      }
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) {
        return ratio;
      }
      return clamp((clientX - rect.left) / rect.width, min, max);
    },
    [containerRef, ratio, min, max],
  );

  // Holds the active drag's window listeners so they can always be detached —
  // on drag end AND on unmount (guarding against an unmount mid-drag leak).
  const dragListenersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);

  const detachDragListeners = useCallback(() => {
    if (dragListenersRef.current) {
      window.removeEventListener('pointermove', dragListenersRef.current.move);
      window.removeEventListener('pointerup', dragListenersRef.current.up);
      dragListenersRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault();
      setIsDragging(true);

      const move = (pointer: PointerEvent) => {
        setRatio(ratioFromClientX(pointer.clientX));
      };
      const up = () => {
        detachDragListeners();
        setIsDragging(false);
        setRatio((current) => {
          persist(current);
          return current;
        });
      };

      dragListenersRef.current = { move, up };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [ratioFromClientX, persist, detachDragListeners],
  );

  // Detach any in-flight drag listeners on unmount (no setState — safe post-unmount).
  useEffect(() => detachDragListeners, [detachDragListeners]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      const step = event.shiftKey ? 0.05 : 0.02;
      let next: number | null = null;
      if (event.key === 'ArrowLeft') {
        next = clamp(ratio - step, min, max);
      } else if (event.key === 'ArrowRight') {
        next = clamp(ratio + step, min, max);
      } else if (event.key === 'Home') {
        next = min;
      } else if (event.key === 'End') {
        next = max;
      }
      if (next !== null) {
        event.preventDefault();
        setRatio(next);
        persist(next);
      }
    },
    [ratio, min, max, persist],
  );

  // Keep the persisted/initial ratio within bounds if min/max change.
  useEffect(() => {
    setRatio((current) => clamp(current, min, max));
  }, [min, max]);

  return {
    ratio,
    isDragging,
    separatorProps: {
      role: 'separator',
      tabIndex: 0,
      'aria-orientation': 'vertical',
      'aria-valuemin': Math.round(min * 100),
      'aria-valuemax': Math.round(max * 100),
      'aria-valuenow': Math.round(ratio * 100),
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
    },
  };
}
