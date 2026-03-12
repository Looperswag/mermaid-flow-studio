# Mermaid Flow Customization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add palette selection, fixed/free layout modes, four-direction flowchart orientation, and file-scoped customization persistence without changing the current edit-render-export workflow.

**Architecture:** Keep Mermaid as the source of truth for base SVG generation, then layer a presentation pipeline on top that applies direction, palette, and optional free-layout transforms before preview and export consume the SVG. Persist customization state per opened file in Electron user data, keyed by absolute file path and segmented by direction so free layouts can be restored after restart and reused across source edits for unchanged node ids.

**Tech Stack:** Electron, React, Vite, TypeScript, Vitest, React Testing Library, Playwright, Mermaid

---

### Task 1: Add shared customization types and Electron persistence APIs

**Files:**
- Create: `src/shared/diagram-customization.ts`
- Create: `src/main/customizationStore.ts`
- Modify: `src/shared/electron-api.ts`
- Modify: `src/main/preload.ts`
- Modify: `src/main/main.ts`
- Test: `src/main/customizationStore.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/main/customizationStore.test.ts`
Expected: FAIL because the store and shared customization types do not exist yet

**Step 3: Write minimal implementation**

Create a shared customization model and a JSON-backed store:

```ts
export type DiagramDirection = 'down' | 'up' | 'right' | 'left';
export type DiagramLayoutMode = 'fixed' | 'free';

export interface PersistedNodeLayout {
  x: number;
  y: number;
}

export interface PersistedDiagramCustomization {
  paletteId: string;
  direction: DiagramDirection;
  layoutMode: DiagramLayoutMode;
  layoutsByDirection: Partial<Record<DiagramDirection, Record<string, PersistedNodeLayout>>>;
  lastSourceHash: string;
  updatedAt: string;
}
```

Expose Electron bridge methods for:

- `openFile(): Promise<{ path: string; contents: string } | null>`
- `loadDiagramCustomization(filePath: string): Promise<PersistedDiagramCustomization | null>`
- `saveDiagramCustomization(filePath: string, state: PersistedDiagramCustomization): Promise<void>`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/main/customizationStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/shared/diagram-customization.ts src/main/customizationStore.ts src/shared/electron-api.ts src/main/preload.ts src/main/main.ts src/main/customizationStore.test.ts
git commit -m "feat: add diagram customization persistence bridge"
```

### Task 2: Add direction rewriting and palette helpers

**Files:**
- Create: `src/renderer/lib/flowchartDirection.ts`
- Create: `src/renderer/lib/diagramPalettes.ts`
- Create: `src/renderer/lib/defaultCustomization.ts`
- Test: `src/renderer/lib/flowchartDirection.test.ts`
- Test: `src/renderer/lib/diagramPalettes.test.ts`

**Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest';
import { rewriteFlowchartDirection } from './flowchartDirection';

test('rewrites the leading flowchart direction token', () => {
  const result = rewriteFlowchartDirection('flowchart TD\nA-->B', 'left');
  expect(result).toContain('flowchart RL');
});
```

```ts
import { expect, test } from 'vitest';
import { diagramPalettes } from './diagramPalettes';

test('includes the current palette as the default option', () => {
  expect(diagramPalettes[0]).toMatchObject({
    id: 'studio-default',
    isDefault: true,
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/lib/flowchartDirection.test.ts src/renderer/lib/diagramPalettes.test.ts`
Expected: FAIL because the helpers do not exist

**Step 3: Write minimal implementation**

Create helpers that centralize all fixed choices the rest of the app will consume:

```ts
export function rewriteFlowchartDirection(source: string, direction: DiagramDirection) {
  const keyword = { down: 'TD', up: 'BT', right: 'LR', left: 'RL' }[direction];
  return source.replace(/^(\s*flowchart)\s+\w+/i, `$1 ${keyword}`);
}
```

```ts
export const diagramPalettes = [
  {
    id: 'studio-default',
    label: 'Studio',
    isDefault: true,
    themeVariables: {
      primaryColor: '#dbeee5',
      primaryBorderColor: '#1e4f46',
      primaryTextColor: '#142725',
      lineColor: '#355c58',
    },
  },
];
```

Add a `buildDefaultCustomization()` helper that returns the current experience:

- palette: `studio-default`
- direction: `down`
- layout mode: `fixed`

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/lib/flowchartDirection.test.ts src/renderer/lib/diagramPalettes.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/lib/flowchartDirection.ts src/renderer/lib/diagramPalettes.ts src/renderer/lib/defaultCustomization.ts src/renderer/lib/flowchartDirection.test.ts src/renderer/lib/diagramPalettes.test.ts
git commit -m "feat: add diagram palette and direction helpers"
```

### Task 3: Extend Mermaid rendering into a presentation pipeline

**Files:**
- Modify: `src/renderer/lib/renderMermaid.ts`
- Create: `src/renderer/lib/renderDiagramPresentation.ts`
- Create: `src/renderer/lib/renderDiagramPresentation.test.ts`
- Modify: `src/renderer/lib/exportDiagram.ts`
- Modify: `src/renderer/lib/exportDiagram.test.ts`

**Step 1: Write the failing tests**

```ts
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
```

```ts
import { buildExportFileName } from './exportDiagram';

