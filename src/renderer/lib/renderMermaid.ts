import mermaid from 'mermaid';

import { sanitizeSvg } from './sanitizeSvg';
import { stripMermaidFence } from './validateMermaid';

export type DiagramTheme = 'light' | 'dark';

export interface SvgDimensions {
  width: number;
  height: number;
}

export interface RenderedDiagram {
  svg: string;
  dimensions: SvgDimensions;
}

const fontFamily =
  '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif';

const themePresets: Record<DiagramTheme, Record<string, string>> = {
  light: {
    primaryColor: '#dbeee5',
    primaryBorderColor: '#1e4f46',
    primaryTextColor: '#142725',
    lineColor: '#355c58',
    secondaryColor: '#f5dcc1',
    tertiaryColor: '#f7f0e6',
    edgeLabelBackground: '#fffdf8',
    fontFamily,
  },
  dark: {
    primaryColor: '#22413b',
    primaryBorderColor: '#5cb7a4',
    primaryTextColor: '#e9f5f1',
    lineColor: '#86b8af',
    secondaryColor: '#3b3a2c',
    tertiaryColor: '#1b2421',
    mainBkg: '#22413b',
    clusterBkg: 'rgba(120, 180, 170, 0.1)',
    clusterBorder: '#436f66',
    titleColor: '#e9f5f1',
    nodeTextColor: '#e9f5f1',
    edgeLabelBackground: '#16201d',
    fontFamily,
  },
};

let currentTheme: DiagramTheme | null = null;
let renderCount = 0;

export function configureMermaid(theme: DiagramTheme) {
  if (currentTheme === theme) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    // 'strict' sanitizes HTML in labels and disables click handlers. The rendered SVG
    // is injected via dangerouslySetInnerHTML and the app can open external .mmd files,
    // so untrusted source must not be able to inject script or reach the IPC bridge.
    securityLevel: 'strict',
    // Force SVG <text> labels everywhere (node labels read the top-level flag in v11).
    htmlLabels: false,
    theme: 'base',
    themeVariables: themePresets[theme],
    flowchart: {
      curve: 'basis',
      useMaxWidth: false,
      // Render labels as native SVG <text> rather than HTML in <foreignObject>. This both
      // removes the HTML-in-SVG attack surface and lets the DOMPurify pass (sanitizeSvg)
      // preserve labels — DOMPurify drops foreignObject's XHTML content.
      htmlLabels: false,
    },
  });

  currentTheme = theme;
}

function parseDimensionValue(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const numeric = Number.parseFloat(value.replace('px', ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function extractSvgDimensions(svg: string): SvgDimensions {
  const parser = new DOMParser();
  const document = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    return { width: 960, height: 720 };
  }

  const width = parseDimensionValue(svgElement.getAttribute('width'));
  const height = parseDimensionValue(svgElement.getAttribute('height'));

  if (width && height) {
    return { width, height };
  }

  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const values = viewBox
      .split(/\s+/)
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));

    if (values.length === 4) {
      return {
        width: values[2],
        height: values[3],
      };
    }
  }

  return { width: 960, height: 720 };
}

function normalizeSvg(svg: string): string {
  return svg.replace(/max-width:\s*[^;"]+;?/g, '');
}

export async function renderMermaid(
  source: string,
  theme: DiagramTheme = 'light',
): Promise<RenderedDiagram> {
  configureMermaid(theme);
  const renderId = `mermaid-flow-${renderCount += 1}`;
  const { svg } = await mermaid.render(renderId, stripMermaidFence(source));

  // Defense-in-depth: sanitize the SVG once more before it is injected into the DOM.
  const safeSvg = sanitizeSvg(normalizeSvg(svg));

  return {
    svg: safeSvg,
    dimensions: extractSvgDimensions(safeSvg),
  };
}
