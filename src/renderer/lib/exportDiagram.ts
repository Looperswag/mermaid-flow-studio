import type {
  ExportBackground,
  ExportFormat,
  ExportQuality,
} from '@shared/electron-api';

import { extractSvgDimensions } from './renderMermaid';

export interface ExportDiagramInput {
  svg: string;
  format: ExportFormat;
  quality: ExportQuality;
  background: ExportBackground;
}

export const qualityScaleMap: Record<ExportQuality, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const exportPadding = 32;

function mimeTypeForFormat(format: ExportFormat) {
  return format === 'jpg' ? 'image/jpeg' : 'image/png';
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to prepare exported image.'));
    image.src = source;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable to generate image export.'));
          return;
        }

        resolve(blob);
      },
      mimeTypeForFormat(format),
      format === 'jpg' ? 0.92 : undefined,
    );
  });
}

export function buildExportFileName(date = new Date()) {
  const parts = [
    date.getUTCFullYear(),
    `${date.getUTCMonth() + 1}`.padStart(2, '0'),
    `${date.getUTCDate()}`.padStart(2, '0'),
  ];
  const time = [
    `${date.getUTCHours()}`.padStart(2, '0'),
    `${date.getUTCMinutes()}`.padStart(2, '0'),
    `${date.getUTCSeconds()}`.padStart(2, '0'),
  ];

  return `mermaid-export-${parts.join('')}-${time.join('')}`;
}

export async function buildExportBlob(input: ExportDiagramInput) {
  const dimensions = extractSvgDimensions(input.svg);
  const scale = qualityScaleMap[input.quality];
  const logicalWidth = dimensions.width + exportPadding * 2;
  const logicalHeight = dimensions.height + exportPadding * 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(logicalWidth * scale);
  canvas.height = Math.ceil(logicalHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to prepare export canvas.');
  }

  const background =
    input.format === 'jpg' || input.background === 'paper' ? '#f6efe4' : 'transparent';
  if (background !== 'transparent') {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.scale(scale, scale);
  const image = await loadImage(svgToDataUrl(input.svg));
  context.drawImage(image, exportPadding, exportPadding, dimensions.width, dimensions.height);

  return canvasToBlob(canvas, input.format);
}
