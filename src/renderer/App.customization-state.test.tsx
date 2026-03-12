import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import App from './App';

vi.mock('./lib/renderDiagramPresentation', () => ({
  renderDiagramPresentation: vi.fn(async ({ source, paletteId, direction }) => ({
    svg: '<svg viewBox="0 0 100 100"></svg>',
    dimensions: { width: 100, height: 100 },
    sourceForRender: source,
    paletteId,
    direction,
  })),
}));

test('loads persisted customization when a Mermaid file is opened', async () => {
  const user = userEvent.setup();

  window.mermaidApp = {
    openFile: async () => ({ path: '/tmp/example.mmd', contents: 'flowchart TD\nA-->B' }),
    loadDiagramCustomization: async () => ({
      paletteId: 'studio-default',
      direction: 'left',
      layoutMode: 'fixed',
      layoutsByDirection: {},
      lastSourceHash: 'abc123',
      updatedAt: '2026-03-12T08:00:00.000Z',
    }),
    saveDiagramCustomization: async () => undefined,
    saveImage: async () => ({ canceled: true }),
  };

  render(<App />);
  await user.click(screen.getByRole('button', { name: /open/i }));

  await waitFor(() => {
    expect(screen.getByRole('combobox', { name: /direction/i })).toHaveValue('left');
  });
});
