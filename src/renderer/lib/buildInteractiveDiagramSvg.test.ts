import { expect, test } from 'vitest';

import { buildInteractiveDiagramSvg } from './buildInteractiveDiagramSvg';

test('applies saved free-layout positions to matching nodes', () => {
  const result = buildInteractiveDiagramSvg({
    svg: `
      <svg width="200" height="200" viewBox="0 0 200 200">
        <g class="node default" id="flowchart-A-0" transform="translate(40, 40)">
          <rect class="label-container" x="-20" y="-10" width="40" height="20"></rect>
        </g>
        <g class="node default" id="flowchart-B-1" transform="translate(120, 120)">
          <rect class="label-container" x="-20" y="-10" width="40" height="20"></rect>
        </g>
        <g class="edgePaths">
          <path id="L_A_B_0" class="flowchart-link" d="M40,40 C60,40 100,120 120,120"></path>
        </g>
        <g class="edgeLabels">
          <g class="edgeLabel">
            <g class="label" data-id="L_A_B_0"></g>
          </g>
        </g>
      </svg>
    `,
    direction: 'down',
    nodeLayouts: { A: { x: 88, y: 44 } },
  });

  expect(result.svg).toContain('data-node-key="A"');
  expect(result.svg).toContain('translate(88 44)');
  expect(result.nodeLayouts.A).toEqual({ x: 88, y: 44 });
  expect(result.dimensions.width).toBe(120);
  expect(result.dimensions.height).toBe(144);
});
