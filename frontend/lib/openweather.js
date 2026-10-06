// Server-only helpers shared by the /api routes. Never import from client code:
// this module reads OPENWEATHER_API_KEY.

const OW_BASE = 'https://api.openweathermap.org';
const MAX_QUERY_LENGTH = 100;

// ---------- input validation ----------

// Returns a finite number within [min, max], or null. Rejects arrays
// (?lat=1&lat=2), empty strings and anything Number() can't parse cleanly.
function parseCoord(value, min, max) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  // 2 dp ≈ 1 km: plenty for weather, and lets nearby clicks share a cache entry
  return Math.round(n * 100) / 100;
}

export function parseLatLon(query) {
  const lat = parseCoord(query.lat, -90, 90);
  const lon = parseCoord(query.lon, -180, 180);
  return lat === null || lon === null ? null : { lat, lon };
}

export function parseQuery(value) {
  if (typeof value !== 'string') return null;
  const q = value.trim();
  return q && q.length <= MAX_QUERY_LENGTH ? q : null;
}

// ---------- request guards ----------

// Best-effort per-IP limit. State lives in this server instance only, so on
// serverless it limits per warm instance rather than globally.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimited(req) {
  const now = Date.now();
  const ip = clientIp(req);
  const entry = hits.get(ip);
  if (!entry || now - entry.start >= RATE_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    if (hits.size > 5000) {
      for (const [key, e] of hits) if (now - e.start >= RATE_WINDOW_MS) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// Handles method, rate limit and API key checks. Returns the key, or null if
// a response has already been sent.
export function guard(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return null;
  }
  if (rateLimited(req)) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    return null;
  }
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('OPENWEATHER_API_KEY is not set');
    res.status(500).json({ error: 'Weather service is not configured' });
    return null;
  }
  return apiKey;
}

// ---------- upstream ----------

export class UpstreamError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function owFetch(path, params, apiKey) {
  const url = new URL(path, OW_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set('appid', apiKey);

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (err) {
    console.error(`OpenWeather ${path} request failed:`, err.name);
    throw new UpstreamError(504, 'Weather service did not respond. Please try again.');
  }
  if (!res.ok) {
    console.error(`OpenWeather ${path} responded ${res.status}`);
    if (res.status === 404) throw new UpstreamError(404, 'Location not found');
    if (res.status === 429)
      throw new UpstreamError(503, 'Weather service is busy. Please try again shortly.');
    throw new UpstreamError(502, 'Weather service error. Please try again later.');
  }
  return res.json();
}

export function sendCached(res, body) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).json(body);
}

export function sendError(res, err) {
  if (err instanceof UpstreamError) return res.status(err.status).json({ error: err.message });
  console.error('Unexpected API error:', err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

// Geocoding results trimmed to what the UI uses
export function toPlace(p) {
  return { name: p.name, state: p.state, country: p.country, lat: p.lat, lon: p.lon };
}
