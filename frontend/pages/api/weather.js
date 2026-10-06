import { guard, owFetch, parseLatLon, parseQuery, sendCached, sendError } from '../../lib/openweather';

export default async function handler(req, res) {
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
      { ...(coords ?? { q: city }), units: 'metric' },
      apiKey,
    );

    if (!data.weather || data.weather.length === 0) {
      return res.status(502).json({ error: 'No weather data found' });
    }

    sendCached(res, {
      city:        data.name,
      country:     data.sys?.country,
      lat:         data.coord.lat,
      lon:         data.coord.lon,
      temp:        data.main.temp,
      feels_like:  data.main.feels_like,
      temp_min:    data.main.temp_min,
      temp_max:    data.main.temp_max,
      condition:   data.weather[0].main,
      humidity:    data.main.humidity,
      pressure:    data.main.pressure,
      wind_speed:  data.wind?.speed,
      wind_deg:    data.wind?.deg,
      visibility:  data.visibility,
      sunrise:     data.sys?.sunrise,
      sunset:      data.sys?.sunset,
      clouds:      data.clouds?.all,
      icon:        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      timezone:    data.timezone,
    });
  } catch (err) {
    sendError(res, err);
  }
}
