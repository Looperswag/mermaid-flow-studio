import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { PersistedDiagramCustomization } from '@shared/diagram-customization';

import App from './App';

vi.mock('./lib/renderDiagramPresentation', () => ({
  renderDiagramPresentation: vi.fn(async ({ source, paletteId, direction }) => ({
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
    dimensions: { width: 200, height: 200 },
    sourceForRender: source,
    paletteId,
    direction,
  })),
}));

test('persists free-layout node positions for the opened file', async () => {
  const saveDiagramCustomization = vi.fn<
    (filePath: string, customization: PersistedDiagramCustomization) => Promise<void>
  >(async () => undefined);
  const user = userEvent.setup();

  window.mermaidApp = {
    openFile: async () => ({ path: '/tmp/example.mmd', contents: 'flowchart TD\nA-->B' }),
    loadDiagramCustomization: async () => ({
      paletteId: 'studio-default',
      direction: 'down',
      layoutMode: 'fixed',
      layoutsByDirection: {},
      lastSourceHash: 'abc123',
      updatedAt: '2026-03-12T08:00:00.000Z',
    }),
    saveDiagramCustomization,
    saveImage: async () => ({ canceled: true }),
  };

  render(<App />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  await user.click(screen.getByRole('radio', { name: /free/i }));

  const node = document.querySelector('[data-node-key="A"]');
  expect(node).not.toBeNull();

  fireEvent.pointerDown(node as Element, { button: 0, clientX: 40, clientY: 40 });
  fireEvent.pointerMove(document, { clientX: 90, clientY: 40 });
  fireEvent.pointerUp(document, { clientX: 90, clientY: 40 });

  await waitFor(() => {
    expect(saveDiagramCustomization).toHaveBeenCalled();
  });

  const lastCall = saveDiagramCustomization.mock.calls.at(-1);
  if (!lastCall) {
    throw new Error('Expected a persisted customization call.');
  }

  const [, savedCustomization] = lastCall;

  expect(savedCustomization).toMatchObject({
    layoutMode: 'free',
  });

  const downLayouts = savedCustomization.layoutsByDirection.down;
  if (!downLayouts?.A) {
    throw new Error('Expected a saved layout for node A.');
  }

  expect(downLayouts.A.y).toBe(40);
  expect(downLayouts.A.x).toBeGreaterThan(40);
});
