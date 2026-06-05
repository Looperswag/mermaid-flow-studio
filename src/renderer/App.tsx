import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  DesktopBridge,
  ExportBackground,
  ExportFormat,
  ExportQuality,
} from '@shared/electron-api';

import { ChatPanel } from './components/ChatPanel';
import { Composer } from './components/Composer';
import { ExportDialog } from './components/ExportDialog';
import { PreviewPanel } from './components/PreviewPanel';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { SplitPane } from './components/SplitPane';
import { TopBar } from './components/TopBar';
import { useMermaidRenderer } from './hooks/useMermaidRenderer';
import { usePanZoom } from './hooks/usePanZoom';
import { useTheme } from './hooks/useTheme';
import { copyDiagramPng, copyText } from './lib/clipboard';
import { defaultDiagram } from './lib/defaultDiagram';
import { buildExportBlob, buildExportFileName } from './lib/exportDiagram';
import { formatError, statusFrom, type AppStatus } from './lib/status';
import { templates } from './lib/templates';

const browserFallback: DesktopBridge = {
  async openFile() {
    return null;
  },
  async saveImage({ bytes, format, suggestedName }) {
    const blob = new Blob([bytes], {
      type: format === 'jpg' ? 'image/jpeg' : 'image/png',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${suggestedName}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 250);

    return { canceled: false };
  },
};

export default function App() {
  const [source, setSource] = useState(defaultDiagram);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const desktop = window.mermaidApp ?? browserFallback;
  const { theme, toggleTheme } = useTheme();

  const renderer = useMermaidRenderer({
    source,
    theme,
    enabled: import.meta.env.MODE !== 'test',
  });
  const { preview, isRendering, isStale } = renderer;

  const panZoom = usePanZoom({
    containerRef: previewRef,
    dimensions: preview?.dimensions ?? null,
  });

  // Displayed status mirrors the renderer, but action handlers can override it transiently.
  const [status, setStatus] = useState<AppStatus>(renderer.status);
  useEffect(() => {
    setStatus(renderer.status);
  }, [renderer.status]);

  const loadSource = useCallback(
    (next: string, info: AppStatus) => {
      setSource(next);
      renderer.renderSource(next);
      setStatus(info);
    },
    [renderer],
  );

  const handleSelectTemplate = useCallback(
    (id: string) => {
      const template = templates.find((item) => item.id === id);
      if (!template) {
        return;
      }
      loadSource(
        template.source,
        statusFrom('info', 'Template inserted', `已插入「${template.label}」模板。`),
      );
    },
    [loadSource],
  );

  const handleNew = useCallback(() => {
    loadSource(defaultDiagram, statusFrom('info', 'Sample restored', '默认示例已恢复。'));
  }, [loadSource]);

  const handleOpen = useCallback(async () => {
    try {
      const fileContents = await desktop.openFile();
      if (!fileContents) {
        return;
      }
      loadSource(fileContents, statusFrom('info', 'File loaded', '已从本地载入 Mermaid 文件。'));
    } catch (error) {
      setStatus(statusFrom('error', 'Open failed', formatError(error)));
    }
  }, [desktop, loadSource]);

  const handleCopySource = useCallback(async () => {
    try {
      await copyText(source);
      setStatus(statusFrom('success', 'Copied', 'Mermaid 源码已复制到剪贴板。'));
    } catch (error) {
      setStatus(statusFrom('error', 'Copy failed', formatError(error)));
    }
  }, [source]);

  const handleCopySvg = useCallback(async () => {
    if (!preview) {
      return;
    }
    try {
      await copyText(preview.svg);
      setStatus(statusFrom('success', 'Copied', 'SVG 已复制到剪贴板。'));
    } catch (error) {
      setStatus(statusFrom('error', 'Copy failed', formatError(error)));
    }
  }, [preview]);

  const handleCopyImage = useCallback(async () => {
    if (!preview) {
      return;
    }
    try {
      await copyDiagramPng(preview.svg, theme);
      setStatus(statusFrom('success', 'Copied', '流程图图片已复制到剪贴板。'));
    } catch (error) {
      setStatus(statusFrom('error', 'Copy failed', formatError(error)));
    }
  }, [preview, theme]);

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
          theme,
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
    [desktop, preview, theme],
  );

  // Global Escape closes any open dialog.
  useEffect(() => {
    if (!isExportDialogOpen && !isShortcutsOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportDialogOpen(false);
        setIsShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExportDialogOpen, isShortcutsOpen]);

  const inlineError = isStale && status.tone === 'error' ? status.message : null;

  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <TopBar
          canExport={Boolean(preview)}
          theme={theme}
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
          onCopySource={() => {
            void handleCopySource();
          }}
          onToggleTheme={toggleTheme}
          onShowShortcuts={() => setIsShortcutsOpen(true)}
          onExport={() => setIsExportDialogOpen(true)}
          onNew={handleNew}
          onOpen={() => {
            void handleOpen();
          }}
        />

        <SplitPane
          storageKey="mfs:split"
          left={
            <>
              <ChatPanel
                source={source}
                statusTone={status.tone}
                statusTitle={status.title}
                statusMessage={status.message}
              />
              <Composer
                isRendering={isRendering}
                error={inlineError}
                onChange={setSource}
                onInsertExample={handleNew}
                onRender={renderer.renderNow}
                value={source}
              />
            </>
          }
          right={
            <PreviewPanel
              previewRef={previewRef}
              svg={preview?.svg ?? null}
              scale={panZoom.scale}
              offset={panZoom.offset}
              mode={panZoom.mode}
              isStale={isStale}
              errorMessage={inlineError}
              canCopy={Boolean(preview)}
              onZoomIn={panZoom.zoomIn}
              onZoomOut={panZoom.zoomOut}
              onReset={panZoom.reset}
              onFit={panZoom.fit}
              onCopySvg={() => {
                void handleCopySvg();
              }}
              onCopyImage={() => {
                void handleCopyImage();
              }}
            />
          }
        />
      </div>

      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={(options) => {
          void handleExport(options);
        }}
      />

      <ShortcutsDialog open={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
