import { useEffect, useRef, useState } from 'react';

import type {
  DesktopBridge,
  ExportBackground,
  ExportFormat,
  ExportQuality,
} from '@shared/electron-api';
import type {
  PersistedDiagramCustomization,
  PersistedNodeLayout,
} from '@shared/diagram-customization';

import { ChatPanel } from './components/ChatPanel';
import { Composer } from './components/Composer';
import { ExportDialog } from './components/ExportDialog';
import { PreviewPanel } from './components/PreviewPanel';
import { TopBar } from './components/TopBar';
import { buildInteractiveDiagramSvg } from './lib/buildInteractiveDiagramSvg';
import { defaultDiagram } from './lib/defaultDiagram';
import { buildDefaultCustomization } from './lib/defaultCustomization';
import { diagramPalettes } from './lib/diagramPalettes';
import { extractFlowchartNodeKeys } from './lib/extractFlowchartNodeKeys';
import { buildExportBlob, buildExportFileName } from './lib/exportDiagram';
import { readFlowchartNodeText, updateFlowchartNodeText } from './lib/flowchartNodeText';
import { mergePersistedLayouts } from './lib/mergePersistedLayouts';
import { fitScaleToContainer } from './lib/previewFit';
import {
  renderDiagramPresentation,
  type DiagramPresentation,
} from './lib/renderDiagramPresentation';
import type { SvgDimensions } from './lib/renderMermaid';
import { validateMermaid } from './lib/validateMermaid';

type StatusTone = 'info' | 'success' | 'error' | 'working';

interface AppStatus {
  tone: StatusTone;
  title: string;
  message: string;
}

interface PreviewState {
  base: DiagramPresentation;
  dimensions: SvgDimensions;
  nodeLayouts: Record<string, PersistedNodeLayout>;
  svg: string;
}

const browserFallback: DesktopBridge = {
  async openFile() {
    return null;
  },
  async loadDiagramCustomization() {
    return null;
  },
  async saveDiagramCustomization() {},
  async saveImage({ bytes, format, suggestedName }) {
    const blob = new Blob([bytes], {
      type: format === 'jpg' ? 'image/jpeg' : 'image/png',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${suggestedName}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 250);

    return {
      canceled: false,
    };
  },
};

function clampScale(value: number) {
  return Math.max(0.25, Math.min(20, value));
}

function formatError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Mermaid 渲染失败，请检查语法后重试。';
}

function statusFrom(tone: StatusTone, title: string, message: string): AppStatus {
  return { tone, title, message };
}

