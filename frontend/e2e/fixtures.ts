// Sample API responses for the end-to-end tests. The clock is fixed, so every
// run sees the same times: 09:00 UTC on 7 October 2026.
import { expect, test as base, type Page, type Route } from '@playwright/test';
import type { AirDTO, ForecastDTO, ForecastHourDTO, PlaceDTO, WeatherDTO } from '../lib/types';

export const NOW = Date.UTC(2026, 9, 7, 9) / 1000;
const icon = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;

function weather(o: Partial<WeatherDTO> & Pick<WeatherDTO, 'city' | 'lat' | 'lon'>): WeatherDTO {
  return {
    temp: 20,
    feels_like: 20,
    temp_min: 17,
    temp_max: 23,
    condition: 'Clouds',
    description: 'Broken clouds',
    humidity: 60,
    pressure: 1013,
    wind_speed: 3,
    wind_deg: 250,
    wind_gust: 6,
    visibility: 10_000,
    sunrise: NOW - 3 * 3600,
    sunset: NOW + 8 * 3600,
    clouds: 60,
    precip_1h: 0,
    icon: icon('04d'),
    timezone: 0,
    ...o,
  };
}

export const PLACES = {
  pune: weather({ city: 'Pune', country: 'IN', lat: 18.52, lon: 73.86, temp: 27.4, timezone: 19800 }),
  london: weather({
    city: 'London',
    country: 'GB',
    lat: 51.51,
    lon: -0.13,
    temp: 13.2,
    condition: 'Rain',
    description: 'Light rain',
    icon: icon('10d'),
    precip_1h: 0.6,
    timezone: 3600,
  }),
  newYork: weather({ city: 'New York', country: 'US', lat: 40.71, lon: -74.01, temp: 18, timezone: -14400 }),
  tokyo: weather({ city: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69, temp: 22, timezone: 32400 }),
  paris: weather({ city: 'Paris', country: 'FR', lat: 48.85, lon: 2.35, temp: 16, timezone: 7200 }),
};

export const GEOCODE: PlaceDTO[] = [
  { name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 },
  { name: 'Paris', state: 'Texas', country: 'US', lat: 33.66, lon: -95.56 },
];

function weatherAt(lat: number, lon: number): WeatherDTO {
  const known = Object.values(PLACES).find(
    (w) => Math.abs(w.lat - lat) < 0.05 && Math.abs(w.lon - lon) < 0.05,
  );
  return known ?? weather({ city: '', lat, lon, description: 'Few clouds', icon: icon('02d') });
}

function forecastFor(w: WeatherDTO): ForecastDTO {
  const tz = w.timezone;
  const start = Math.floor(NOW / 10_800) * 10_800;
  const steps: ForecastHourDTO[] = Array.from({ length: 40 }, (_, i) => {
    const rain = i === 3 || i === 4;
    return {
      time: start + i * 10_800,
      temp: Math.round((w.temp + 3 * Math.sin(i / 1.3)) * 10) / 10,
      condition: rain ? 'Rain' : 'Clouds',
      icon: icon(rain ? '10d' : '04d'),
      pop: rain ? 70 : 5,
      wind_speed: 4,
      pressure: 1013 - i * 0.5,
    };
  });
  const byDate = new Map<string, ForecastHourDTO[]>();
  for (const s of steps) {
    const date = new Date((s.time + tz) * 1000).toISOString().slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), s]);
  }
  return {
    timezone: tz,
    hourly: steps.slice(0, 8),
    daily: [...byDate].map(([date, ss]) => ({
      date,
      temp_min: Math.min(...ss.map((s) => s.temp)),
      temp_max: Math.max(...ss.map((s) => s.temp)),
      condition: ss[0]!.condition,
      icon: ss[0]!.icon,
      pop: Math.max(...ss.map((s) => s.pop)),
      steps: ss,
    })),
  };
}

const AIR: AirDTO = { aqi: 2, time: NOW, components: { pm2_5: 9.4, pm10: 15 } };

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Answers every /api call from the fixtures; `override` can take over a path */
export async function mockApi(page: Page, override?: (route: Route, url: URL) => Promise<boolean> | boolean) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (override && (await override(route, url))) return;
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    switch (url.pathname) {
      case '/api/weather':
        return json(route, weatherAt(lat, lon));
      case '/api/forecast':
        return json(route, forecastFor(weatherAt(lat, lon)));
      case '/api/air':
        return json(route, AIR);
      case '/api/geocode':
        return json(route, GEOCODE);
      case '/api/geocode/reverse':
        return json(route, { name: 'Lyon', country: 'FR', lat: 45.76, lon: 4.84 });
      default:
        return json(route, { error: 'Not found' }, 404);
    }
  });
}

/** A test with the clock fixed and the API mocked */
// Every test also fails on a Content-Security-Policy violation, so the real
// CSP from next.config.ts is exercised on every page state (SEC-05)
export const test = base.extend({
  page: async ({ page }, provide) => {
    const violations: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) violations.push(msg.text());
    });
    await page.clock.setFixedTime(new Date(NOW * 1000));
    await mockApi(page);
    await provide(page);
    expect(violations, 'CSP violations').toEqual([]);
  },
});

export { expect };
