// Display formatting. Data stays metric (°C, m/s, m) everywhere; conversion
// happens only here, at the edge.

export type Units = 'metric' | 'imperial';

export const toDisplayTemp = (c: number, units: Units) =>
  Math.round(units === 'metric' ? c : (c * 9) / 5 + 32);

/** "23°", or "--°" when missing */
export function formatTemp(c: number | undefined, units: Units): string {
  return Number.isFinite(c) ? `${toDisplayTemp(c!, units)}°` : '--°';
}

/** [value, unit] for a wind speed in m/s */
export function formatWind(ms: number, units: Units): [string, string] {
  return units === 'metric'
    ? [String(Math.round(ms * 3.6)), 'km/h']
    : [String(Math.round(ms * 2.237)), 'mph'];
}

/** [value, unit] for a visibility in metres. OpenWeather caps it at 10 km. */
export function formatVisibility(m: number, units: Units): [string, string] {
  if (units === 'metric') return [m >= 10_000 ? '10+' : (m / 1000).toFixed(1), 'km'];
  return [m >= 10_000 ? '6+' : (m / 1609.344).toFixed(1), 'mi'];
}

/** Dew point in °C from temperature and relative humidity (Magnus formula) */
export function dewPoint(tempC: number, humidity: number): number {
  const a = 17.62;
  const b = 243.12;
  const g = Math.log(Math.max(humidity, 1) / 100) + (a * tempC) / (b + tempC);
  return (b * g) / (a - g);
}

const DIRS = [
  'north',
  'north-northeast',
  'northeast',
  'east-northeast',
  'east',
  'east-southeast',
  'southeast',
  'south-southeast',
  'south',
  'south-southwest',
  'southwest',
  'west-southwest',
  'west',
  'west-northwest',
  'northwest',
  'north-northwest',
];
const ABBR = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

/** 16-point compass for a bearing: { name: "south-southwest", abbr: "SSW" } */
export function compass(deg: number): { name: string; abbr: string } {
  const i = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return { name: DIRS[i]!, abbr: ABBR[i]! };
}

/** [value, unit] for precipitation in mm */
export function formatPrecip(mm: number, units: Units): [string, string] {
  return units === 'metric' ? [mm.toFixed(1), 'mm'] : [(mm / 25.4).toFixed(2), 'in'];
}
