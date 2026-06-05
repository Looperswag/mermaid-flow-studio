import { useRef, type CSSProperties, type ReactNode } from 'react';

import { useResizableSplit } from '../hooks/useResizableSplit';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  storageKey?: string;
}

/**
 * Two-pane layout with a draggable, keyboard-accessible divider. The left-pane width is
 * driven by the `--split` CSS custom property so the panes stay fluid within the window.
 */
export function SplitPane({ left, right, storageKey }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ratio, isDragging, separatorProps } = useResizableSplit({
    containerRef,
    storageKey,
  });

  const style = { '--split': `${(ratio * 100).toFixed(2)}%` } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`workspace ${isDragging ? 'workspace--dragging' : ''}`}
      style={style}
    >
      <div className="workspace__column workspace__column--chat">{left}</div>
      <div
        className="workspace__divider"
        aria-label="Resize panels"
        title="拖拽调整分栏 · 方向键微调"
        {...separatorProps}
      >
        <span className="workspace__divider-grip" aria-hidden="true" />
      </div>
      <div className="workspace__column workspace__column--preview">{right}</div>
    </div>
  );
}
