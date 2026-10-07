import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// End-to-end tests against the production build (`npm run build` first).
// The browser's /api calls are answered with fixtures (e2e/fixtures.ts), so no
// OpenWeather key is needed and results don't depend on real weather.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // A local `next start` build inlines Turbopack's bootstrap script, which
    // our CSP (script-src 'self') blocks, so the app never hydrates. Vercel
    // serves that script as a file and is unaffected. See plan item SEC-05.
    bypassCSP: true,
    // Locally, use the installed Chrome instead of downloading Chromium
    channel: process.env.CI ? undefined : 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