export default function App() {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [customization, setCustomization] = useState<PersistedDiagramCustomization>(
    buildDefaultCustomization(),
  );
  const [source, setSource] = useState(defaultDiagram);
  const [status, setStatus] = useState<AppStatus>(
    statusFrom('info', 'Sample ready', '默认示例已经载入，可以直接渲染或继续编辑。'),
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const desktop = window.mermaidApp ?? browserFallback;

  function buildPersistedCustomization(
    nextCustomization: PersistedDiagramCustomization,
    nextSource: string,
  ): PersistedDiagramCustomization {
    return {
      ...nextCustomization,
      lastSourceHash: `${nextSource.length}:${nextSource}`,
      updatedAt: new Date().toISOString(),
    };
  }

  async function persistCustomization(
    nextCustomization: PersistedDiagramCustomization,
    nextSource: string,
    filePath = activeFilePath,
  ) {
    if (!filePath) {
      return;
    }

    await desktop.saveDiagramCustomization(
      filePath,
      buildPersistedCustomization(nextCustomization, nextSource),
    );
  }

  async function renderSource(
    nextSource: string,
    mode: 'auto' | 'manual' = 'manual',
    nextCustomization = customization,
  ) {
    const validation = validateMermaid(nextSource);
    if (!validation.valid) {
      setStatus(statusFrom('error', 'Unable to render', validation.message));
      return;
    }

    try {
      setIsRendering(true);
      setStatus(
        statusFrom(
          'working',
          'Rendering flowchart',
          mode === 'auto'
            ? '正在为默认示例生成节点图。'
            : '正在把当前 Mermaid 内容转换为节点图。',
        ),
      );
      const rendered = await renderDiagramPresentation({
        source: nextSource,
        paletteId: nextCustomization.paletteId,
        direction: nextCustomization.direction,
      });
      const nextPreview = buildPreviewState(rendered, nextCustomization, nextSource);
      setPreview(nextPreview);
      setPreviewScale(fitScaleToContainer(previewRef.current, nextPreview.dimensions));
      setStatus(
        statusFrom('success', 'Diagram ready', '流程图已生成，可以继续缩放或导出图片。'),
      );
    } catch (error) {
      setStatus(statusFrom('error', 'Render failed', formatError(error)));
    } finally {
      setIsRendering(false);
    }
  }

  function buildPreviewState(
    basePresentation: DiagramPresentation,
    nextCustomization: PersistedDiagramCustomization,
    nextSource: string,
  ): PreviewState {
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
      svg: interactiveDiagram.svg,
      dimensions: interactiveDiagram.dimensions,
      nodeLayouts: interactiveDiagram.nodeLayouts,
    };
  }

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }

    void renderSource(defaultDiagram, 'auto', buildDefaultCustomization());
    // The default sample is static for the whole app lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preview) {
      return;
    }

    setPreviewScale(fitScaleToContainer(previewRef.current, preview.dimensions));
  }, [preview]);

  useEffect(() => {
    if (!selectedNodeKey) {
      return;
    }

    const nodeKeys = extractFlowchartNodeKeys(source);
    if (!nodeKeys.includes(selectedNodeKey)) {
      setSelectedNodeKey(null);
    }
  }, [selectedNodeKey, source]);

  function handleInsertExample() {
    setActiveFilePath(null);
    setCustomization(buildDefaultCustomization());
    setSelectedNodeKey(null);
    setSource(defaultDiagram);
    setStatus(statusFrom('info', 'Sample restored', '默认示例已恢复，可以直接点击 Render。'));
    void renderSource(defaultDiagram, 'manual', buildDefaultCustomization());
  }

  async function handleOpen() {
    const file = await desktop.openFile();
    if (!file) {
      return;
    }

    const restoredCustomization =
      (await desktop.loadDiagramCustomization(file.path)) ?? buildDefaultCustomization();

    setActiveFilePath(file.path);
    setCustomization(restoredCustomization);
    setSelectedNodeKey(null);
    setSource(file.contents);
    setStatus(statusFrom('info', 'File loaded', '已从本地载入 Mermaid 文件。'));
    await persistCustomization(restoredCustomization, file.contents, file.path);
    void renderSource(file.contents, 'manual', restoredCustomization);
  }

  function updateCustomization(
    updater: (current: PersistedDiagramCustomization) => PersistedDiagramCustomization,
    options?: { rerender?: boolean },
  ) {
    const nextCustomization = updater(customization);
    setCustomization(nextCustomization);
    void persistCustomization(nextCustomization, source);

    if (options?.rerender) {
      void renderSource(source, 'manual', nextCustomization);
      return;
    }

    if (preview) {
      setPreview(buildPreviewState(preview.base, nextCustomization, source));
    }
  }

  function handleNodeLayoutChange(
    nodeKey: string,
    position: { x: number; y: number },
    options: { commit: boolean },
  ) {
    const nextCustomization: PersistedDiagramCustomization = {
      ...customization,
      layoutMode: 'free',
      layoutsByDirection: {
        ...customization.layoutsByDirection,
        [customization.direction]: {
          ...(customization.layoutsByDirection[customization.direction] ?? {}),
          [nodeKey]: position,
        },
      },
    };

    setCustomization(nextCustomization);

    if (preview) {
      setPreview(buildPreviewState(preview.base, nextCustomization, source));
    }

    if (options.commit) {
      void persistCustomization(nextCustomization, source);
    }
  }

  function handleNodeTextApply(nodeKey: string, nextText: string) {
    const nextSource = updateFlowchartNodeText(source, nodeKey, nextText);
    if (nextSource === source) {
      return;
    }

    setSource(nextSource);
    setStatus(statusFrom('working', 'Updating node text', `正在更新节点 ${nodeKey} 的显示文本。`));
    void persistCustomization(customization, nextSource);
    void renderSource(nextSource, 'manual', customization);
  }

  async function handleExport(options: {
    background: ExportBackground;
    format: ExportFormat;
    quality: ExportQuality;
  }) {
    if (!preview) {
      setStatus(statusFrom('error', 'Nothing to export', '请先成功渲染一个流程图。'));
      return;
    }

    try {
      setIsExportDialogOpen(false);
      setStatus(statusFrom('working', 'Preparing export', '正在生成导出图片。'));
      const blob = await buildExportBlob({
        svg: preview.svg,
        format: options.format,
        quality: options.quality,
        background: options.background,
      });
      const result = await desktop.saveImage({
        bytes: await blob.arrayBuffer(),
        format: options.format,
        suggestedName: buildExportFileName(),
      });

      setStatus(
        result.canceled
          ? statusFrom('info', 'Export canceled', '导出已取消。')
          : statusFrom('success', 'Image exported', '图片已经保存到你选择的位置。'),
      );
    } catch (error) {
      setStatus(statusFrom('error', 'Export failed', formatError(error)));
    }
  }

  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <TopBar
          canExport={Boolean(preview)}
          onExport={() => setIsExportDialogOpen(true)}
          onNew={handleInsertExample}
          onOpen={() => {
            void handleOpen();
          }}
        />

        <main className="workspace">
          <div className="workspace__column workspace__column--chat">
            <ChatPanel
              activeFileLabel={activeFilePath}
              source={source}
              statusTone={status.tone}
              statusTitle={status.title}
              statusMessage={status.message}
            />

            <Composer
              isRendering={isRendering}
              onChange={setSource}
              onInsertExample={handleInsertExample}
              onRender={() => {
                void renderSource(source);
              }}
              value={source}
            />
          </div>

          <div className="workspace__column workspace__column--preview">
            <PreviewPanel
              direction={customization.direction}
              layoutMode={customization.layoutMode}
              paletteId={customization.paletteId}
              palettes={diagramPalettes}
              previewRef={previewRef}
              scale={previewScale}
              selectedNodeKey={selectedNodeKey}
              selectedNodeText={
                selectedNodeKey ? readFlowchartNodeText(source, selectedNodeKey) : ''
              }
              svg={preview?.svg ?? null}
              onDirectionChange={(direction) => {
                updateCustomization(
                  (current) => ({
                    ...current,
                    direction,
                  }),
                  { rerender: true },
                );
              }}
              onFit={() => {
                if (!preview) {
                  return;
                }

                setPreviewScale(fitScaleToContainer(previewRef.current, preview.dimensions));
              }}
              onLayoutModeChange={(layoutMode) => {
                updateCustomization((current) => ({
                  ...current,
                  layoutMode,
                }));
              }}
              onNodeLayoutChange={handleNodeLayoutChange}
              onNodeSelect={setSelectedNodeKey}
              onNodeTextApply={handleNodeTextApply}
              onPaletteChange={(paletteId) => {
                updateCustomization(
                  (current) => ({
                    ...current,
                    paletteId,
                  }),
                  { rerender: true },
                );
              }}
              onReset={() => setPreviewScale(1)}
              onZoomIn={() => setPreviewScale((current) => clampScale(current + 0.1))}
              onZoomOut={() => setPreviewScale((current) => clampScale(current - 0.1))}
            />
          </div>
        </main>
      </div>

      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={(options) => {
          void handleExport(options);
        }}
      />
    </div>
  );
}
