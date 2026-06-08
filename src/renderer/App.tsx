import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  DesktopBridge,
  ExportBackground,
  ExportFormat,
  ExportQuality,
} from '@shared/electron-api';
import type { PersistedDiagramCustomization } from '@shared/diagram-customization';

import { ChatPanel } from './components/ChatPanel';
import { Composer } from './components/Composer';
import { ExportDialog } from './components/ExportDialog';
import { PreviewPanel } from './components/PreviewPanel';
import { TopBar } from './components/TopBar';
import { useAppTheme } from './hooks/useAppTheme';
import { useCustomization } from './hooks/useCustomization';
import {
  formatError,
  statusFrom,
  useDiagramRenderer,
} from './hooks/useDiagramRenderer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePreviewZoom } from './hooks/usePreviewZoom';
import { defaultDiagram } from './lib/defaultDiagram';
import { buildDefaultCustomization } from './lib/defaultCustomization';
import { diagramPalettes } from './lib/diagramPalettes';
import { extractFlowchartNodeKeys } from './lib/extractFlowchartNodeKeys';
import { buildExportBlob, buildExportFileName } from './lib/exportDiagram';
import { readFlowchartNodeText, updateFlowchartNodeText } from './lib/flowchartNodeText';

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

export default function App() {
  const desktop = window.mermaidApp ?? browserFallback;

  const theme = useAppTheme();
  const {
    activeFilePath,
    setActiveFilePath,
    customization,
    setCustomization,
    persistCustomization,
  } = useCustomization(desktop);
  const [source, setSource] = useState(defaultDiagram);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const { status, setStatus, preview, setPreview, isRendering, renderSource, buildPreviewState } =
    useDiagramRenderer({ source, customization });
  const { scale, previewRef, zoomIn, zoomOut, resetZoom, fitToView } = usePreviewZoom(preview);

  // Drop a stale node selection if the node no longer exists in the source.
  useEffect(() => {
    if (!selectedNodeKey) {
      return;
    }
    const nodeKeys = extractFlowchartNodeKeys(source);
    if (!nodeKeys.includes(selectedNodeKey)) {
      setSelectedNodeKey(null);
    }
  }, [selectedNodeKey, source]);

  const handleInsertExample = useCallback(() => {
    const nextCustomization = buildDefaultCustomization();
    setActiveFilePath(null);
    setCustomization(nextCustomization);
    setSelectedNodeKey(null);
    setSource(defaultDiagram);
    setStatus(statusFrom('info', 'Sample restored', '默认示例已恢复，可以直接点击 Render。'));
    void renderSource(defaultDiagram, 'manual', nextCustomization);
  }, [renderSource, setActiveFilePath, setCustomization, setStatus]);

  const handleOpen = useCallback(async () => {
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
  }, [desktop, persistCustomization, renderSource, setActiveFilePath, setCustomization, setStatus]);

  const updateCustomization = useCallback(
    (
      updater: (current: PersistedDiagramCustomization) => PersistedDiagramCustomization,
      options?: { rerender?: boolean },
    ) => {
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
    },
    [
      buildPreviewState,
      customization,
      persistCustomization,
      preview,
      renderSource,
      setCustomization,
      setPreview,
      source,
    ],
  );

  const handlePaletteChange = useCallback(
    (paletteId: string) => {
      updateCustomization((current) => ({ ...current, paletteId }), { rerender: true });
    },
    [updateCustomization],
  );

  const handleDirectionChange = useCallback(
    (direction: PersistedDiagramCustomization['direction']) => {
      updateCustomization((current) => ({ ...current, direction }), { rerender: true });
    },
    [updateCustomization],
  );

  const handleLayoutModeChange = useCallback(
    (layoutMode: PersistedDiagramCustomization['layoutMode']) => {
      updateCustomization((current) => ({ ...current, layoutMode }));
    },
    [updateCustomization],
  );

  const handleNodeLayoutChange = useCallback(
    (nodeKey: string, position: { x: number; y: number }, options: { commit: boolean }) => {
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
    },
    [buildPreviewState, customization, persistCustomization, preview, setCustomization, setPreview, source],
  );

  const handleNodeTextApply = useCallback(
    (nodeKey: string, nextText: string) => {
      const nextSource = updateFlowchartNodeText(source, nodeKey, nextText);
      if (nextSource === source) {
        return;
      }

      setSource(nextSource);
      setStatus(
        statusFrom('working', 'Updating node text', `正在更新节点 ${nodeKey} 的显示文本。`),
      );
      void persistCustomization(customization, nextSource);
      void renderSource(nextSource, 'manual', customization);
    },
    [customization, persistCustomization, renderSource, setStatus, source],
  );

  const handleExport = useCallback(
    async (options: {
      background: ExportBackground;
      format: ExportFormat;
      quality: ExportQuality;
    }) => {
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
    },
    [desktop, preview, setStatus],
  );

  const selectedNodeText = useMemo(
    () => (selectedNodeKey ? readFlowchartNodeText(source, selectedNodeKey) : ''),
    [selectedNodeKey, source],
  );

  useKeyboardShortcuts({
    onRender: () => void renderSource(source),
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    onFit: fitToView,
    onExport: () => setIsExportDialogOpen(true),
    onOpen: () => void handleOpen(),
    onNew: handleInsertExample,
    canExport: Boolean(preview),
  });

  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <TopBar
          canExport={Boolean(preview)}
          themeMode={theme.mode}
          accent={theme.accent}
          onThemeModeChange={theme.setMode}
          onAccentChange={theme.setAccent}
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
              scale={scale}
              selectedNodeKey={selectedNodeKey}
              selectedNodeText={selectedNodeText}
              svg={preview?.svg ?? null}
              onDirectionChange={handleDirectionChange}
              onFit={fitToView}
              onLayoutModeChange={handleLayoutModeChange}
              onNodeLayoutChange={handleNodeLayoutChange}
              onNodeSelect={setSelectedNodeKey}
              onNodeTextApply={handleNodeTextApply}
              onPaletteChange={handlePaletteChange}
              onReset={resetZoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
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
