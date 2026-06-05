import { expect, test } from '@playwright/test';

const pastedSource = `flowchart LR
  AAA[Pasted Start] --> BBB{Decide}
  BBB -->|yes| CCC[Done Node]
  BBB -->|no| AAA`;

test('shows the default app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mermaid Flow Studio')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /mermaid input/i })).toBeVisible();
});

test('auto-renders edited source without a manual render click', async ({ page }) => {
  await page.goto('/');

  const preview = page.getByTestId('diagram-preview');
  await expect(preview.locator('svg')).toBeVisible();

  await page.getByRole('textbox', { name: /mermaid input/i }).fill(pastedSource);

  await expect(preview).toContainText('Done Node', { timeout: 5000 });
  await expect(preview).not.toContainText('Brain Agent');
});

test('re-fits the diagram when the window is resized', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('diagram-preview').locator('svg')).toBeVisible();

  await page.setViewportSize({ width: 920, height: 720 });
  const zoomNarrow = await page.getByTestId('zoom-level').textContent();

  await page.setViewportSize({ width: 1600, height: 900 });
  await expect
    .poll(async () => page.getByTestId('zoom-level').textContent())
    .not.toBe(zoomNarrow);
});

test('accepts the legacy graph alias', async ({ page }) => {
  await page.goto('/');
  const preview = page.getByTestId('diagram-preview');
  await expect(preview.locator('svg')).toBeVisible();

  await page.getByRole('textbox', { name: /mermaid input/i }).fill('graph TD\n  G1[Graph Alias] --> G2[Works]');
  await expect(preview).toContainText('Graph Alias', { timeout: 5000 });
});

test('shows an error near the preview but keeps the last good diagram on invalid edit', async ({ page }) => {
  await page.goto('/');
  const preview = page.getByTestId('diagram-preview');
  await expect(preview).toContainText('Brain Agent', { timeout: 5000 });

  await page.getByRole('textbox', { name: /mermaid input/i }).fill('sequenceDiagram\n  A->>B: hi');

  // Error surfaces in the preview pane (role=alert), and the previous diagram is preserved.
  await expect(page.locator('.preview-stage__error')).toBeVisible();
  await expect(preview).toContainText('Brain Agent');
});

test('toggles dark theme and keeps the diagram rendered', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('diagram-preview').locator('svg')).toBeVisible();

  await page.getByRole('button', { name: '切换深浅主题' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('diagram-preview').locator('svg')).toBeVisible();
});
