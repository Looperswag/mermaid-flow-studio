import type { DiagramDirection, DiagramLayoutMode } from '@shared/diagram-customization';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

interface PreviewPaletteOption {
  id: string;
  label: string;
}

interface PreviewPanelProps {
  direction: DiagramDirection;
  layoutMode: DiagramLayoutMode;
  paletteId: string;
  palettes: PreviewPaletteOption[];
  previewRef: RefObject<HTMLDivElement | null>;
  scale: number;
  selectedNodeKey: string | null;
  selectedNodeText: string;
  svg: string | null;
  onDirectionChange: (direction: DiagramDirection) => void;
  onFit: () => void;
  onLayoutModeChange: (mode: DiagramLayoutMode) => void;
  onNodeLayoutChange: (
    nodeKey: string,
    position: { x: number; y: number },
    options: { commit: boolean },
  ) => void;
  onNodeSelect: (nodeKey: string | null) => void;
  onNodeTextApply: (nodeKey: string, text: string) => void;
  onPaletteChange: (paletteId: string) => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function parseViewBox(svg: SVGSVGElement) {
  const viewBox = svg.getAttribute('viewBox');
  if (!viewBox) {
    const width = Number.parseFloat(svg.getAttribute('width') ?? '0') || 0;
    const height = Number.parseFloat(svg.getAttribute('height') ?? '0') || 0;
    return { x: 0, y: 0, width, height };
  }

  const values = viewBox
    .split(/\s+/)
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (values.length !== 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: values[0],
    y: values[1],
    width: values[2],
    height: values[3],
  };
}

function findNodeFromPoint(container: HTMLDivElement, clientX: number, clientY: number) {
  const svg = container.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }

  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const viewBox = parseViewBox(svg);
  if (!viewBox.width || !viewBox.height) {
    return null;
  }

  const svgPoint = {
    x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
  };

  const nodes = [...svg.querySelectorAll<SVGGElement>('g.node[data-node-key]')];
  for (const node of nodes.reverse()) {
    const width = Number.parseFloat(node.getAttribute('data-node-width') ?? '0');
    const height = Number.parseFloat(node.getAttribute('data-node-height') ?? '0');
    const x = Number.parseFloat(node.getAttribute('data-node-x') ?? '0');
    const y = Number.parseFloat(node.getAttribute('data-node-y') ?? '0');

    if (
      svgPoint.x >= x - width / 2 &&
      svgPoint.x <= x + width / 2 &&
      svgPoint.y >= y - height / 2 &&
      svgPoint.y <= y + height / 2
    ) {
      return node;
    }
  }

  return null;
}

