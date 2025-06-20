export default async function handler(req, res) {
  const { city, lat, lon } = req.query;
  let backendUrl = 'http://localhost:3001/weather?';
  if (lat && lon) {
    backendUrl += `lat=${lat}&lon=${lon}`;
  } else if (city) {
    backendUrl += `city=${encodeURIComponent(city)}`;
  } else {
    return res.status(400).json({ error: 'City or coordinates required' });
  }
  try {
    const backendRes = await fetch(backendUrl);
    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Backend error' });
  }
} 