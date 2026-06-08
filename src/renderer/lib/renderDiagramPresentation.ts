import type { DiagramDirection } from '@shared/diagram-customization';

import { getCachedPresentation, setCachedPresentation } from './diagramRenderCache';
import { getDiagramPalette } from './diagramPalettes';
import { rewriteFlowchartDirection } from './flowchartDirection';
import { renderMermaid, type RenderedDiagram } from './renderMermaid';

export interface RenderDiagramPresentationInput {
  source: string;
  paletteId: string;
  direction: DiagramDirection;
}

export interface DiagramPresentation extends RenderedDiagram {
  sourceForRender: string;
  paletteId: string;
  direction: DiagramDirection;
}

export async function renderDiagramPresentation(
  input: RenderDiagramPresentationInput,
): Promise<DiagramPresentation> {
  const palette = getDiagramPalette(input.paletteId);
  const sourceForRender = rewriteFlowchartDirection(input.source, input.direction);

  const cached = getCachedPresentation(palette.id, input.direction, sourceForRender);
  if (cached) {
    return cached;
  }

  const rendered = await renderMermaid(sourceForRender, {
    themeVariables: palette.themeVariables,
  });

  const presentation: DiagramPresentation = {
    ...rendered,
    sourceForRender,
    paletteId: palette.id,
    direction: input.direction,
  };
  setCachedPresentation(palette.id, input.direction, sourceForRender, presentation);

  return presentation;
}
