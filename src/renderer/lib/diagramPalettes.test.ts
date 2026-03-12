import { expect, test } from 'vitest';

import { diagramPalettes } from './diagramPalettes';

test('includes the current palette as the default option', () => {
  expect(diagramPalettes[0]).toMatchObject({
    id: 'studio-default',
    isDefault: true,
  });
});
