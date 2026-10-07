import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const hero = (page: Page) => page.locator('section[aria-labelledby="place-name"]');

test.describe('dashboard', () => {
  test('opens on the first saved place with forecast and details', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');
    await expect(page).toHaveTitle('27° Pune · Weather Dashboard');
    await expect(hero(page)).toContainText('Broken clouds');
    await expect(hero(page)).toContainText('likely from'); // forecast summary

    await expect(page.getByRole('radiogroup', { name: 'Next 24 hours' }).getByRole('radio')).toHaveCount(9);
    await expect(page.getByRole('heading', { name: /-day forecast/ })).toBeVisible();
    for (const panel of [
      'Feels like',
      'Wind',
      'Humidity',
      'Precipitation',
      'Pressure',
      'Air quality',
      'Visibility',
    ]) {
      // Names include the "More info" button where a panel has one
      await expect(page.getByRole('heading', { name: new RegExp(`^${panel}`) })).toBeVisible();
    }
    await expect(page.getByText('Fair')).toBeVisible();
  });

  test('searches with the keyboard, saves the place and remembers it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');

    await page.keyboard.press('ControlOrMeta+k');
    const combobox = page.getByRole('combobox', { name: 'Search a city' });
    await expect(combobox).toBeFocused();
    await combobox.fill('Par');
    await expect(page.getByRole('option')).toHaveCount(2);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paris');
    await expect(hero(page)).toContainText('France');
    const saved = page.getByRole('list', { name: 'Saved places' });
    await expect(saved.getByRole('button', { name: /^Paris/ })).toHaveAttribute('aria-current', 'true');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paris');

    // Recent searches appear before typing
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('option')).toHaveText(['Use my current location', 'Paris France']);
  });

  test('switches between saved places and removes one', async ({ page }) => {
    await page.goto('/');
    const saved = page.getByRole('list', { name: 'Saved places' });
    await saved.getByRole('button', { name: /^London/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('London');
    await expect(hero(page)).toContainText('Light rain');

    await saved.getByRole('button', { name: 'Remove Tokyo from saved places' }).click();
    await expect(saved.getByRole('button', { name: /^Tokyo/ })).toHaveCount(0);
  });

  test('units and theme are remembered across reloads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');

    await page.getByRole('button', { name: 'Fahrenheit' }).click();
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveTitle('81° Pune · Weather Dashboard');

    await page.reload();
    // Applied by theme-init.js before React loads, so there's no light flash
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveTitle('81° Pune · Weather Dashboard');
    await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking the map loads that spot and names it', async ({ page }) => {
    await page.goto('/');
    const map = page.locator('.leaflet-container');
    await map.scrollIntoViewIfNeeded();
    await map.click({ position: { x: 120, y: 120 } });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lyon');
    await expect(hero(page)).toContainText('France');
  });

  test('map tiles come from MapTiler and follow the theme (UX-11)', async ({ page }) => {
    await page.goto('/');
    const map = page.locator('.leaflet-container');
    await map.scrollIntoViewIfNeeded();
    test.skip(
      await page.getByText('Map tiles need NEXT_PUBLIC_MAPTILER_KEY').isVisible(),
      'Built without a MapTiler key',
    );

    const tile = map.locator('img.leaflet-tile').first();
    await expect(tile).toHaveAttribute('src', /^https:\/\/api\.maptiler\.com\/maps\/dataviz\/256\//);
    await expect(map.getByRole('link', { name: 'MapTiler', exact: true })).toBeVisible();
    await expect(map.locator('.leaflet-control-attribution')).toContainText('© OpenStreetMap contributors');

    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(tile).toHaveAttribute('src', /\/maps\/dataviz-dark\/256\//);
  });

  test('keeps the last weather, under its own name, on a failed load and retries', async ({ page }) => {
    let fail = false;
    await page.route('**/api/weather**', (route) =>
      fail
        ? route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: '{"error":"Weather service is busy."}',
          })
        : route.fallback(),
    );
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');

    // A spot that isn't cached yet, so a request is really made
    fail = true;
    const map = page.locator('.leaflet-container');
    await map.scrollIntoViewIfNeeded();
    await map.click({ position: { x: 120, y: 120 } });

    // Next.js adds its own (empty) route announcer with role=alert
    const alert = page.locator('main [role="alert"]');
    await expect(alert).toContainText("Couldn't refresh. Weather service is busy.");
    // Still Pune's weather, so still labelled Pune, not the clicked spot
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pune');

    fail = false;
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(alert).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lyon');
  });

  test('the hourly strip works from the keyboard', async ({ page }) => {
    await page.goto('/');
    const radios = page.getByRole('radiogroup', { name: 'Next 24 hours' }).getByRole('radio');
    await radios.first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(2)).toBeFocused();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('End');
    await expect(radios.last()).toBeFocused();
  });

  test('never scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('radiogroup', { name: 'Next 24 hours' })).toBeVisible();
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(client);
  });
});
