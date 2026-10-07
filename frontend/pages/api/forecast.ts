import type { NextApiRequest, NextApiResponse } from 'next';
import { guard, owFetch, parseLatLon, sendCached, sendError } from '../../lib/openweather';
import { OwForecastSchema } from '../../lib/owSchemas';
import { toForecast } from '../../lib/forecast';
import type { ApiErrorDTO, ForecastDTO } from '../../lib/types';

// GET /api/forecast?lat=&lon= → next 24 h in 3-hour steps plus daily summaries
export default async function handler(req: NextApiRequest, res: NextApiResponse<ForecastDTO | ApiErrorDTO>) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const coords = parseLatLon(req.query);
  if (!coords) {
    return res.status(400).json({ error: 'Valid lat and lon are required' });
  }

  try {
    const data = await owFetch(
      '/data/2.5/forecast',
      { ...coords, units: 'metric' },
      apiKey,
      OwForecastSchema,
    );
    sendCached<ForecastDTO>(res, toForecast(data));
  } catch (err) {
    sendError(res, err);
  }
}
