import { fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';

import { PreviewPanel } from './PreviewPanel';

test('starts dragging when the pointer lands on the node graphic area', () => {
  const onNodeLayoutChange = vi.fn();

  const { container } = render(
    <PreviewPanel
      direction="down"
      layoutMode="free"
      paletteId="studio-default"
      palettes={[{ id: 'studio-default', label: 'Studio' }]}
      previewRef={{ current: null }}
      scale={1}
      selectedNodeKey={null}
      selectedNodeText=""
      svg={`
        <svg width="200" height="200" viewBox="0 0 200 200">
          <g
            class="node default"
            id="flowchart-A-0"
            data-node-key="A"
            data-node-x="40"
            data-node-y="40"
            data-node-width="80"
            data-node-height="40"
            transform="translate(40 40)"
          >
            <rect class="label-container" x="-40" y="-20" width="80" height="40"></rect>
          </g>
        </svg>
      `}
      onDirectionChange={() => undefined}
      onFit={() => undefined}
      onLayoutModeChange={() => undefined}
      onNodeLayoutChange={onNodeLayoutChange}
      onNodeSelect={() => undefined}
      onNodeTextApply={() => undefined}
      onPaletteChange={() => undefined}
      onReset={() => undefined}
      onZoomIn={() => undefined}
      onZoomOut={() => undefined}
    />,
  );

  const svg = container.querySelector('svg');
  if (!svg) {
    throw new Error('Expected SVG preview.');
  }

  Object.defineProperty(svg, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      toJSON: () => ({}),
    }),
  });

  fireEvent.pointerDown(svg, { button: 0, clientX: 40, clientY: 40 });
  fireEvent.pointerMove(document, { clientX: 70, clientY: 55 });
  fireEvent.pointerUp(document, { clientX: 70, clientY: 55 });

  expect(onNodeLayoutChange).toHaveBeenCalledWith(
    'A',
    expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    { commit: false },
  );
});
