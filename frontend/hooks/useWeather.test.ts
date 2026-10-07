// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useWeather from './useWeather';
import { clearCache } from '../lib/weatherClient';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const LONDON = { city: 'London', lat: 51.51, lon: -0.13 };
const PARIS = { city: 'Paris', lat: 48.85, lon: 2.35 };

beforeEach(clearCache);

// fetch whose responses the test resolves by hand, in any order
function controllableFetch() {
  const calls: { url: string; resolve: (res: Response) => void }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (url: RequestInfo | URL, { signal }: RequestInit = {}) =>
        new Promise((resolve, reject) => {
          calls.push({ url: String(url), resolve });
          signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    ),
  );
  return calls;
}

describe('useWeather', () => {
  it('loads weather and toggles loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(200, LONDON)),
    );
    const { result } = renderHook(() => useWeather());

    act(() => {
      result.current.search({ city: 'London' });
    });
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather).toEqual(LONDON);
    expect(result.current.error).toBe('');
  });

  it('only the latest search wins, even if an older one answers last (BUG-03)', async () => {
    const calls = controllableFetch();
    const { result } = renderHook(() => useWeather());

    act(() => {
      result.current.search({ city: 'London' });
      result.current.search({ city: 'Paris' });
    });
    await act(async () => {
      calls[1]!.resolve(json(200, PARIS));
      calls[0]!.resolve(json(200, LONDON)); // already aborted, must be ignored
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather).toEqual(PARIS);
  });

  it('keeps the last good result when a search fails (BUG-02, BUG-05)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => (String(url).includes('London') ? json(200, LONDON) : json(404, {}))),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search({ city: 'London' }));
    await act(() => result.current.search({ city: 'Atlantis' }));

    expect(result.current.weather).toEqual(LONDON);
    expect(result.current.error).toBe('No place called "Atlantis" was found.');
  });

  it('explains network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search({ city: 'London' }));

    expect(result.current.error).toMatch(/Couldn't reach the server/);
  });

  it('retries the last search', async () => {
    let fail = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => (fail ? json(503, { error: 'Weather service is busy.' }) : json(200, PARIS))),
    );
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search({ lat: 48.85, lon: 2.35 }));
    expect(result.current.error).toBe('Weather service is busy.');

    fail = false;
    await act(() => result.current.retry());
    expect(result.current.error).toBe('');
    expect(result.current.weather).toEqual(PARIS);
    expect(vi.mocked(fetch).mock.calls.map(([url]) => String(url))).toEqual([
      '/api/weather?lat=48.85&lon=2.35',
      '/api/weather?lat=48.85&lon=2.35',
    ]);
  });

  it('ignores empty searches', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search({ city: '' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
