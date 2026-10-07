import { useCallback } from 'react';
import useStoredState from './useStoredState';
import type { PlaceDTO } from '../lib/types';

const MAX_SAVED = 6;
const MAX_RECENT = 4;

// First-visit places, so the dashboard opens on real weather instead of an
// empty search box (UX-05). All are geocoder results, stored like any other.
export const DEFAULT_PLACES: PlaceDTO[] = [
  { name: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.52, lon: 73.86 },
  { name: 'London', state: 'England', country: 'GB', lat: 51.51, lon: -0.13 },
  { name: 'New York', state: 'New York', country: 'US', lat: 40.71, lon: -74.01 },
  { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69 },
];

const isPlace = (v: unknown): v is PlaceDTO => {
  const p = v as PlaceDTO | null;
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof p.name === 'string' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon)
  );
};
const isPlaceList = (v: unknown): v is PlaceDTO[] => Array.isArray(v) && v.every(isPlace);
const isPlaceOrNull = (v: unknown): v is PlaceDTO | null => v === null || isPlace(v);

/** Same spot to within about 1 km (the API rounds to 2 dp) */
export const samePlace = (a: Pick<PlaceDTO, 'lat' | 'lon'>, b: Pick<PlaceDTO, 'lat' | 'lon'>) =>
  Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;

const withFirst = (list: PlaceDTO[], place: PlaceDTO, max: number) =>
  [place, ...list.filter((p) => !samePlace(p, place))].slice(0, max);

export default function usePlaces() {
  const [saved, setSaved] = useStoredState('saved', DEFAULT_PLACES, isPlaceList);
  const [recent, setRecent] = useStoredState<PlaceDTO[]>('recent', [], isPlaceList);
  // null until the first visit picks one; the page falls back to the first saved place
  const [current, setCurrent] = useStoredState<PlaceDTO | null>('current', null, isPlaceOrNull);

  /** Show a place picked from search: it also becomes a saved and a recent place */
  const pick = useCallback(
    (place: PlaceDTO) => {
      setCurrent(place);
      setSaved((list) => (list.some((p) => samePlace(p, place)) ? list : withFirst(list, place, MAX_SAVED)));
      setRecent((list) => withFirst(list, place, MAX_RECENT));
    },
    [setCurrent, setSaved, setRecent],
  );

  const remove = useCallback(
    (place: PlaceDTO) => setSaved((list) => list.filter((p) => !samePlace(p, place))),
    [setSaved],
  );

  return { saved, recent, current: current ?? saved[0] ?? null, setCurrent, pick, remove };
}
