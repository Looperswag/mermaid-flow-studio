import type {
  DiagramDirection,
  PersistedNodeLayout,
} from '@shared/diagram-customization';

import { extractSvgDimensions } from './renderMermaid';

interface Point {
  x: number;
  y: number;
}

interface NodeGeometry {
  height: number;
  key: string;
  width: number;
  x: number;
  y: number;
}

const INTERACTIVE_SVG_PADDING = 24;

export interface BuildInteractiveDiagramSvgInput {
  direction: DiagramDirection;
  nodeLayouts: Record<string, PersistedNodeLayout>;
  svg: string;
}

export interface InteractiveDiagramSvg {
  dimensions: { width: number; height: number };
  nodeLayouts: Record<string, PersistedNodeLayout>;
  svg: string;
}

function parseTranslate(transform: string | null): Point {
  if (!transform) {
    return { x: 0, y: 0 };
  }

  const match = transform.match(/translate\(([-\d.]+)(?:[ ,]+([-\d.]+))?\)/);
  return {
    x: Number.parseFloat(match?.[1] ?? '0'),
    y: Number.parseFloat(match?.[2] ?? '0'),
  };
}

function parseNodeKeyFromId(id: string | null) {
  if (!id) {
    return null;
  }

  const match = id.match(/^flowchart-(.+)-\d+$/);
  return match?.[1] ?? null;
}

function parsePolygonBounds(points: string, transform: string | null) {
  const offset = parseTranslate(transform);
  const pairs = points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map((value) => Number.parseFloat(value)))
    .filter((pair) => pair.length === 2 && pair.every((value) => Number.isFinite(value)));

  if (pairs.length === 0) {
    return null;
  }

  const xs = pairs.map(([x]) => x + offset.x);
  const ys = pairs.map(([, y]) => y + offset.y);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function resolveNodeSize(node: Element) {
  const rect = node.querySelector('rect.label-container, rect.basic.label-container');
  if (rect) {
    return {
      width: Number.parseFloat(rect.getAttribute('width') ?? '120') || 120,
      height: Number.parseFloat(rect.getAttribute('height') ?? '54') || 54,
    };
  }

  const polygon = node.querySelector('polygon.label-container');
  if (polygon) {
    const bounds = parsePolygonBounds(
      polygon.getAttribute('points') ?? '',
      polygon.getAttribute('transform'),
    );

    if (bounds) {
      return bounds;
    }
  }

  const foreignObject = node.querySelector('foreignObject');
  if (foreignObject) {
    return {
      width: (Number.parseFloat(foreignObject.getAttribute('width') ?? '120') || 120) + 40,
      height: (Number.parseFloat(foreignObject.getAttribute('height') ?? '24') || 24) + 30,
    };
  }

  return { width: 120, height: 54 };
}

function edgeKeysFromId(id: string | null) {
  if (!id) {
    return null;
  }

  const parts = id.split('_');
  if (parts.length < 4 || parts[0] !== 'L') {
    return null;
  }

  return {
    sourceKey: parts[1],
    targetKey: parts[2],
  };
}

function anchorPoints(
  source: NodeGeometry,
  target: NodeGeometry,
  direction: DiagramDirection,
) {
  if (direction === 'left' || direction === 'right') {
    const sign = target.x >= source.x ? 1 : -1;
    const start = { x: source.x + (source.width / 2) * sign, y: source.y };
    const end = { x: target.x - (target.width / 2) * sign, y: target.y };
    return { start, end };
  }

  const sign = target.y >= source.y ? 1 : -1;
  const start = { x: source.x, y: source.y + (source.height / 2) * sign };
  const end = { x: target.x, y: target.y - (target.height / 2) * sign };
  return { start, end };
}

