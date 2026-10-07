// Server-only: turns OpenWeather's 3-hour forecast into the hourly strip and
// per-day summaries the UI shows. Days are grouped in the location's timezone,
// never the server's or viewer's.
import type { ForecastDayDTO, ForecastDTO, ForecastHourDTO } from './types';
import type { OwForecast, OwForecastEntry } from './owSchemas';
import { iconUrl } from './openweather';

const HOURLY_STEPS = 8; // 8 × 3 h = 24 h
const NOON_SEC = 12 * 3600;

const toPercent = (pop: number) => Math.round(pop * 100);

/** "YYYY-MM-DD" and seconds since local midnight for a UTC timestamp */
function localParts(unix: number, tzOffset: number): { date: string; secOfDay: number } {
  const local = unix + tzOffset;
  const secOfDay = ((local % 86400) + 86400) % 86400;
  return { date: new Date(local * 1000).toISOString().slice(0, 10), secOfDay };
}

function toHour(e: OwForecastEntry): ForecastHourDTO {
  const [w] = e.weather; // schema guarantees at least one entry
  return {
    time: e.dt,
    temp: e.main.temp,
    condition: w!.main,
    icon: iconUrl(w!.icon),
    pop: toPercent(e.pop),
    wind_speed: e.wind?.speed,
    pressure: e.main.pressure,
  };
}

function toDay(date: string, entries: { e: OwForecastEntry; secOfDay: number }[]): ForecastDayDTO {
  // Represent the day by the step closest to local noon
  const rep = entries.reduce((best, cur) =>
    Math.abs(cur.secOfDay - NOON_SEC) < Math.abs(best.secOfDay - NOON_SEC) ? cur : best,
  );
  const [w] = rep.e.weather;
  return {
    date,
    temp_min: Math.min(...entries.map(({ e }) => e.main.temp_min)),
    temp_max: Math.max(...entries.map(({ e }) => e.main.temp_max)),
    condition: w!.main,
    icon: iconUrl(w!.icon),
    pop: toPercent(Math.max(...entries.map(({ e }) => e.pop))),
    steps: entries.map(({ e }) => toHour(e)),
  };
}

export function toForecast(data: OwForecast): ForecastDTO {
  const tz = data.city.timezone;
  const list = [...data.list].sort((a, b) => a.dt - b.dt);

  const byDate = new Map<string, { e: OwForecastEntry; secOfDay: number }[]>();
  for (const e of list) {
    const { date, secOfDay } = localParts(e.dt, tz);
    const day = byDate.get(date);
    if (day) day.push({ e, secOfDay });
    else byDate.set(date, [{ e, secOfDay }]);
  }

  return {
    timezone: tz,
    hourly: list.slice(0, HOURLY_STEPS).map(toHour),
    daily: [...byDate].map(([date, entries]) => toDay(date, entries)),
  };
}
