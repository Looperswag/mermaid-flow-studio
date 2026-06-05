import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import App from './App';

vi.mock('./lib/renderDiagramPresentation', () => ({
  renderDiagramPresentation: vi.fn(async ({ source, paletteId, direction }) => ({
    svg: `
      <svg width="200" height="200" viewBox="0 0 200 200">
        <g class="node default" id="flowchart-A-0" transform="translate(40 40)">
          <rect class="label-container" x="-20" y="-10" width="40" height="20"></rect>
          <g class="label" transform="translate(-15 -8)">
            <text class="nodeLabel" x="0" y="0">Old label</text>
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

test('updates node text from the free-mode editor', async () => {
  const user = userEvent.setup();

  window.mermaidApp = {
    openFile: async () => ({ path: '/tmp/example.mmd', contents: 'flowchart TD\nA[Old label]' }),
    loadDiagramCustomization: async () => null,
    saveDiagramCustomization: async () => undefined,
    saveImage: async () => ({ canceled: true }),
  };

  render(<App />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  await user.click(screen.getByRole('radio', { name: /free/i }));

  const node = document.querySelector('[data-node-key="A"]');
  if (!node) {
    throw new Error('Expected interactive node.');
  }

  fireEvent.pointerDown(node, { button: 0, clientX: 40, clientY: 40 });

  const nodeTextInput = await screen.findByRole('textbox', { name: /node text/i });
  await user.clear(nodeTextInput);
  await user.type(nodeTextInput, 'Updated label');
  await user.click(screen.getByRole('button', { name: /apply text/i }));

  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: /mermaid input/i })).toHaveValue(
      'flowchart TD\nA[Updated label]',
    );
  });
});
