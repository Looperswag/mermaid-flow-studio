import mermaid from 'mermaid';

export interface RenderMermaidOptions {
  themeVariables?: Record<string, string>;
}

export interface SvgDimensions {
  width: number;
  height: number;
}

export interface RenderedDiagram {
  svg: string;
  dimensions: SvgDimensions;
}

let renderCount = 0;

const defaultThemeVariables = {
  primaryColor: '#dbeee5',
  primaryBorderColor: '#1e4f46',
  primaryTextColor: '#142725',
  lineColor: '#355c58',
  secondaryColor: '#f5dcc1',
  tertiaryColor: '#f7f0e6',
  fontFamily:
    '"SF Pro Display", "Avenir Next", "PingFang SC", "Hiragino Sans GB", sans-serif',
};

function ensureMermaidInitialized(options?: RenderMermaidOptions) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      ...defaultThemeVariables,
      ...options?.themeVariables,
    },
    flowchart: {
      curve: 'basis',
      useMaxWidth: false,
      htmlLabels: true,
    },
  });
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
  options?: RenderMermaidOptions,
): Promise<RenderedDiagram> {
  ensureMermaidInitialized(options);
  const renderId = `mermaid-flow-${renderCount += 1}`;
  const { svg } = await mermaid.render(renderId, source);

  return {
    svg: normalizeSvg(svg),
    dimensions: extractSvgDimensions(svg),
  };
}
