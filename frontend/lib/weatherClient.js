// Browser-side helpers for calling our own /api routes

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
    const res = await fetch(`/api/geocode/reverse?${new URLSearchParams({ lat, lon })}`, { signal });
    const place = res.ok ? await res.json() : null;
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
