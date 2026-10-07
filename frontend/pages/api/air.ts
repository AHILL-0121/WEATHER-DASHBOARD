import type { NextApiRequest, NextApiResponse } from 'next';
import { guard, owFetch, parseLatLon, sendCached, sendError } from '../../lib/openweather';
import { OwAirSchema } from '../../lib/owSchemas';
import type { AirDTO, ApiErrorDTO } from '../../lib/types';

// GET /api/air?lat=&lon= → current air quality index and pollutant levels
export default async function handler(req: NextApiRequest, res: NextApiResponse<AirDTO | ApiErrorDTO>) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const coords = parseLatLon(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  try {
    const { list } = await owFetch('/data/2.5/air_pollution', { ...coords }, apiKey, OwAirSchema);
    const [now] = list; // schema guarantees at least one entry
    sendCached<AirDTO>(res, {
      aqi: now!.main.aqi as AirDTO['aqi'],
      time: now!.dt,
      components: now!.components,
    });
  } catch (err) {
    sendError(res, err);
  }
}
