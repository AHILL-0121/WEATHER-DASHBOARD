import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache, errorMessage, fetchPlace, getWeather, placeLabel } from './weatherClient';

beforeEach(clearCache);

const response = (status, body) => new Response(body === undefined ? '' : JSON.stringify(body), { status });

describe('errorMessage (BUG-05)', () => {
  it('names the city on 404', async () => {
    expect(await errorMessage(response(404), 'Atlantis')).toBe('No place called "Atlantis" was found.');
  });

  it('prefers the server message', async () => {
    expect(await errorMessage(response(503, { error: 'Weather service is busy.' }))).toBe(
      'Weather service is busy.',
    );
  });

  it('falls back by status when the body is not JSON', async () => {
    expect(await errorMessage(new Response('oops', { status: 429 }))).toMatch(/Too many requests/);
    expect(await errorMessage(new Response('oops', { status: 500 }))).toMatch(/unavailable/);
  });
});

describe('fetchPlace', () => {
  it('returns the place when it has a name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { name: 'Paris', country: 'FR' })));
    expect(await fetchPlace(48.85, 2.35)).toEqual({ name: 'Paris', country: 'FR' });
    expect(fetch.mock.calls[0][0]).toBe('/api/geocode/reverse?lat=48.85&lon=2.35');
  });

  it('returns null for unnamed points and failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, null)));
    expect(await fetchPlace(0, -30)).toBeNull();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    expect(await fetchPlace(0, -30)).toBeNull();
  });

  it('rethrows aborts so stale requests stop', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(fetchPlace(1, 1)).rejects.toThrow('aborted');
  });
});

describe('placeLabel (BUG-06)', () => {
  it('joins city and country', () => {
    expect(placeLabel({ city: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 })).toBe('Paris, FR');
  });

  it('labels unnamed points with coordinates, including 0', () => {
    expect(placeLabel({ city: '', lat: 0, lon: -30.5 })).toBe('Unnamed location · 0.00°, -30.50°');
  });
});

describe('getWeather', () => {
  it('requests by coordinates when valid, otherwise by city', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(200, { city: 'X' })),
    );
    await getWeather({ city: 'Paris', lat: 0, lon: 0 });
    await getWeather({ city: 'Paris' });
    expect(fetch.mock.calls.map((c) => c[0])).toEqual([
      '/api/weather?lat=0&lon=0',
      '/api/weather?city=Paris',
    ]);
  });

  it('reuses a successful result for 5 minutes', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => response(200, { city: 'Paris' })),
      );
      await getWeather({ city: 'Paris' });
      await getWeather({ city: 'Paris' });
      expect(fetch).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(5 * 60_000 + 1);
      await getWeather({ city: 'Paris' });
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not cache failures, and throws a readable message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response(404)),
    );
    await expect(getWeather({ city: 'Atlantis' })).rejects.toThrow('No place called "Atlantis" was found.');
    await expect(getWeather({ city: 'Atlantis' })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
