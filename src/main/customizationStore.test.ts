import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { createCustomizationStore } from './customizationStore';

describe('customizationStore', () => {
  test('writes and reloads a file-scoped customization record', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'mermaid-flow-store-'));
    const store = createCustomizationStore(tempDir);

    await store.save('/tmp/example.mmd', {
      paletteId: 'studio-default',
      direction: 'down',
      layoutMode: 'fixed',
      layoutsByDirection: {},
      lastSourceHash: 'abc123',
      updatedAt: '2026-03-12T08:00:00.000Z',
    });

    await expect(store.load('/tmp/example.mmd')).resolves.toMatchObject({
      paletteId: 'studio-default',
      direction: 'down',
      layoutMode: 'fixed',
    });
  });
});