export function PreviewPanel({
  direction,
  layoutMode,
  paletteId,
  palettes,
  previewRef,
  scale,
  selectedNodeKey,
  selectedNodeText,
  svg,
  onDirectionChange,
  onFit,
  onLayoutModeChange,
  onNodeLayoutChange,
  onNodeSelect,
  onNodeTextApply,
  onPaletteChange,
  onReset,
  onZoomIn,
  onZoomOut,
}: PreviewPanelProps) {
  const dragStateRef = useRef<{
    nodeKey: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const dragCallbackRef = useRef(onNodeLayoutChange);
  const [nodeTextDraft, setNodeTextDraft] = useState(selectedNodeText);

  useEffect(() => {
    dragCallbackRef.current = onNodeLayoutChange;
  }, [onNodeLayoutChange]);

  useEffect(() => {
    setNodeTextDraft(selectedNodeText);
  }, [selectedNodeKey, selectedNodeText]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const nextPosition = {
        x: dragState.startX + (event.clientX - dragState.startClientX) / scale,
        y: dragState.startY + (event.clientY - dragState.startClientY) / scale,
      };

      dragCallbackRef.current(dragState.nodeKey, nextPosition, { commit: false });
    }

    function handlePointerUp(event: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const nextPosition = {
        x: dragState.startX + (event.clientX - dragState.startClientX) / scale,
        y: dragState.startY + (event.clientY - dragState.startClientY) / scale,
      };

      dragCallbackRef.current(dragState.nodeKey, nextPosition, { commit: true });
      dragStateRef.current = null;
    }

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [scale]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (layoutMode !== 'free' || event.button !== 0) {
      return;
    }

    const target = event.target;
    const directNode =
      target instanceof Element ? target.closest<SVGGElement>('g.node[data-node-key]') : null;
    const node = directNode ?? findNodeFromPoint(event.currentTarget, event.clientX, event.clientY);
    const nodeKey = node?.getAttribute('data-node-key');

    if (!node || !nodeKey) {
      onNodeSelect(null);
      return;
    }

    onNodeSelect(nodeKey);
    dragStateRef.current = {
      nodeKey,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: Number.parseFloat(node.getAttribute('data-node-x') ?? '0'),
      startY: Number.parseFloat(node.getAttribute('data-node-y') ?? '0'),
    };
    event.preventDefault();
  }

  return (
    <section className="preview-panel" aria-label="Diagram preview">
      <div className="preview-panel__toolbar">
        <div>
          <h2>Current graph</h2>
          <p>SVG preview stays crisp while you pan, zoom, and export.</p>
        </div>

        <div className="preview-panel__controls">
          <label className="preview-panel__control">
            <span>Palette</span>
            <select
              aria-label="Palette"
              className="preview-panel__select"
              value={paletteId}
              onChange={(event) => onPaletteChange(event.target.value)}
            >
              {palettes.map((palette) => (
                <option key={palette.id} value={palette.id}>
                  {palette.label}
                </option>
              ))}
            </select>
          </label>

          <label className="preview-panel__control">
            <span>Direction</span>
            <select
              aria-label="Direction"
              className="preview-panel__select"
              value={direction}
              onChange={(event) => onDirectionChange(event.target.value as DiagramDirection)}
            >
              <option value="down">Down</option>
              <option value="up">Up</option>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </label>

          <div
            className="preview-panel__control preview-panel__control--mode"
            role="radiogroup"
            aria-label="Layout mode"
          >
            <span>Layout mode</span>
            <div className="preview-panel__mode-toggle">
              <label className="preview-panel__mode-option">
                <input
                  checked={layoutMode === 'fixed'}
                  name="layout-mode"
                  type="radio"
                  value="fixed"
                  onChange={() => onLayoutModeChange('fixed')}
                />
                <span>Fixed</span>
              </label>
              <label className="preview-panel__mode-option">
                <input
                  checked={layoutMode === 'free'}
                  name="layout-mode"
                  type="radio"
                  value="free"
                  onChange={() => onLayoutModeChange('free')}
                />
                <span>Free</span>
              </label>
            </div>
          </div>

          <div className="preview-panel__actions">
            <button type="button" className="ghost-button" onClick={onZoomOut}>
              Zoom out
            </button>
            <button type="button" className="ghost-button" onClick={onZoomIn}>
              Zoom in
            </button>
            <button type="button" className="ghost-button" onClick={onReset}>
              100%
            </button>
            <button type="button" className="accent-button" onClick={onFit}>
              Fit to view
            </button>
          </div>
        </div>
      </div>

      {layoutMode === 'free' ? (
        <div className="preview-panel__editor">
          <div className="preview-panel__editor-copy">
            <h3>Free mode editor</h3>
            <p>
              {selectedNodeKey
                ? `Editing node ${selectedNodeKey}. Drag the node or update its text below.`
                : 'Click a node to drag it, then edit its text here.'}
            </p>
          </div>

          {selectedNodeKey ? (
            <div className="preview-panel__editor-form">
              <label className="preview-panel__control">
                <span>Node text</span>
                <input
                  aria-label="Node text"
                  className="preview-panel__input"
                  value={nodeTextDraft}
                  onChange={(event) => setNodeTextDraft(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="accent-button"
                onClick={() => onNodeTextApply(selectedNodeKey, nodeTextDraft)}
              >
                Apply text
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="preview-stage" ref={previewRef}>
        {svg ? (
          <div className="preview-stage__center">
            <div className="preview-stage__canvas" style={{ transform: `scale(${scale})` }}>
              <div
                className={`preview-stage__svg ${
                  layoutMode === 'free' ? 'preview-stage__svg--free' : ''
                }`}
                data-testid="diagram-preview"
                onPointerDownCapture={handlePointerDown}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        ) : (
          <div className="preview-stage__empty">
            <h3>Nothing rendered yet</h3>
            <p>Render a Mermaid flowchart to see the node graph here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
