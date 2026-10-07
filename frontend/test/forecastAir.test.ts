import { beforeEach, describe, expect, it, vi } from 'vitest';
import forecast from '../pages/api/forecast';
import air from '../pages/api/air';
import { call, mockUpstream, upstreamUrl } from './apiHelpers';

const BASE = Date.UTC(2026, 9, 7) / 1000; // 2026-10-07 00:00 UTC
const IST = 19800; // UTC+5:30, so local days don't line up with UTC days

// 10 steps, 00:00–03:00 UTC next day. Local (IST) times run 05:30 … 08:30 next day:
// steps 0–6 fall on 2026-10-07 and steps 7–9 on 2026-10-08.
const STEPS = Array.from({ length: 10 }, (_, i) => ({
  dt: BASE + i * 3 * 3600,
  main: { temp: 10 + i, temp_min: 9 + i, temp_max: 11 + i },
  weather: [
    i === 2
      ? { main: 'Rain', icon: '10d' }
      : i === 9
        ? { main: 'Clear', icon: '01d' }
        : { main: 'Clouds', icon: '04d' },
  ],
  wind: { speed: 2 },
  pop: i === 4 ? 0.35 : 0,
}));
const OW_FORECAST = { list: STEPS, city: { timezone: IST } };

const OW_AIR = {
  list: [{ dt: BASE, main: { aqi: 2 }, components: { pm2_5: 8.1, pm10: 12, o3: 60, nh3: 1 } }],
};

beforeEach(() => {
  vi.stubEnv('OPENWEATHER_API_KEY', 'test-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('/api/forecast (UX-01)', () => {
  it('calls the 5-day forecast with rounded coordinates and metric units', async () => {
    const fetchMock = mockUpstream(OW_FORECAST);
    const res = await call(forecast, { lat: '28.6139', lon: '77.2090' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toMatch(/s-maxage=300/);
    const url = upstreamUrl(fetchMock);
    expect(url.pathname).toBe('/data/2.5/forecast');
    expect(url.searchParams.get('lat')).toBe('28.61');
    expect(url.searchParams.get('units')).toBe('metric');
  });

  it('returns the next 24 h as 8 three-hour steps', async () => {
    mockUpstream(OW_FORECAST);
    const { body } = await call(forecast, { lat: '28.61', lon: '77.21' });
    expect(body.timezone).toBe(IST);
    expect(body.hourly).toHaveLength(8);
    expect(body.hourly[0]).toEqual({
      time: BASE,
      temp: 10,
      condition: 'Clouds',
      icon: 'https://openweathermap.org/img/wn/04d@2x.png',
      pop: 0,
      wind_speed: 2,
    });
    expect(body.hourly[4].pop).toBe(35);
  });

  it('groups days in the location timezone, not UTC', async () => {
    mockUpstream(OW_FORECAST);
    const { body } = await call(forecast, { lat: '28.61', lon: '77.21' });
    expect(body.daily).toEqual([
      // Steps 0–6; step 2 (11:30 local) is nearest noon
      {
        date: '2026-10-07',
        temp_min: 9,
        temp_max: 17,
        condition: 'Rain',
        icon: expect.stringContaining('10d'),
        pop: 35,
      },
      // Steps 7–9; step 9 (08:30 local) is nearest noon
      {
        date: '2026-10-08',
        temp_min: 16,
        temp_max: 20,
        condition: 'Clear',
        icon: expect.stringContaining('01d'),
        pop: 0,
      },
    ]);
  });

  it('sorts steps that arrive out of order', async () => {
    mockUpstream({ ...OW_FORECAST, list: [...STEPS].reverse() });
    const { body } = await call(forecast, { lat: '28.61', lon: '77.21' });
    expect(body.hourly.map((h: { time: number }) => h.time)).toEqual(STEPS.slice(0, 8).map((s) => s.dt));
    expect(body.daily.map((d: { date: string }) => d.date)).toEqual(['2026-10-07', '2026-10-08']);
  });

  it('treats a missing pop as 0 % and a missing city as UTC', async () => {
    const noPop: Partial<(typeof STEPS)[number]> = { ...STEPS[0]! };
    delete noPop.pop;
    mockUpstream({ list: [noPop] });
    const { body, statusCode } = await call(forecast, { lat: '0', lon: '0' });
    expect(statusCode).toBe(200);
    expect(body.timezone).toBe(0);
    expect(body.hourly[0].pop).toBe(0);
    expect(body.daily[0].date).toBe('2026-10-07');
  });

  it.each([[{}], [{ city: 'London' }], [{ lat: '91', lon: '0' }]])('rejects %j with 400', async (query) => {
    const fetchMock = mockUpstream(OW_FORECAST);
    expect((await call(forecast, query)).statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 502 for an empty or malformed list', async () => {
    mockUpstream({ list: [] });
    expect((await call(forecast, { lat: '0', lon: '0' })).statusCode).toBe(502);
    mockUpstream({ list: [{ dt: BASE }] });
    expect((await call(forecast, { lat: '0', lon: '0' })).statusCode).toBe(502);
  });

  it('allows only GET', async () => {
    expect((await call(forecast, { lat: '0', lon: '0' }, { method: 'POST' })).statusCode).toBe(405);
  });
});

describe('/api/air (UX-09)', () => {
  it('returns the index and known pollutants only', async () => {
    const fetchMock = mockUpstream(OW_AIR);
    const res = await call(air, { lat: '51.5', lon: '-0.12' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ aqi: 2, time: BASE, components: { pm2_5: 8.1, pm10: 12, o3: 60 } });
    expect(upstreamUrl(fetchMock).pathname).toBe('/data/2.5/air_pollution');
    expect(upstreamUrl(fetchMock).searchParams.has('units')).toBe(false);
  });

  it.each([[{ list: [] }], [{ list: [{ dt: BASE, main: { aqi: 7 }, components: {} }] }]])(
    'returns 502 for unexpected data %j',
    async (body) => {
      mockUpstream(body);
      expect((await call(air, { lat: '0', lon: '0' })).statusCode).toBe(502);
    },
  );

  it('rejects missing coordinates', async () => {
    expect((await call(air, { lat: '1' })).statusCode).toBe(400);
  });

  it('maps upstream errors', async () => {
    mockUpstream({}, 429);
    expect((await call(air, { lat: '0', lon: '0' })).statusCode).toBe(503);
  });
});
