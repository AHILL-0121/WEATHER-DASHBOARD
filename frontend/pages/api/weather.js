export default async function handler(req, res) {
  const { city, lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  let owUrl;
  if (lat && lon) {
    owUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else if (city) {
    owUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  } else {
    return res.status(400).json({ error: 'City or coordinates required' });
  }

  try {
    const owRes = await fetch(owUrl);
    if (!owRes.ok) {
      return res.status(owRes.status === 404 ? 404 : 502).json({ error: 'City not found or API error' });
    }
    const data = await owRes.json();

    if (!data.weather || data.weather.length === 0) {
      return res.status(500).json({ error: 'No weather data found' });
    }

    const result = {
      city:        data.name,
      country:     data.sys.country,
      lat:         data.coord.lat,
      lon:         data.coord.lon,
      temp:        data.main.temp,
      feels_like:  data.main.feels_like,
      temp_min:    data.main.temp_min,
      temp_max:    data.main.temp_max,
      condition:   data.weather[0].main,
      humidity:    data.main.humidity,
      pressure:    data.main.pressure,
      wind_speed:  data.wind.speed,
      wind_deg:    data.wind.deg,
      visibility:  data.visibility,
      sunrise:     data.sys.sunrise,
      sunset:      data.sys.sunset,
      clouds:      data.clouds.all,
      icon:        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      timezone:    data.timezone,
    };

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
} 