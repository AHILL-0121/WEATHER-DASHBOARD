import { guard, owFetch, parseQuery, sendCached, sendError, toPlace } from '../../../lib/openweather';

// GET /api/geocode?q=<city> → up to 5 matching places
export default async function handler(req, res) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const q = parseQuery(req.query.q);
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be 2–100 characters' });
  }

  try {
    const data = await owFetch('/geo/1.0/direct', { q, limit: 5 }, apiKey);
    sendCached(res, Array.isArray(data) ? data.map(toPlace) : []);
  } catch (err) {
    sendError(res, err);
  }
}
