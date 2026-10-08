// The place on screen, in the page URL, so a link opens the same place (UX-06):
//   ?lat=48.85&lon=2.35&name=Paris&country=FR   a point, named or not
//   ?q=Paris                                    a search; its first result is shown
import type { PlaceDTO } from './types';

const MAX_TEXT = 100;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Only plain decimals: Number() would also accept '', '0x10' and '1e2'
const DECIMAL = /^-?\d{1,3}(\.\d+)?$/;
function coord(raw: string | null, limit: number): number | undefined {
  if (raw === null || !DECIMAL.test(raw)) return undefined;
  const n = Number(raw);
  return Math.abs(n) <= limit ? round2(n) : undefined;
}

function text(raw: string | null): string | undefined {
  const t = raw?.trim().slice(0, MAX_TEXT);
  return t || undefined;
}

export interface UrlPlace {
  /** A point to show; `name` is '' when the link doesn't name it */
  place?: PlaceDTO;
  /** A place name to search for (only when there is no point) */
  query?: string;
}

export function parsePlaceParams(search: string): UrlPlace {
  const params = new URLSearchParams(search);
  const lat = coord(params.get('lat'), 90);
  const lon = coord(params.get('lon'), 180);
  if (lat !== undefined && lon !== undefined) {
    const place: PlaceDTO = { name: text(params.get('name')) ?? '', lat, lon };
    const state = text(params.get('state'));
    const country = text(params.get('country'));
    if (state) place.state = state;
    if (country) place.country = country;
    return { place };
  }
  const query = text(params.get('q'));
  return query ? { query } : {};
}

/** The query string for a place, e.g. "?lat=48.85&lon=2.35&name=Paris&country=FR" */
export function placeSearch(place: PlaceDTO): string {
  const params = new URLSearchParams({ lat: String(round2(place.lat)), lon: String(round2(place.lon)) });
  if (place.name) params.set('name', place.name);
  if (place.state) params.set('state', place.state);
  if (place.country) params.set('country', place.country);
  return `?${params}`;
}
