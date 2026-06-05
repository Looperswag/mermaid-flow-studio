import { useCallback, useEffect, useRef, useState } from 'react';

import { formatError, statusFrom, type AppStatus } from '../lib/status';
import { renderMermaid, type DiagramTheme, type RenderedDiagram } from '../lib/renderMermaid';
import { validateMermaid } from '../lib/validateMermaid';

type RenderMode = 'auto' | 'manual';

interface UseMermaidRendererOptions {
  /** Current editor source. The hook auto-renders (debounced) whenever this changes. */
  source: string;
  /** Diagram theme. Changing it re-renders the current source so colors stay in sync. */
  theme?: DiagramTheme;
  /** Debounce window for auto-render after the source changes. */
  debounceMs?: number;
  /** When false, the hook stays idle (used to keep jsdom unit tests deterministic). */
  enabled?: boolean;
}

export interface MermaidRenderer {
  /** Last successfully rendered diagram. Preserved across failed renders so the canvas never goes blank. */
  preview: RenderedDiagram | null;
  status: AppStatus;
  isRendering: boolean;
  /** True when the current source failed to validate/render and the preview is stale. */
  isStale: boolean;
  /** Render the current source immediately, cancelling any pending debounce. */
  renderNow: () => void;
  /** Render an explicit source immediately (used for Open file / template insertion). */
  renderSource: (source: string) => void;
}

const initialStatus = statusFrom(
  'info',
  'Sample ready',
  '默认示例已载入，编辑或粘贴代码会自动渲染。',
);

export function useMermaidRenderer({
  source,
  theme = 'light',
  debounceMs = 450,
  enabled = true,
}: UseMermaidRendererOptions): MermaidRenderer {
  const [preview, setPreview] = useState<RenderedDiagram | null>(null);
  const [status, setStatus] = useState<AppStatus>(initialStatus);
  const [isRendering, setIsRendering] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Always-current source so imperative triggers (button, shortcut) never read a stale closure.
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // Monotonic render token: results from a superseded render are discarded.
  const tokenRef = useRef(0);
  // The last source we kicked off a render for, used to de-duplicate the debounce
  // when an explicit render already covered the same text.
  const lastSourceRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const isFirstRef = useRef(true);

  // Always-current theme so the render closure (stable identity) uses the latest value.
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const run = useCallback(async (nextSource: string, mode: RenderMode) => {
    lastSourceRef.current = nextSource;

    // Claim the token BEFORE validating so this attempt supersedes any in-flight render.
    // Otherwise a slow earlier *valid* render could resolve after an invalid edit and
    // clobber the error state back to "success" (objective #2 regression).
    const token = (tokenRef.current += 1);

    const validation = validateMermaid(nextSource);
    if (!validation.valid) {
      // Keep the last good preview on screen; only flag the source as stale.
      setIsStale(true);
      setStatus(statusFrom('error', 'Unable to render', validation.message));
      // The orphaned prior render can no longer reset this (its token is stale).
      setIsRendering(false);
      return;
    }

    setIsRendering(true);
    setStatus(
      statusFrom(
        'working',
        'Rendering flowchart',
        mode === 'auto' ? '正在自动渲染最新的 Mermaid 内容。' : '正在渲染当前 Mermaid 内容。',
      ),
    );

    try {
      const rendered = await renderMermaid(nextSource, themeRef.current);
      if (token !== tokenRef.current) {
        return; // A newer render started; drop this stale result.
      }
      setPreview(rendered);
      setIsStale(false);
      setStatus(statusFrom('success', 'Diagram ready', '流程图已更新，可继续缩放或导出。'));
    } catch (error) {
      if (token !== tokenRef.current) {
        return;
      }
      // Preserve the previous preview; surface the error inline.
      setIsStale(true);
      setStatus(statusFrom('error', 'Render failed', formatError(error)));
    } finally {
      if (token === tokenRef.current) {
        setIsRendering(false);
      }
    }
  }, []);

  const renderNow = useCallback(() => {
    cancelPending();
    void run(sourceRef.current, 'manual');
  }, [cancelPending, run]);

  const renderSource = useCallback(
    (next: string) => {
      cancelPending();
      void run(next, 'manual');
    },
    [cancelPending, run],
  );

  // Debounced auto-render whenever the source changes.
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const isFirst = isFirstRef.current;
    isFirstRef.current = false;

    // Skip if an explicit render already handled this exact source.
    if (!isFirst && source === lastSourceRef.current) {
      return;
    }

    cancelPending();
    const delay = isFirst ? 0 : debounceMs;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void run(source, 'auto');
    }, delay);

    return cancelPending;
  }, [source, enabled, debounceMs, run, cancelPending]);

  // Re-render immediately when the theme changes so colors stay in sync.
  const themeFirstRef = useRef(true);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (themeFirstRef.current) {
      themeFirstRef.current = false;
      return;
    }
    cancelPending();
    void run(sourceRef.current, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return { preview, status, isRendering, isStale, renderNow, renderSource };
}
