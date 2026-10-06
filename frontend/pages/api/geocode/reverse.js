import { guard, owFetch, parseLatLon, sendCached, sendError, toPlace } from '../../../lib/openweather';

// GET /api/geocode/reverse?lat=&lon= → the nearest named place, or null
export default async function handler(req, res) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const coords = parseLatLon(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  try {
    const data = await owFetch('/geo/1.0/reverse', { ...coords, limit: 1 }, apiKey);
    sendCached(res, Array.isArray(data) && data[0] ? toPlace(data[0]) : null);
  } catch (err) {
    sendError(res, err);
  }
}
