// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import usePlaces, { DEFAULT_PLACES } from './usePlaces';
import type { PlaceDTO } from '../lib/types';

const place = (name: string, lat: number): PlaceDTO => ({ name, lat, lon: 0 });

beforeEach(() => localStorage.clear());

describe('usePlaces', () => {
  it('starts with the default places and shows the first', () => {
    const { result } = renderHook(() => usePlaces());
    expect(result.current.saved).toEqual(DEFAULT_PLACES);
    expect(result.current.current).toEqual(DEFAULT_PLACES[0]);
  });

  it('picking a search result shows it, saves it first and records it as recent', () => {
    const { result } = renderHook(() => usePlaces());
    const rome = place('Rome', 41.89);

    act(() => result.current.pick(rome));

    expect(result.current.current).toEqual(rome);
    expect(result.current.saved[0]).toEqual(rome);
    expect(result.current.recent).toEqual([rome]);
    expect(JSON.parse(localStorage.getItem('wd:current')!)).toEqual(rome);
  });

  it("doesn't duplicate a saved place and keeps at most 6 saved and 4 recent", () => {
    const { result } = renderHook(() => usePlaces());

    act(() => {
      for (let i = 0; i < 8; i++) result.current.pick(place(`P${i}`, i * 10));
      result.current.pick(place('P7 again', 70.001)); // same spot as P7
    });

    expect(result.current.saved).toHaveLength(6);
    expect(result.current.saved.filter((p) => p.lat >= 69 && p.lat < 71)).toHaveLength(1);
    expect(result.current.recent.map((p) => p.name)).toEqual(['P7 again', 'P6', 'P5', 'P4']);
  });

  it('removes a saved place', () => {
    const { result } = renderHook(() => usePlaces());
    act(() => result.current.remove(DEFAULT_PLACES[1]!));
    expect(result.current.saved).toEqual(DEFAULT_PLACES.filter((_, i) => i !== 1));
  });

  it('ignores corrupt or invalid stored data', () => {
    localStorage.setItem('wd:saved', '{not json');
    localStorage.setItem('wd:recent', JSON.stringify([{ name: 'x', lat: 'north' }]));
    const { result } = renderHook(() => usePlaces());
    expect(result.current.saved).toEqual(DEFAULT_PLACES);
    expect(result.current.recent).toEqual([]);
  });

  it('keeps every hook instance in sync', () => {
    const a = renderHook(() => usePlaces());
    const b = renderHook(() => usePlaces());
    act(() => a.result.current.pick(place('Oslo', 59.91)));
    expect(b.result.current.current?.name).toBe('Oslo');
  });
});
