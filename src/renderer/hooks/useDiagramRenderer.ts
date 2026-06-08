import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';

import type {
  PersistedDiagramCustomization,
  PersistedNodeLayout,
} from '@shared/diagram-customization';

import { buildInteractiveDiagramSvg } from '../lib/buildInteractiveDiagramSvg';
import { extractFlowchartNodeKeys } from '../lib/extractFlowchartNodeKeys';
import { mergePersistedLayouts } from '../lib/mergePersistedLayouts';
import {
  renderDiagramPresentation,
  type DiagramPresentation,
} from '../lib/renderDiagramPresentation';
import type { SvgDimensions } from '../lib/renderMermaid';
import { sanitizeSvg } from '../lib/sanitizeSvg';
import { validateMermaid } from '../lib/validateMermaid';

export type StatusTone = 'info' | 'success' | 'error' | 'working';

export interface AppStatus {
  tone: StatusTone;
  title: string;
  message: string;
}

export interface PreviewState {
  base: DiagramPresentation;
  dimensions: SvgDimensions;
  nodeLayouts: Record<string, PersistedNodeLayout>;
  svg: string;
}

export function statusFrom(tone: StatusTone, title: string, message: string): AppStatus {
  return { tone, title, message };
}

export function formatError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Mermaid 渲染失败，请检查语法后重试。';
}

const initialStatus = statusFrom(
  'info',
  'Sample ready',
  '默认示例已经载入，可以直接渲染或继续编辑。',
);

interface UseDiagramRendererParams {
  source: string;
  customization: PersistedDiagramCustomization;
}

export interface UseDiagramRendererResult {
  status: AppStatus;
  setStatus: Dispatch<SetStateAction<AppStatus>>;
  preview: PreviewState | null;
  setPreview: Dispatch<SetStateAction<PreviewState | null>>;
  isRendering: boolean;
  renderSource: (
    nextSource: string,
    mode?: 'auto' | 'manual',
    nextCustomization?: PersistedDiagramCustomization,
  ) => Promise<void>;
  buildPreviewState: (
    base: DiagramPresentation,
    nextCustomization: PersistedDiagramCustomization,
    nextSource: string,
  ) => PreviewState;
  lastRenderedSourceRef: MutableRefObject<string | null>;
}

/**
 * Owns the render pipeline: validation, debounced live rendering, the monotonic
 * render token that drops stale results, and assembling the interactive/sanitised
 * preview SVG. The current customization is mirrored to a ref so an `auto` render
 * fired from the debounce always uses the latest palette/direction.
 */
export function useDiagramRenderer({
  source,
  customization,
}: UseDiagramRendererParams): UseDiagramRendererResult {
  const [status, setStatus] = useState<AppStatus>(initialStatus);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Monotonic render token so a slow in-flight render can't overwrite a newer result.
  const renderTokenRef = useRef(0);
  // Last source we kicked off a render for; de-dupes the debounce vs. explicit renders.
  const lastRenderedSourceRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const customizationRef = useRef(customization);
  customizationRef.current = customization;

  const buildPreviewState = useCallback(
    (
      basePresentation: DiagramPresentation,
      nextCustomization: PersistedDiagramCustomization,
      nextSource: string,
    ): PreviewState => {
      const directionLayouts =
        nextCustomization.layoutsByDirection[nextCustomization.direction] ?? {};
      const nodeLayouts =
        nextCustomization.layoutMode === 'free'
          ? mergePersistedLayouts({
              nodeKeys: extractFlowchartNodeKeys(nextSource),
              persistedLayouts: directionLayouts,
            })
          : {};
      const interactiveDiagram = buildInteractiveDiagramSvg({
        svg: basePresentation.svg,
        direction: nextCustomization.direction,
        nodeLayouts,
      });

      return {
        base: basePresentation,
        // Defense-in-depth: sanitize the final SVG before it is injected into the DOM.
        // DOMPurify preserves the free-layout data-node-* attributes and SVG text labels.
        svg: sanitizeSvg(interactiveDiagram.svg),
        dimensions: interactiveDiagram.dimensions,
        nodeLayouts: interactiveDiagram.nodeLayouts,
      };
    },
    [],
  );

  const renderSource = useCallback(
    async (
      nextSource: string,
      mode: 'auto' | 'manual' = 'manual',
      nextCustomization: PersistedDiagramCustomization = customizationRef.current,
    ) => {
      lastRenderedSourceRef.current = nextSource;
      // Claim the token before validating so an invalid edit supersedes any in-flight render.
      const token = (renderTokenRef.current += 1);

      const validation = validateMermaid(nextSource);
      if (!validation.valid) {
        // Keep the last good preview on screen; only surface the error.
        setStatus(statusFrom('error', 'Unable to render', validation.message));
        setIsRendering(false);
        return;
      }

      try {
        setIsRendering(true);
        setStatus(
          statusFrom(
            'working',
            'Rendering flowchart',
            mode === 'auto'
              ? '正在自动渲染最新的 Mermaid 内容。'
              : '正在渲染当前 Mermaid 内容。',
          ),
        );
        const rendered = await renderDiagramPresentation({
          source: nextSource,
          paletteId: nextCustomization.paletteId,
          direction: nextCustomization.direction,
        });
        if (token !== renderTokenRef.current) {
          return; // A newer render started; drop this stale result.
        }
        setPreview(buildPreviewState(rendered, nextCustomization, nextSource));
        setStatus(
          statusFrom('success', 'Diagram ready', '流程图已更新，可以继续缩放或导出图片。'),
        );
      } catch (error) {
        if (token !== renderTokenRef.current) {
          return;
        }
        // Preserve the previous preview; surface the error.
        setStatus(statusFrom('error', 'Render failed', formatError(error)));
      } finally {
        if (token === renderTokenRef.current) {
          setIsRendering(false);
        }
      }
    },
    [buildPreviewState],
  );

  // Debounced live render: re-render whenever the source changes (first run is immediate).
  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    const isFirst = isFirstRenderRef.current;
    isFirstRenderRef.current = false;
    // Skip if an explicit render already handled this exact source.
    if (!isFirst && source === lastRenderedSourceRef.current) {
      return;
    }
    const id = window.setTimeout(
      () => {
        void renderSource(source, 'auto');
      },
      isFirst ? 0 : 450,
    );
    return () => clearTimeout(id);
  }, [source, renderSource]);

  return {
    status,
    setStatus,
    preview,
    setPreview,
    isRendering,
    renderSource,
    buildPreviewState,
    lastRenderedSourceRef,
  };
}