function buildEdgePath(
  source: NodeGeometry,
  target: NodeGeometry,
  direction: DiagramDirection,
) {
  const { start, end } = anchorPoints(source, target, direction);

  if (direction === 'left' || direction === 'right') {
    const midX = (start.x + end.x) / 2;
    return `M${start.x},${start.y} C${midX},${start.y} ${midX},${end.y} ${end.x},${end.y}`;
  }

  const midY = (start.y + end.y) / 2;
  return `M${start.x},${start.y} C${start.x},${midY} ${end.x},${midY} ${end.x},${end.y}`;
}

function updateViewBox(svgElement: SVGElement, nodes: NodeGeometry[]) {
  if (nodes.length === 0) {
    return;
  }

  const minX = Math.min(...nodes.map((node) => node.x - node.width / 2)) - INTERACTIVE_SVG_PADDING;
  const minY =
    Math.min(...nodes.map((node) => node.y - node.height / 2)) - INTERACTIVE_SVG_PADDING;
  const maxX = Math.max(...nodes.map((node) => node.x + node.width / 2)) + INTERACTIVE_SVG_PADDING;
  const maxY =
    Math.max(...nodes.map((node) => node.y + node.height / 2)) + INTERACTIVE_SVG_PADDING;
  const width = maxX - minX;
  const height = maxY - minY;

  svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute('width', `${width}`);
  svgElement.setAttribute('height', `${height}`);
}

export function buildInteractiveDiagramSvg(
  input: BuildInteractiveDiagramSvgInput,
): InteractiveDiagramSvg {
  const parser = new DOMParser();
  const document = parser.parseFromString(input.svg, 'image/svg+xml');
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    return {
      svg: input.svg,
      dimensions: extractSvgDimensions(input.svg),
      nodeLayouts: input.nodeLayouts,
    };
  }

  const nodeMap = new Map<string, NodeGeometry>();
  const resolvedLayouts: Record<string, PersistedNodeLayout> = {};

  for (const node of document.querySelectorAll<SVGGElement>('g.node[id]')) {
    const key = parseNodeKeyFromId(node.getAttribute('id'));
    if (!key) {
      continue;
    }

    const basePosition = parseTranslate(node.getAttribute('transform'));
    const nextPosition = input.nodeLayouts[key] ?? basePosition;
    const size = resolveNodeSize(node);

    node.setAttribute('data-node-key', key);
    node.setAttribute('data-node-x', `${nextPosition.x}`);
    node.setAttribute('data-node-y', `${nextPosition.y}`);
    node.setAttribute('data-node-width', `${size.width}`);
    node.setAttribute('data-node-height', `${size.height}`);
    node.setAttribute('transform', `translate(${nextPosition.x} ${nextPosition.y})`);

    const geometry = {
      key,
      width: size.width,
      height: size.height,
      x: nextPosition.x,
      y: nextPosition.y,
    };

    nodeMap.set(key, geometry);
    resolvedLayouts[key] = { x: nextPosition.x, y: nextPosition.y };
  }

  for (const edge of document.querySelectorAll<SVGPathElement>('path.flowchart-link[id]')) {
    const keys = edgeKeysFromId(edge.getAttribute('id'));
    if (!keys) {
      continue;
    }

    const source = nodeMap.get(keys.sourceKey);
    const target = nodeMap.get(keys.targetKey);
    if (!source || !target) {
      continue;
    }

    edge.setAttribute('data-source-key', source.key);
    edge.setAttribute('data-target-key', target.key);
    edge.setAttribute('d', buildEdgePath(source, target, input.direction));

    const edgeLabel = document.querySelector<SVGGElement>(
      `.edgeLabel .label[data-id="${edge.getAttribute('id')}"]`,
    );
    const edgeLabelContainer = edgeLabel?.closest('g.edgeLabel');
    if (edgeLabelContainer) {
      const midpoint = {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2,
      };
      edgeLabelContainer.setAttribute('transform', `translate(${midpoint.x} ${midpoint.y})`);
    }
  }

  updateViewBox(svgElement, [...nodeMap.values()]);
  const svg = new XMLSerializer().serializeToString(svgElement);

  return {
    svg,
    dimensions: extractSvgDimensions(svg),
    nodeLayouts: resolvedLayouts,
  };
}
