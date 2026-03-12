import type { DiagramDirection } from '@shared/diagram-customization';

const directionKeywordMap: Record<DiagramDirection, string> = {
  down: 'TD',
  up: 'BT',
  right: 'LR',
  left: 'RL',
};

export function rewriteFlowchartDirection(source: string, direction: DiagramDirection) {
  return source.replace(/^(\s*flowchart)\s+\w+/i, `$1 ${directionKeywordMap[direction]}`);
}