test('builds a timestamped export filename', () => {
  expect(buildExportFileName(new Date('2026-03-10T08:09:10Z'))).toBe(
    'mermaid-export-20260310-080910',
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/lib/renderDiagramPresentation.test.ts src/renderer/lib/exportDiagram.test.ts`
Expected: FAIL because the presentation render helper does not exist and export is still coupled to raw Mermaid SVG assumptions

**Step 3: Write minimal implementation**

Introduce a presentation-layer render result:

```ts
export interface DiagramPresentation {
  svg: string;
  dimensions: SvgDimensions;
  sourceForRender: string;
  paletteId: string;
  direction: DiagramDirection;
}
```

Update Mermaid rendering so each render can receive palette theme variables and a rewritten flowchart direction. Keep export consuming a generic SVG string so later free-layout output can pass through without further export changes.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/lib/renderDiagramPresentation.test.ts src/renderer/lib/exportDiagram.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/lib/renderMermaid.ts src/renderer/lib/renderDiagramPresentation.ts src/renderer/lib/renderDiagramPresentation.test.ts src/renderer/lib/exportDiagram.ts src/renderer/lib/exportDiagram.test.ts
git commit -m "feat: add diagram presentation render pipeline"
```

### Task 4: Restore file-scoped customization state in the app shell

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/ChatPanel.tsx`
- Create: `src/renderer/App.customization-state.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('loads persisted customization when a Mermaid file is opened', async () => {
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
  await screen.getByRole('button', { name: /open/i }).click();

  await waitFor(() => {
    expect(screen.getByRole('combobox', { name: /direction/i })).toHaveValue('left');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/App.customization-state.test.tsx`
Expected: FAIL because the app does not track file paths or customization state yet

**Step 3: Write minimal implementation**

In `App.tsx`, add state for:

- current opened file path
- current palette id
- current direction
- current layout mode
- currently restored free-layout map for the active direction

Apply these rules:

- default sample remains transient in memory and does not persist to disk
- opening a file loads its saved customization if present, otherwise uses defaults
- changing palette, direction, or layout mode immediately updates app state and schedules a save for file-backed diagrams only

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/App.customization-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/App.tsx src/renderer/components/ChatPanel.tsx src/renderer/App.customization-state.test.tsx
git commit -m "feat: restore file customization state in app shell"
```

### Task 5: Add preview toolbar controls for palette, layout mode, and direction

**Files:**
- Modify: `src/renderer/components/PreviewPanel.tsx`
- Modify: `src/renderer/styles/app.css`
- Create: `src/renderer/components/PreviewPanel.controls.test.tsx`

**Step 1: Write the failing test**

```tsx
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
      onPaletteChange={() => undefined}
      onDirectionChange={() => undefined}
      onLayoutModeChange={() => undefined}
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/components/PreviewPanel.controls.test.tsx`
Expected: FAIL because the preview toolbar does not expose customization controls

**Step 3: Write minimal implementation**

Extend the preview toolbar with accessible controls that keep the existing zoom actions intact:

```tsx
<label>
  Palette
  <select aria-label="Palette" value={paletteId} onChange={...}>
    {palettes.map((palette) => (
      <option key={palette.id} value={palette.id}>{palette.label}</option>
    ))}
  </select>
</label>
```

Add:

- a palette selector
- a direction selector
- a `Fixed / Free` radio group

Keep the zoom and fit controls present and unchanged in behavior.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/components/PreviewPanel.controls.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/components/PreviewPanel.tsx src/renderer/styles/app.css src/renderer/components/PreviewPanel.controls.test.tsx
git commit -m "feat: add preview customization controls"
```

### Task 6: Add stable node keys and layout merge helpers

**Files:**
- Create: `src/renderer/lib/extractFlowchartNodeKeys.ts`
- Create: `src/renderer/lib/mergePersistedLayouts.ts`
- Create: `src/renderer/lib/extractFlowchartNodeKeys.test.ts`
- Create: `src/renderer/lib/mergePersistedLayouts.test.ts`

**Step 1: Write the failing tests**

```ts
import { expect, test } from 'vitest';
import { extractFlowchartNodeKeys } from './extractFlowchartNodeKeys';

test('extracts stable Mermaid node ids from flowchart source', () => {
  expect(extractFlowchartNodeKeys('flowchart TD\nA[Start] --> B{Check}')).toEqual(['A', 'B']);
});
```

```ts
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
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/lib/extractFlowchartNodeKeys.test.ts src/renderer/lib/mergePersistedLayouts.test.ts`
Expected: FAIL because stable node-id extraction and layout merge logic do not exist yet

**Step 3: Write minimal implementation**

Implement reusable helpers:

```ts
export function mergePersistedLayouts(input: {
  nodeKeys: string[];
  persistedLayouts: Record<string, PersistedNodeLayout>;
}) {
  return Object.fromEntries(
    input.nodeKeys
      .filter((nodeKey) => nodeKey in input.persistedLayouts)
      .map((nodeKey) => [nodeKey, input.persistedLayouts[nodeKey]]),
  );
}
```

Use source-derived Mermaid node ids as the stable identity for free-layout restoration.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/renderer/lib/extractFlowchartNodeKeys.test.ts src/renderer/lib/mergePersistedLayouts.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/lib/extractFlowchartNodeKeys.ts src/renderer/lib/mergePersistedLayouts.ts src/renderer/lib/extractFlowchartNodeKeys.test.ts src/renderer/lib/mergePersistedLayouts.test.ts
git commit -m "feat: add stable node key layout merge helpers"
```

### Task 7: Implement free-layout dragging and export the composed SVG

**Files:**
- Create: `src/renderer/lib/buildInteractiveDiagramSvg.ts`
- Create: `src/renderer/lib/buildInteractiveDiagramSvg.test.ts`
- Modify: `src/renderer/components/PreviewPanel.tsx`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/lib/exportDiagram.ts`

**Step 1: Write the failing test**

```ts
import { expect, test } from 'vitest';
import { buildInteractiveDiagramSvg } from './buildInteractiveDiagramSvg';

test('applies saved free-layout offsets to matching nodes', () => {
  const result = buildInteractiveDiagramSvg({
    svg: '<svg><g class="node" id="flowchart-A-0"></g></svg>',
    nodeLayouts: { A: { x: 48, y: 24 } },
  });

  expect(result.svg).toContain('translate(48');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/renderer/lib/buildInteractiveDiagramSvg.test.ts`
Expected: FAIL because free-layout SVG composition does not exist yet

**Step 3: Write minimal implementation**

Create a helper that:

- parses Mermaid SVG into a DOM
- locates node groups and maps them back to stable Mermaid node ids
- applies saved layout transforms for free mode
- rewrites connected edge paths and markers after node movement
- returns the final SVG string that preview and export can both reuse

In `PreviewPanel.tsx`, add pointer-based dragging only when `layoutMode === 'free'`. Report updated node positions back to `App.tsx`, then persist them immediately for file-backed diagrams.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/renderer/lib/buildInteractiveDiagramSvg.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/lib/buildInteractiveDiagramSvg.ts src/renderer/lib/buildInteractiveDiagramSvg.test.ts src/renderer/components/PreviewPanel.tsx src/renderer/App.tsx src/renderer/lib/exportDiagram.ts
git commit -m "feat: add free layout dragging and composed export svg"
```

### Task 8: Add regression and end-to-end coverage for persistence and direction-aware layouts

**Files:**
- Modify: `src/renderer/App.test.tsx`
- Modify: `tests/e2e/app.spec.ts`
- Create: `src/renderer/App.free-layout.test.tsx`
- Create: `src/renderer/lib/renderDiagramPresentation.integration.test.ts`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('still shows the app shell title and input composer', () => {
  render(<App />);
  expect(screen.getByText('Mermaid Flow Studio')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /mermaid input/i })).toBeInTheDocument();
});
```

```ts
import { expect, test } from '@playwright/test';

test('restores diagram customization after reopening the same file', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Mermaid Flow Studio')).toBeVisible();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/renderer/App.test.tsx src/renderer/App.free-layout.test.tsx src/renderer/lib/renderDiagramPresentation.integration.test.ts`
Expected: FAIL because the new persistence and free-layout behaviors are not covered yet

Run: `npm run test:e2e -- tests/e2e/app.spec.ts`
Expected: FAIL or remain incomplete until the new interactions are scripted

**Step 3: Write minimal implementation**

Add regression coverage for:

- unchanged app shell defaults
- restored palette, direction, and mode for opened files
- persisted free-layout positions surviving rerender when node ids still exist
- direction-specific layout isolation
- export consuming the composed SVG

Extend Playwright to verify the visible toolbar, switching to free mode, dragging a node, and seeing the same customized state after reopening the same file fixture.

**Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/app.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/renderer/App.test.tsx src/renderer/App.free-layout.test.tsx src/renderer/lib/renderDiagramPresentation.integration.test.ts tests/e2e/app.spec.ts
git commit -m "test: cover flow customization behavior"
```
