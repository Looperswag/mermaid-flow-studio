import type { RefObject } from 'react';

import type { ZoomMode } from '../hooks/usePanZoom';

interface PreviewPanelProps {
  previewRef: RefObject<HTMLDivElement | null>;
  svg: string | null;
  scale: number;
  offset: { x: number; y: number };
  mode: ZoomMode;
  isStale: boolean;
  errorMessage?: string | null;
  canCopy: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onCopySvg: () => void;
  onCopyImage: () => void;
}

export function PreviewPanel({
  previewRef,
  svg,
  scale,
  offset,
  mode,
  isStale,
  errorMessage,
  canCopy,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  onCopySvg,
  onCopyImage,
}: PreviewPanelProps) {
  return (
    <section className="preview-panel" aria-label="Diagram preview">
      <div className="preview-panel__toolbar">
        <div className="preview-panel__heading">
          <h2>Current graph</h2>
          <p>滚轮缩放 · 拖拽平移 · Fit 跟随窗口自适应{isStale ? ' · 预览为上一次成功结果' : ''}</p>
        </div>

        <div className="preview-panel__actions">
          <span className="preview-panel__zoom" data-testid="zoom-level">
            {Math.round(scale * 100)}%
          </span>
          <button type="button" className="ghost-button" onClick={onZoomOut} aria-label="Zoom out">
            −
          </button>
          <button type="button" className="ghost-button" onClick={onZoomIn} aria-label="Zoom in">
            +
          </button>
          <button type="button" className="ghost-button" onClick={onReset}>
            100%
          </button>
          <button
            type="button"
            className={mode === 'fit' ? 'accent-button' : 'ghost-button'}
            onClick={onFit}
          >
            Fit
          </button>
          <span className="preview-panel__sep" aria-hidden="true" />
          <button
            type="button"
            className="ghost-button"
            onClick={onCopySvg}
            disabled={!canCopy}
            title="复制 SVG 矢量源码（粘贴为文本，可被支持 SVG 的应用解析）"
          >
            Copy SVG
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onCopyImage}
            disabled={!canCopy}
            title="复制 PNG 图片（可直接粘贴进 PPT / 文档）"
          >
            Copy image
          </button>
        </div>
      </div>

      <div className="preview-stage" ref={previewRef} data-mode={mode}>
        {errorMessage ? (
          <p className="preview-stage__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {svg ? (
          <div
            className="preview-stage__canvas"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            <div
              className="preview-stage__svg"
              data-testid="diagram-preview"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ) : (
          <div className="preview-stage__empty">
            <h3>Nothing rendered yet</h3>
            <p>编辑左侧 Mermaid 代码即可在此实时看到流程图。</p>
          </div>
        )}
      </div>
    </section>
  );
}
