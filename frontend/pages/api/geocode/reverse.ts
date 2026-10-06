import type { NextApiRequest, NextApiResponse } from 'next';
import { guard, owFetch, parseLatLon, sendCached, sendError, toPlace } from '../../../lib/openweather';
import { OwPlacesSchema } from '../../../lib/owSchemas';
import type { ApiErrorDTO, PlaceDTO } from '../../../lib/types';

// GET /api/geocode/reverse?lat=&lon= → the nearest named place, or null
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlaceDTO | null | ApiErrorDTO>,
) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const coords = parseLatLon(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  try {
    const [nearest] = await owFetch('/geo/1.0/reverse', { ...coords, limit: 1 }, apiKey, OwPlacesSchema);
    sendCached<PlaceDTO | null>(res, nearest ? toPlace(nearest) : null);
  } catch (err) {
    sendError(res, err);
  }
}
