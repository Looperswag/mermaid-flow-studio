import { beforeEach, expect, test } from 'vitest';

import {
  clearDiagramRenderCache,
  getCachedPresentation,
  setCachedPresentation,
} from './diagramRenderCache';
import type { DiagramPresentation } from './renderDiagramPresentation';

function presentation(tag: string): DiagramPresentation {
  return {
    svg: `<svg>${tag}</svg>`,
    dimensions: { width: 10, height: 10 },
    sourceForRender: tag,
    paletteId: 'studio-default',
    direction: 'down',
  };
}

beforeEach(() => {
  clearDiagramRenderCache();
});

test('returns undefined on a miss and the stored value on a hit', () => {
  expect(getCachedPresentation('studio-default', 'down', 'A')).toBeUndefined();

  const stored = presentation('A');
  setCachedPresentation('studio-default', 'down', 'A', stored);

  expect(getCachedPresentation('studio-default', 'down', 'A')).toBe(stored);
});

test('keys on palette, direction, and source independently', () => {
  const stored = presentation('A');
  setCachedPresentation('studio-default', 'down', 'A', stored);

  expect(getCachedPresentation('harbor-blue', 'down', 'A')).toBeUndefined();
  expect(getCachedPresentation('studio-default', 'up', 'A')).toBeUndefined();
  expect(getCachedPresentation('studio-default', 'down', 'B')).toBeUndefined();
});

test('evicts the least-recently-used entry past the capacity', () => {
  // Capacity is 20. Insert 21 distinct entries; the first inserted should be gone.
  for (let index = 0; index < 21; index += 1) {
    setCachedPresentation('studio-default', 'down', `s${index}`, presentation(`s${index}`));
  }

  expect(getCachedPresentation('studio-default', 'down', 's0')).toBeUndefined();
  expect(getCachedPresentation('studio-default', 'down', 's20')).toBeDefined();
});

test('a hit refreshes recency so it survives further inserts', () => {
  for (let index = 0; index < 20; index += 1) {
    setCachedPresentation('studio-default', 'down', `s${index}`, presentation(`s${index}`));
  }

  // Touch the oldest entry so it is no longer the eviction candidate.
  expect(getCachedPresentation('studio-default', 'down', 's0')).toBeDefined();

  // One more insert evicts s1 (now the LRU), not the freshly touched s0.
  setCachedPresentation('studio-default', 'down', 's20', presentation('s20'));

  expect(getCachedPresentation('studio-default', 'down', 's0')).toBeDefined();
  expect(getCachedPresentation('studio-default', 'down', 's1')).toBeUndefined();
});
