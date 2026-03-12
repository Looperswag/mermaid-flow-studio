import { expect, test } from 'vitest';

import { renderDiagramPresentation } from './renderDiagramPresentation';

test('renders a diagram using the selected direction and palette', async () => {
  const result = await renderDiagramPresentation({
    source: 'flowchart TD\nA-->B',
    paletteId: 'studio-default',
    direction: 'left',
  });

  expect(result.svg).toContain('<svg');
  expect(result.sourceForRender).toContain('flowchart RL');
});
