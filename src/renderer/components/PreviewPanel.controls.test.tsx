import { render, screen } from '@testing-library/react';

import { PreviewPanel } from './PreviewPanel';

test('shows palette, layout mode, and direction controls', () => {
  render(
    <PreviewPanel
      previewRef={{ current: null }}
      scale={1}
      svg={null}
      palettes={[{ id: 'studio-default', label: 'Studio' }]}
      paletteId="studio-default"
      direction="down"
      layoutMode="fixed"
      selectedNodeKey={null}
      selectedNodeText=""
      onPaletteChange={() => undefined}
      onDirectionChange={() => undefined}
      onLayoutModeChange={() => undefined}
      onNodeLayoutChange={() => undefined}
      onNodeSelect={() => undefined}
      onNodeTextApply={() => undefined}
      onFit={() => undefined}
      onReset={() => undefined}
      onZoomIn={() => undefined}
      onZoomOut={() => undefined}
    />,
  );

  expect(screen.getByRole('combobox', { name: /palette/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /direction/i })).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: /layout mode/i })).toBeInTheDocument();
});
