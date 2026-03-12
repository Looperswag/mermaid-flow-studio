import { expect, test } from 'vitest';

import {
  PREVIEW_CARD_PADDING,
  PREVIEW_STAGE_PADDING,
  fitDiagramScale,
} from './previewFit';

test('expands small diagrams to fill the available preview stage', () => {
  const scale = fitDiagramScale({
    containerWidth: 1200,
    containerHeight: 900,
    diagramWidth: 320,
    diagramHeight: 200,
  });

  expect(scale).toBeCloseTo(
    Math.min(
      (1200 - PREVIEW_STAGE_PADDING * 2) / (320 + PREVIEW_CARD_PADDING * 2),
      (900 - PREVIEW_STAGE_PADDING * 2) / (200 + PREVIEW_CARD_PADDING * 2),
    ),
  );
  expect(scale).toBeGreaterThan(1.2);
});
