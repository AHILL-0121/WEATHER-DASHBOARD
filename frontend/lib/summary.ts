// Plain-language reading of the forecast: what the hero says, the pressure
// trend, and day names. Pure functions of the API data, so they're testable.
import { conditionKind, isWet, type ConditionKind } from './condition';
import { formatTime } from './time';
import { formatTemp, formatWind, type Units } from './units';
import type { ForecastDTO, ForecastHourDTO, WeatherDTO } from './types';

const STEP_SEC = 3 * 3600;
// The step in progress plus 8 more: "now" and then 3-hourly to 24 h ahead
const HOURS_SHOWN = 9;

/** Forecast steps that haven't finished yet, up to 24 h ahead */
export function upcoming(forecast: ForecastDTO, nowMs: number): ForecastHourDTO[] {
  const nowSec = nowMs / 1000;
  const days = forecast.daily.flatMap((d) => d.steps);
  const all = days.length ? days : forecast.hourly;
  return all.filter((h) => h.time + STEP_SEC > nowSec).slice(0, HOURS_SHOWN);
}

const kindOf = (h: Pick<ForecastHourDTO, 'icon' | 'condition'>) => conditionKind(h);

const WET_NOUN: Partial<Record<ConditionKind, string>> = { snow: 'Snow', storm: 'Thunderstorms' };
const wetNoun = (k: ConditionKind) => WET_NOUN[k] ?? 'Rain';

export interface Summary {
  /** The headline, shown in bold */
  lead: string;
  rest: string;
  /** Precipitation is falling or likely: show an umbrella */
  wet: boolean;
}

export function heroSummary(weather: WeatherDTO, hours: ForecastHourDTO[], units: Units): Summary {
  const tz = weather.timezone;
  const at = (h: ForecastHourDTO) => formatTime(h.time, tz);
  const nowKind = conditionKind(weather);
  const wetIndex = hours.findIndex((h) => h.pop >= 50 && isWet(kindOf(h)));

  let lead: string;
  let rest = '';
  let wet = true;
  if (isWet(nowKind)) {
    // hours[0] is the step in progress; look for a dry one after it
    const stop = hours.slice(1).find((h) => h.pop < 35);
    lead = `${wetNoun(nowKind)} now`;
    rest = stop ? `, easing around ${at(stop)}.` : ' for the next few hours.';
  } else if (wetIndex >= 0) {
    const h = hours[wetIndex]!;
    lead = `${wetNoun(kindOf(h))} likely from ${at(h)}.`;
    rest = " Take an umbrella if you're heading out later.";
  } else {
    lead = 'No rain expected in the next 24 hours.';
    wet = false;
  }

  if (hours.length) {
    const hi = hours.reduce((a, b) => (b.temp > a.temp ? b : a));
    const lo = hours.reduce((a, b) => (b.temp < a.temp ? b : a));
    rest += ` High of ${formatTemp(hi.temp, units)} around ${at(hi)}, low of ${formatTemp(lo.temp, units)} around ${at(lo)}.`;
  }
  // 12 m/s ≈ 43 km/h, where gusts start to be noticeable when walking
  if ((weather.wind_gust ?? 0) > 12)
    rest += ` Gusty, up to ${formatWind(weather.wind_gust!, units).join(' ')}.`;

  return { lead, rest, wet };
}

/** How pressure will move over the next 6 hours, in words; null without data */
export function pressureTrend(nowHPa: number, hours: ForecastHourDTO[]): string | null {
  const later = hours.find((h) => h.time - (hours[0]?.time ?? 0) >= 2 * STEP_SEC)?.pressure;
  if (later === undefined) return null;
  const change = later - nowHPa;
  if (change <= -4) return 'Falling fast over the next 6 hours. Unsettled weather is likely.';
  if (change <= -1.5) return 'Falling slowly over the next 6 hours.';
  if (change >= 3) return 'Rising over the next 6 hours. Expect clearer, calmer weather.';
  if (change >= 1.5) return 'Rising slowly over the next 6 hours.';
  return 'Steady over the next 6 hours.';
}

const WEEKDAY = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });

/** "Today", or a short weekday, for a local "YYYY-MM-DD" */
export function dayName(date: string, tz: number, nowMs: number): string {
  const today = new Date(nowMs + tz * 1000).toISOString().slice(0, 10);
  if (date === today) return 'Today';
  return WEEKDAY.format(new Date(`${date}T12:00:00Z`));
}

/** Local hour (0–23) of a timestamp at the location */
export function localHour(unix: number, tz: number): number {
  return new Date((unix + tz) * 1000).getUTCHours();
}
