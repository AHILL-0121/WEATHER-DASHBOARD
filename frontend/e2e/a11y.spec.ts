import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Fails on serious or critical WCAG 2.2 A/AA issues (definition of done: axe
// reports 0 serious/critical). Minor and moderate ones are printed only.
async function audit(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // Map tiles are third-party images with their own attribution text
    .exclude('.leaflet-tile-pane')
    .analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  for (const v of violations.filter((x) => !blocking.includes(x))) {
    console.log(`[${label}] ${v.impact}: ${v.id} (${v.nodes.length})`);
  }
  expect(
    blocking.map((v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`),
    label,
  ).toEqual([]);
}

async function ready(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');
  await expect(page.getByRole('radiogroup', { name: 'Next 24 hours' })).toBeVisible();
  await expect(page.getByText('Fair')).toBeVisible();
}

test.describe('accessibility (axe)', () => {
  test('light theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await ready(page);
    await audit(page, 'light');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await ready(page);
    await audit(page, 'dark');
  });

  test('search dialog and an expanded day', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: /^Today/ }).click();
    await audit(page, 'expanded day');

    await page.keyboard.press('ControlOrMeta+k');
    await page.getByRole('combobox').fill('Par');
    await expect(page.getByRole('option')).toHaveCount(2);
    await audit(page, 'search');
  });

  test('404 page', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await audit(page, '404');
  });
});
