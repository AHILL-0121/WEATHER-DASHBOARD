import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The place on screen lives in the URL, so links and bookmarks reopen it (UX-06)

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const saved = (page: Page) => page.getByRole('list', { name: 'Saved places' });
const search = (page: Page) => new URL(page.url()).search;

/** The points the forecast was asked for, in order (only the place on screen
    gets one; the saved places' weather comes from /api/weather too) */
function forecastRequests(page: Page) {
  const points: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname === '/api/forecast')
      points.push(`${url.searchParams.get('lat')},${url.searchParams.get('lon')}`);
  });
  return points;
}

test.describe('links', () => {
  test('the address bar follows the place shown, without adding history', async ({ page }) => {
    await page.goto('/');
    await expect(heading(page)).toHaveText('Pune');
    await expect.poll(() => search(page)).toBe('?lat=18.52&lon=73.86&name=Pune&state=Maharashtra&country=IN');
    const length = await page.evaluate(() => history.length);

    await saved(page)
      .getByRole('button', { name: /^London/ })
      .click();
    await expect(heading(page)).toHaveText('London');
    await expect.poll(() => search(page)).toBe('?lat=51.51&lon=-0.13&name=London&state=England&country=GB');
    expect(await page.evaluate(() => history.length)).toBe(length);
  });

  test("a link opens its place first, without replacing the visitor's own", async ({ page }) => {
    const requests = forecastRequests(page);
    await page.goto('/?lat=35.68&lon=139.69&name=Tokyo&country=JP');
    await expect(heading(page)).toHaveText('Tokyo');
    await expect(saved(page).getByRole('button', { name: /^Tokyo/ })).toHaveAttribute('aria-current', 'true');
    expect(requests).toEqual(['35.68,139.69']); // no detour through the default place

    await page.goto('/');
    await expect(heading(page)).toHaveText('Pune');
  });

  test('a link to an unnamed point gets named', async ({ page }) => {
    await page.goto('/?lat=45.76&lon=4.84');
    await expect(heading(page)).toHaveText('Lyon');
    await expect.poll(() => search(page)).toBe('?lat=45.76&lon=4.84&name=Lyon&country=FR');
  });

  test('?q= opens the first match', async ({ page }) => {
    const requests = forecastRequests(page);
    await page.goto('/?q=Paris');
    await expect(heading(page)).toHaveText('Paris');
    await expect.poll(() => search(page)).toBe('?lat=48.85&lon=2.35&name=Paris&country=FR');
    expect(requests).toEqual(['48.85,2.35']);
  });

  test('?q= with no match says so and shows the usual place', async ({ page }) => {
    await page.route('**/api/geocode?*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/?q=Atlantis');
    await expect(page.getByRole('alert').filter({ hasText: 'Atlantis' })).toHaveText(
      'No place called "Atlantis" was found.',
    );
    await expect(heading(page)).toHaveText('Pune');
    await expect.poll(() => search(page)).toContain('name=Pune');
  });

  test('bad coordinates are ignored', async ({ page }) => {
    await page.goto('/?lat=999&lon=abc');
    await expect(heading(page)).toHaveText('Pune');
    await expect.poll(() => search(page)).toContain('name=Pune');
  });
});
