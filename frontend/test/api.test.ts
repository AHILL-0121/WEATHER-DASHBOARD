import { beforeEach, describe, expect, it, vi } from 'vitest';
import weather from '../pages/api/weather';
import geocode from '../pages/api/geocode/index';
import reverse from '../pages/api/geocode/reverse';
import { parseLatLon, parseQuery } from '../lib/openweather';
import { call, mockUpstream, upstreamUrl } from './apiHelpers';

const OW_WEATHER = {
  name: 'London',
  coord: { lat: 51.51, lon: -0.13 },
  sys: { country: 'GB', sunrise: 1, sunset: 2 },
  main: { temp: 12, feels_like: 11, temp_min: 10, temp_max: 14, humidity: 80, pressure: 1012 },
  weather: [{ main: 'Clouds', description: 'broken clouds', icon: '04d' }],
  wind: { speed: 3, deg: 200, gust: 7 },
  clouds: { all: 75 },
  visibility: 10000,
  timezone: 3600,
};

beforeEach(() => {
  vi.stubEnv('OPENWEATHER_API_KEY', 'test-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('input parsing (SEC-03)', () => {
  it.each([
    [
      { lat: '51.5', lon: '-0.12' },
      { lat: 51.5, lon: -0.12 },
    ],
    [
      { lat: '0', lon: '0' },
      { lat: 0, lon: 0 },
    ],
    [
      { lat: '12.3456', lon: '98.7654' },
      { lat: 12.35, lon: 98.77 },
    ],
  ])('accepts %j', (query, expected) => {
    expect(parseLatLon(query)).toEqual(expected);
  });

  it.each([
    [{ lat: '91', lon: '0' }],
    [{ lat: '0', lon: '-181' }],
    [{ lat: 'abc', lon: '0' }],
    [{ lat: '', lon: '0' }],
    [{ lat: ['1', '2'], lon: '0' }],
    [{ lat: '10', lon: '10&appid=x' }],
    [{ lat: 'Infinity', lon: '0' }],
    [{ lon: '0' }],
  ])('rejects %j', (query) => {
    expect(parseLatLon(query)).toBeNull();
  });

  it('trims and length-caps queries', () => {
    expect(parseQuery('  Paris ')).toBe('Paris');
    expect(parseQuery('a'.repeat(100))).toHaveLength(100);
    expect(parseQuery('a'.repeat(101))).toBeNull();
    expect(parseQuery('   ')).toBeNull();
    expect(parseQuery(['Paris', 'Rome'])).toBeNull();
  });
});

describe('/api/weather', () => {
  it('returns trimmed weather data with cache headers', async () => {
    mockUpstream(OW_WEATHER);
    const res = await call(weather, { city: 'London' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      city: 'London',
      country: 'GB',
      temp: 12,
      condition: 'Clouds',
      description: 'Broken clouds',
      wind_gust: 7,
    });
    expect(res.headers['cache-control']).toMatch(/s-maxage=300/);
  });

  it('builds the upstream URL safely, with the key added server-side (SEC-02, SEC-03)', async () => {
    const fetchMock = mockUpstream(OW_WEATHER);
    await call(weather, { city: 'São Paulo&appid=evil' });
    const url = upstreamUrl(fetchMock);
    expect(url.origin).toBe('https://api.openweathermap.org');
    expect(url.searchParams.get('q')).toBe('São Paulo&appid=evil');
    expect(url.searchParams.getAll('appid')).toEqual(['test-key']);
  });

  it('prefers valid coordinates, rounded to 2 dp', async () => {
    const fetchMock = mockUpstream(OW_WEATHER);
    await call(weather, { lat: '51.50734', lon: '-0.12776', city: 'ignored' });
    const url = upstreamUrl(fetchMock);
    expect(url.searchParams.get('lat')).toBe('51.51');
    expect(url.searchParams.get('lon')).toBe('-0.13');
    expect(url.searchParams.has('q')).toBe(false);
  });

  it.each([[{}], [{ lat: '999', lon: '0' }], [{ city: '' }], [{ city: 'x'.repeat(101) }]])(
    'rejects %j with 400 without calling upstream',
    async (query) => {
      const fetchMock = mockUpstream(OW_WEATHER);
      const res = await call(weather, query);
      expect(res.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('allows only GET (SEC-04)', async () => {
    const res = await call(weather, { city: 'London' }, { method: 'POST' });
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe('GET');
  });

  it.each([
    [404, 404, /not found/i],
    [401, 502, /service error/i],
    [429, 503, /busy/i],
    [500, 502, /service error/i],
  ])('maps upstream %i to %i (SEC-06)', async (upstream, expected, message) => {
    mockUpstream({ message: 'upstream' }, upstream);
    const res = await call(weather, { city: 'London' });
    expect(res.statusCode).toBe(expected);
    expect(res.body.error).toMatch(message);
    expect(console.error).toHaveBeenCalled();
  });

  it('returns 504 when upstream is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const res = await call(weather, { city: 'London' });
    expect(res.statusCode).toBe(504);
  });

  it('adds up the last hour of rain and snow', async () => {
    mockUpstream({ ...OW_WEATHER, rain: { '1h': 0.6 }, snow: { '1h': 0.2 } });
    expect((await call(weather, { city: 'London' })).body.precip_1h).toBeCloseTo(0.8);
    mockUpstream(OW_WEATHER);
    expect((await call(weather, { city: 'London' })).body.precip_1h).toBe(0);
  });

  it('survives partial payloads such as ocean points (BUG-06)', async () => {
    mockUpstream({ ...OW_WEATHER, name: '', sys: undefined, wind: undefined, clouds: undefined });
    const res = await call(weather, { lat: '0', lon: '-30' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ city: '', country: undefined, wind_speed: undefined });
  });

  it('returns 502 when required fields are missing', async () => {
    mockUpstream({ ...OW_WEATHER, main: undefined });
    const res = await call(weather, { city: 'London' });
    expect(res.statusCode).toBe(502);
  });

  it('fails clearly when the API key is not configured', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', '');
    const res = await call(weather, { city: 'London' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/not configured/);
  });

  it('rate-limits a single IP after 60 requests a minute (SEC-04)', async () => {
    mockUpstream(OW_WEATHER);
    const codes = [];
    for (let i = 0; i < 61; i++)
      codes.push((await call(weather, { city: 'London' }, { ip: '203.0.113.9' })).statusCode);
    expect(codes.slice(0, 60).every((c) => c === 200)).toBe(true);
    expect(codes[60]).toBe(429);
    // Another client is unaffected
    expect((await call(weather, { city: 'London' })).statusCode).toBe(200);
  });
});

describe('/api/geocode', () => {
  it('returns up to 5 places with only the fields the UI needs', async () => {
    const fetchMock = mockUpstream([
      { name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35, local_names: {} },
    ]);
    const res = await call(geocode, { q: 'Par' });
    expect(res.body).toEqual([{ name: 'Paris', state: undefined, country: 'FR', lat: 48.85, lon: 2.35 }]);
    expect(upstreamUrl(fetchMock).searchParams.get('limit')).toBe('5');
  });

  it('requires at least 2 characters', async () => {
    expect((await call(geocode, { q: 'P' })).statusCode).toBe(400);
  });
});

describe('/api/geocode/reverse', () => {
  it('returns the nearest place, or null for open water', async () => {
    mockUpstream([{ name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 }]);
    expect((await call(reverse, { lat: '48.85', lon: '2.35' })).body).toMatchObject({ name: 'Paris' });
    mockUpstream([]);
    expect((await call(reverse, { lat: '0', lon: '-30' })).body).toBeNull();
  });

  it('rejects invalid coordinates', async () => {
    expect((await call(reverse, { lat: 'x', lon: '1' })).statusCode).toBe(400);
  });
});
