import type { DiagramDirection } from '@shared/diagram-customization';

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
  const rendered = await renderMermaid(sourceForRender, {
    themeVariables: palette.themeVariables,
  });

  return {
    ...rendered,
    sourceForRender,
    paletteId: palette.id,
    direction: input.direction,
  };
}
