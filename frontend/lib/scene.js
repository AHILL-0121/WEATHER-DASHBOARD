// OpenWeather condition ("Clear", "Thunderstorm", …) → background scene name
export function getScene(condition) {
  if (!condition) return 'default';
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return 'clear';
  if (c.includes('thunderstorm') || c.includes('thunder')) return 'thunderstorm';
  if (c.includes('snow') || c.includes('sleet')) return 'snow';
  if (c.includes('rain')) return 'rain';
  if (c.includes('drizzle')) return 'drizzle';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'mist';
  if (c.includes('cloud')) return 'clouds';
  return 'default';
}

export const ALL_SCENES = ['clear', 'clouds', 'rain', 'drizzle', 'snow', 'thunderstorm', 'mist', 'default'];
