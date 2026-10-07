import type { NextApiRequest, NextApiResponse } from 'next';
import {
  guard,
  iconUrl,
  owFetch,
  parseLatLon,
  parseQuery,
  sendCached,
  sendError,
} from '../../lib/openweather';
import { OwWeatherSchema } from '../../lib/owSchemas';
import type { ApiErrorDTO, WeatherDTO } from '../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<WeatherDTO | ApiErrorDTO>) {
  const apiKey = guard(req, res);
  if (!apiKey) return;

  const coords = parseLatLon(req.query);
  const city = parseQuery(req.query.city);
  if (!coords && !city) {
    return res.status(400).json({ error: 'A city name or valid coordinates are required' });
  }

  try {
    const data = await owFetch(
      '/data/2.5/weather',
      { ...(coords ?? { q: city! }), units: 'metric' },
      apiKey,
      OwWeatherSchema,
    );
    const [current] = data.weather; // schema guarantees at least one entry

    sendCached<WeatherDTO>(res, {
      city: data.name,
      country: data.sys?.country,
      lat: data.coord.lat,
      lon: data.coord.lon,
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      temp_min: data.main.temp_min,
      temp_max: data.main.temp_max,
      condition: current!.main,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind?.speed,
      wind_deg: data.wind?.deg,
      visibility: data.visibility,
      sunrise: data.sys?.sunrise,
      sunset: data.sys?.sunset,
      clouds: data.clouds?.all,
      icon: iconUrl(current!.icon),
      timezone: data.timezone,
    });
  } catch (err) {
    sendError(res, err);
  }
}
