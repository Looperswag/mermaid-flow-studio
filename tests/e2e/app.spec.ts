import { expect, test } from '@playwright/test';

test('shows the default app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Mermaid Flow Studio')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /mermaid input/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /palette/i })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /direction/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /free/i })).toBeVisible();
});
