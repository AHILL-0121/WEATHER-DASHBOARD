// Maps OpenWeather conditions onto the seven looks the UI draws. The icon code
// is more precise than the group name: "02"/"03" (few/scattered clouds) is
// partly cloudy, "04" overcast, and its last letter says day or night.
import type { WeatherDTO } from './types';

export type ConditionKind = 'clear' | 'partly' | 'clouds' | 'rain' | 'storm' | 'snow' | 'mist';

const BY_CODE: Record<string, ConditionKind> = {
  '01': 'clear',
  '02': 'partly',
  '03': 'partly',
  '04': 'clouds',
  '09': 'rain',
  '10': 'rain',
  '11': 'storm',
  '13': 'snow',
  '50': 'mist',
};

const BY_GROUP: Record<string, ConditionKind> = {
  clear: 'clear',
  clouds: 'clouds',
  rain: 'rain',
  drizzle: 'rain',
  thunderstorm: 'storm',
  snow: 'snow',
};

/** Icon code ("04d") from an OpenWeather icon URL, or null */
export function iconCode(iconUrl: string | undefined): string | null {
  return /\/wn\/(\d\d[dn])@/.exec(iconUrl ?? '')?.[1] ?? null;
}

export function conditionKind({ icon, condition }: Pick<WeatherDTO, 'icon' | 'condition'>): ConditionKind {
  const code = iconCode(icon);
  const byCode = code ? BY_CODE[code.slice(0, 2)] : undefined;
  // Mist, smoke, haze, dust, fog, sand, ash, squall and tornado all fall through to mist
  return byCode ?? BY_GROUP[condition.toLowerCase()] ?? (condition ? 'mist' : 'clouds');
}

export const CONDITION_LABEL: Record<ConditionKind, string> = {
  clear: 'Clear',
  partly: 'Partly cloudy',
  clouds: 'Cloudy',
  rain: 'Rain',
  storm: 'Thunderstorm',
  snow: 'Snow',
  mist: 'Haze',
};

export const isWet = (k: ConditionKind) => k === 'rain' || k === 'storm' || k === 'snow';
