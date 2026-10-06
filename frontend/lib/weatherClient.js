// Browser-side helpers for calling our own /api routes

// Successful responses are reused for 5 minutes (the same window the server's
// Cache-Control uses), so re-searching a city or clicking the same spot is instant
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map();

async function getJson(url, { signal, city } = {}) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(await errorMessage(res, city));
  const data = await res.json();
  cache.set(url, { data, at: Date.now() });
  if (cache.size > 100) cache.delete(cache.keys().next().value); // drop the oldest
  return data;
}

export function clearCache() {
  cache.clear();
}

// Current weather for a city or a point. Throws an Error with a user-facing
// message on failure, and an AbortError when cancelled.
export function getWeather({ city, lat, lon }, signal) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const params = new URLSearchParams(hasCoords ? { lat, lon } : { city });
  return getJson(`/api/weather?${params}`, { signal, city: hasCoords ? undefined : city });
}

// Prefer the server's message; fall back to copy based on the status
export async function errorMessage(res, city) {
  if (res.status === 404) {
    return city ? `No place called "${city}" was found.` : 'No weather data for that location.';
  }
  let serverMessage;
  try {
    serverMessage = (await res.json())?.error;
  } catch {
    /* non-JSON body */
  }
  if (serverMessage) return serverMessage;
  if (res.status === 429) return 'Too many requests. Please wait a minute and try again.';
  return 'Weather service is unavailable right now. Please try again later.';
}

// Nearest named place for a point, or null. Never throws except on abort.
export async function fetchPlace(lat, lon, signal) {
  try {
    const place = await getJson(`/api/geocode/reverse?${new URLSearchParams({ lat, lon })}`, { signal });
    return place?.name ? place : null;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return null;
  }
}

// Ocean and other unnamed points come back with an empty name
export function placeLabel({ city, country, lat, lon }) {
  const named = [city, country].filter(Boolean).join(', ');
  if (named) return named;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return `Unnamed location · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }
  return 'Unnamed location';
}
