import { expect, test } from 'vitest';

import { mergePersistedLayouts } from './mergePersistedLayouts';

test('keeps saved positions for unchanged node ids and ignores removed nodes', () => {
  const result = mergePersistedLayouts({
    nodeKeys: ['A', 'C'],
    persistedLayouts: {
      A: { x: 10, y: 20 },
      B: { x: 30, y: 40 },
    },
  });

  expect(result).toEqual({
    A: { x: 10, y: 20 },
  });
});
