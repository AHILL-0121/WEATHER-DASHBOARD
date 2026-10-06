// Browser-side helpers for calling our own /api routes
import type { ApiErrorDTO, PlaceDTO, WeatherDTO } from './types';

/** What to search for: a city name, or a point (which wins when valid) */
export interface WeatherQuery {
  city?: string;
  lat?: number;
  lon?: number;
}

// Successful responses are reused for 5 minutes (the same window the server's
// Cache-Control uses), so re-searching a city or clicking the same spot is instant
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { data: unknown; at: number }>();

async function getJson<T>(
  url: string,
  { signal, city }: { signal?: AbortSignal; city?: string } = {},
): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(await errorMessage(res, city));
  const data = (await res.json()) as T;
  cache.set(url, { data, at: Date.now() });
  if (cache.size > 100) cache.delete(cache.keys().next().value!); // drop the oldest
  return data;
}

export function clearCache(): void {
  cache.clear();
}

export function hasCoords(q: WeatherQuery): q is WeatherQuery & { lat: number; lon: number } {
  return Number.isFinite(q.lat) && Number.isFinite(q.lon);
}

// Current weather for a city or a point. Throws an Error with a user-facing
// message on failure, and an AbortError when cancelled.
export function getWeather(query: WeatherQuery, signal?: AbortSignal): Promise<WeatherDTO> {
  const byPoint = hasCoords(query);
  const params = new URLSearchParams(
    byPoint ? { lat: String(query.lat), lon: String(query.lon) } : { city: query.city ?? '' },
  );
  return getJson<WeatherDTO>(`/api/weather?${params}`, { signal, city: byPoint ? undefined : query.city });
}

// Prefer the server's message; fall back to copy based on the status
export async function errorMessage(res: Response, city?: string): Promise<string> {
  if (res.status === 404) {
    return city ? `No place called "${city}" was found.` : 'No weather data for that location.';
  }
  let serverMessage: string | undefined;
  try {
    serverMessage = ((await res.json()) as Partial<ApiErrorDTO> | null)?.error;
  } catch {
    /* non-JSON body */
  }
  if (serverMessage) return serverMessage;
  if (res.status === 429) return 'Too many requests. Please wait a minute and try again.';
  return 'Weather service is unavailable right now. Please try again later.';
}

// Nearest named place for a point, or null. Never throws except on abort.
export async function fetchPlace(lat: number, lon: number, signal?: AbortSignal): Promise<PlaceDTO | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    const place = await getJson<PlaceDTO | null>(`/api/geocode/reverse?${params}`, { signal });
    return place?.name ? place : null;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return null;
  }
}

// Ocean and other unnamed points come back with an empty name
export function placeLabel({
  city,
  country,
  lat,
  lon,
}: Pick<WeatherDTO, 'city' | 'country' | 'lat' | 'lon'>): string {
  const named = [city, country].filter(Boolean).join(', ');
  if (named) return named;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `Unnamed location · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }
  return 'Unnamed location';
}
