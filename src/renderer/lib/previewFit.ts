import type { SvgDimensions } from './renderMermaid';

export const PREVIEW_STAGE_PADDING = 24;
export const PREVIEW_CARD_PADDING = 16;

interface FitDiagramScaleInput {
  containerHeight: number;
  containerWidth: number;
  diagramHeight: number;
  diagramWidth: number;
}

export function fitDiagramScale(input: FitDiagramScaleInput) {
  if (
    input.containerWidth <= 0 ||
    input.containerHeight <= 0 ||
    input.diagramWidth <= 0 ||
    input.diagramHeight <= 0
  ) {
    return 1;
  }

  const availableWidth = Math.max(input.containerWidth - PREVIEW_STAGE_PADDING * 2, 1);
  const availableHeight = Math.max(input.containerHeight - PREVIEW_STAGE_PADDING * 2, 1);
  const renderedWidth = input.diagramWidth + PREVIEW_CARD_PADDING * 2;
  const renderedHeight = input.diagramHeight + PREVIEW_CARD_PADDING * 2;

  return Math.min(availableWidth / renderedWidth, availableHeight / renderedHeight);
}

export function fitScaleToContainer(container: HTMLDivElement | null, dimensions: SvgDimensions) {
  if (!container) {
    return 1;
  }

  return fitDiagramScale({
    containerWidth: container.clientWidth,
    containerHeight: container.clientHeight,
    diagramWidth: dimensions.width,
    diagramHeight: dimensions.height,
  });
}
