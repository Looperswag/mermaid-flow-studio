# Mermaid Chat App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an offline macOS Electron app with a chatbot-inspired UI that renders Mermaid `flowchart` diagrams locally and exports them as `PNG` or `JPG` in low, medium, and high resolutions.

**Architecture:** Use Electron for the desktop shell and native file/export dialogs, React for the renderer UI, and Mermaid to produce SVG previews locally. Convert successful SVG renders into bitmap exports through a shared renderer utility so preview and export stay visually consistent.

**Tech Stack:** Electron, React, Vite, TypeScript, Vitest, React Testing Library, Playwright, Mermaid, electron-builder

---

### Task 1: Scaffold the desktop app

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `electron.vite.config.ts` or equivalent build config
- Create: `index.html`
- Create: `src/main/main.ts`
- Create: `src/main/preload.ts`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/styles/app.css`
- Create: `.gitignore`
- Test: `src/renderer/App.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('shows the app shell title', () => {
  render(<App />);
  expect(screen.getByText('Mermaid Flow Studio')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: FAIL because the project files and test runner are not configured yet

**Step 3: Write minimal implementation**

Create the Electron + React + Vite project skeleton with a minimal `App` component that renders the product title and root layout container.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold electron mermaid app"
```

### Task 2: Add the chatbot-style shell layout

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/styles/app.css`
- Create: `src/renderer/components/TopBar.tsx`
- Create: `src/renderer/components/ChatPanel.tsx`
- Create: `src/renderer/components/PreviewPanel.tsx`
- Create: `src/renderer/components/Composer.tsx`
- Test: `src/renderer/components/AppShell.test.tsx`

**Step 1: Write the failing test**

```tsx
test('renders chat panel, preview panel, and composer', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: /chat timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /diagram preview/i })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /mermaid input/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- AppShell.test.tsx`
Expected: FAIL because the shell regions do not exist yet

**Step 3: Write minimal implementation**

Add the main split layout, top bar actions, a chat timeline region, a preview region, and the bottom composer with labeled controls.

**Step 4: Run test to verify it passes**

Run: `npm test -- AppShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: build chatbot shell layout"
```

### Task 3: Seed the app with a default flowchart sample

**Files:**
- Create: `src/renderer/lib/defaultDiagram.ts`
- Modify: `src/renderer/App.tsx`
- Test: `src/renderer/lib/defaultDiagram.test.ts`

**Step 1: Write the failing test**

```ts
import { defaultDiagram } from './defaultDiagram';

test('default diagram starts with flowchart', () => {
  expect(defaultDiagram.startsWith('flowchart')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- defaultDiagram.test.ts`
Expected: FAIL because the default diagram module does not exist

**Step 3: Write minimal implementation**

Create a default Mermaid sample and load it into the initial composer state so first launch already shows meaningful content.

**Step 4: Run test to verify it passes**

Run: `npm test -- defaultDiagram.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add default flowchart sample"
```

### Task 4: Add input validation for supported diagrams

**Files:**
- Create: `src/renderer/lib/validateMermaid.ts`
- Modify: `src/renderer/App.tsx`
- Test: `src/renderer/lib/validateMermaid.test.ts`

**Step 1: Write the failing test**

```ts
import { validateMermaid } from './validateMermaid';

test('rejects non-flowchart diagrams', () => {
  const result = validateMermaid('sequenceDiagram\nAlice->>Bob: Hi');
  expect(result.valid).toBe(false);
  expect(result.message).toMatch(/flowchart/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- validateMermaid.test.ts`
Expected: FAIL because validation does not exist

**Step 3: Write minimal implementation**

Implement validation for:
- empty input
- unsupported diagram types
- input that does not start with `flowchart`

**Step 4: Run test to verify it passes**

Run: `npm test -- validateMermaid.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: validate supported mermaid input"
```

### Task 5: Render Mermaid locally to SVG

**Files:**
- Create: `src/renderer/lib/renderMermaid.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/PreviewPanel.tsx`
- Test: `src/renderer/lib/renderMermaid.test.ts`

**Step 1: Write the failing test**

```ts
import { renderMermaid } from './renderMermaid';

test('returns svg markup for a flowchart', async () => {
  const result = await renderMermaid('flowchart TD\nA-->B');
  expect(result.svg).toContain('<svg');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- renderMermaid.test.ts`
Expected: FAIL because render helper does not exist

**Step 3: Write minimal implementation**

Initialize Mermaid once, render a diagram string into SVG markup, and surface either the SVG or a user-safe error message.

**Step 4: Run test to verify it passes**

Run: `npm test -- renderMermaid.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: render mermaid diagrams locally"
```

### Task 6: Preserve the last successful preview on failure

**Files:**
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/components/StatusCard.tsx`
- Test: `src/renderer/App.render-state.test.tsx`

**Step 1: Write the failing test**

```tsx
test('keeps the previous successful preview when the next render fails', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /render/i }));
  const preview = await screen.findByTestId('diagram-preview');
  const previousMarkup = preview.innerHTML;

  await userEvent.clear(screen.getByRole('textbox', { name: /mermaid input/i }));
  await userEvent.type(screen.getByRole('textbox', { name: /mermaid input/i }), 'sequenceDiagram\nA->>B: nope');
  await userEvent.click(screen.getByRole('button', { name: /render/i }));

  expect(screen.getByText(/flowchart only/i)).toBeInTheDocument();
  expect(screen.getByTestId('diagram-preview').innerHTML).toBe(previousMarkup);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- App.render-state.test.tsx`
Expected: FAIL because render state preservation is not implemented

**Step 3: Write minimal implementation**

Track:
- current input
- latest successful SVG
- latest render status

Update the status card on errors without replacing the stored good preview.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.render-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: preserve last successful preview on errors"
```

### Task 7: Add zoom and fit controls to the preview canvas

**Files:**
- Modify: `src/renderer/components/PreviewPanel.tsx`
- Modify: `src/renderer/styles/app.css`
- Test: `src/renderer/components/PreviewPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
test('offers zoom controls and fit action', () => {
  render(<PreviewPanel svg="<svg />" scale={1} onZoomIn={vi.fn()} onZoomOut={vi.fn()} onReset={vi.fn()} onFit={vi.fn()} />);
  expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /fit to view/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- PreviewPanel.test.tsx`
Expected: FAIL because the controls are missing

**Step 3: Write minimal implementation**

Add preview toolbar actions for zoom in, zoom out, reset to `100%`, and fit to view, with the preview canvas scaling via CSS transforms.

**Step 4: Run test to verify it passes**

Run: `npm test -- PreviewPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add preview zoom controls"
```

### Task 8: Support opening local Mermaid files

**Files:**
- Modify: `src/main/main.ts`
- Modify: `src/main/preload.ts`
- Create: `src/shared/electron-api.ts`
- Modify: `src/renderer/App.tsx`
- Test: `src/renderer/App.open-file.test.tsx`

**Step 1: Write the failing test**

```tsx
test('loads mermaid text from the desktop bridge', async () => {
  window.mermaidApp.openFile = vi.fn().mockResolvedValue('flowchart TD\nA-->B');
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /open/i }));
  expect(screen.getByRole('textbox', { name: /mermaid input/i })).toHaveValue('flowchart TD\nA-->B');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- App.open-file.test.tsx`
Expected: FAIL because the preload bridge and action do not exist

**Step 3: Write minimal implementation**

Expose a preload API for file open, use Electron dialogs in the main process, and load selected file contents into the composer.

**Step 4: Run test to verify it passes**

Run: `npm test -- App.open-file.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: support opening local mermaid files"
```

### Task 9: Build the export conversion utility

**Files:**
- Create: `src/renderer/lib/exportDiagram.ts`
- Create: `src/renderer/lib/exportDiagram.test.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `src/main/preload.ts`
- Modify: `src/main/main.ts`

**Step 1: Write the failing test**

```ts
import { buildExportBlob } from './exportDiagram';

test('creates a png blob from svg at the requested scale', async () => {
  const blob = await buildExportBlob({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"></svg>',
    format: 'png',
    scale: 2,
    background: 'transparent',
  });

  expect(blob.type).toBe('image/png');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- exportDiagram.test.ts`
Expected: FAIL because export conversion is not implemented

**Step 3: Write minimal implementation**

Implement SVG-to-canvas conversion with:
- format selection for `png` and `jpg`
- scale multipliers `1x`, `2x`, `3x`
- transparent background for PNG
- solid light background for JPG
- safe export padding

**Step 4: Run test to verify it passes**

Run: `npm test -- exportDiagram.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add export conversion utility"
```

### Task 10: Add the export dialog and native save flow

**Files:**
- Create: `src/renderer/components/ExportDialog.tsx`
- Modify: `src/renderer/App.tsx`
- Modify: `src/main/main.ts`
- Modify: `src/main/preload.ts`
- Test: `src/renderer/components/ExportDialog.test.tsx`

**Step 1: Write the failing test**

```tsx
test('lets the user choose format and quality before export', async () => {
  render(<ExportDialog open svg="<svg />" onClose={vi.fn()} onConfirm={vi.fn()} />);
  expect(screen.getByLabelText(/png/i)).toBeChecked();
  expect(screen.getByRole('radio', { name: /medium/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ExportDialog.test.tsx`
Expected: FAIL because the dialog does not exist

**Step 3: Write minimal implementation**

Create a compact export modal that collects:
- format
- quality preset
- background option

Use the preload bridge to save the generated bytes through the native save dialog.

**Step 4: Run test to verify it passes**

Run: `npm test -- ExportDialog.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add export dialog and save flow"
```

### Task 11: Polish the UI for macOS feel

**Files:**
- Modify: `src/renderer/styles/app.css`
- Modify: `src/renderer/components/*.tsx`
- Test: `src/renderer/components/AppShell.test.tsx`

**Step 1: Write the failing test**

```tsx
test('shows export action disabled when no successful render exists', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- AppShell.test.tsx`
Expected: FAIL because disabled-state polish is not applied

**Step 3: Write minimal implementation**

Refine spacing, hierarchy, control states, empty states, and card styling so the app reads as a polished macOS desktop product rather than a raw utility.

**Step 4: Run test to verify it passes**

Run: `npm test -- AppShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: polish desktop interface"
```

### Task 12: Package the app for macOS

**Files:**
- Modify: `package.json`
- Create: `electron-builder.yml` or equivalent builder config
- Create: `build/icon.icns`
- Test: `playwright.config.ts`
- Test: `tests/e2e/app.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from '@playwright/test';

test('launches and shows the default preview shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Mermaid Flow Studio')).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL because end-to-end test setup is not configured

**Step 3: Write minimal implementation**

Add:
- build scripts for dev, test, package
- electron-builder config for mac `.app` and `.dmg`
- lightweight Playwright smoke coverage for the renderer shell

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "build: package mac app for distribution"
```

### Task 13: Final verification

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

There is no new unit test for this task. The failure condition is missing verification evidence.

**Step 2: Run test to verify it fails**

Run:
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run package`

Expected: At least one command fails until the remaining integration issues are fixed

**Step 3: Write minimal implementation**

Fix any packaging, typing, or integration problems discovered by the verification commands and document local usage plus unsigned macOS install steps in `README.md`.

**Step 4: Run test to verify it passes**

Run:
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run package`

Expected: All commands pass and produce a macOS distributable artifact

**Step 5: Commit**

```bash
git add .
git commit -m "docs: add usage and distribution notes"
```
