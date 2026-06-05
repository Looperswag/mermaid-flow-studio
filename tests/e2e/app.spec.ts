import { expect, test } from '@playwright/test';

test('shows the default app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mermaid Flow Studio')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /mermaid input/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /palette/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /direction/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /free/i })).toBeVisible();
});

const pastedSource = `flowchart TD
  P[Pasted Start] --> Q{Check}
  Q -->|yes| R[Done Node]
  Q -->|no| P`;

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
  const canvas = page.locator('.preview-stage__canvas');
  await expect(canvas).toBeVisible();

  await page.setViewportSize({ width: 1200, height: 800 });
  const transformA = await canvas.evaluate((el) => (el as HTMLElement).style.transform);

  await page.setViewportSize({ width: 1780, height: 1000 });
  await expect
    .poll(async () => canvas.evaluate((el) => (el as HTMLElement).style.transform))
    .not.toBe(transformA);
});
