import { buildExportBlob } from './exportDiagram';
import type { DiagramTheme } from './renderMermaid';

/** Copy plain text (Mermaid source or raw SVG markup) to the clipboard. */
export async function copyText(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('当前环境不支持剪贴板写入。');
  }
  await navigator.clipboard.writeText(text);
}

/** Render the diagram to a PNG and place it on the clipboard as an image. */
export async function copyDiagramPng(svg: string, theme: DiagramTheme = 'light'): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('当前环境不支持复制图片到剪贴板。');
  }

  const blob = await buildExportBlob({
    svg,
    format: 'png',
    quality: 'medium',
    background: 'paper',
    theme,
  });

  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
