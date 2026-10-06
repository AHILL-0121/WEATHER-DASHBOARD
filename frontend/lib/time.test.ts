import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatTime, getLocalTime, isNightAt, sunFraction } from './time';

// Tokyo (UTC+9) at 12:00 local = 03:00 UTC, with sunrise 06:00 and sunset 18:00 local
const TOKYO = 9 * 3600;
const NOON_MS = Date.UTC(2026, 9, 6, 3, 0);
const SUNRISE = NOON_MS / 1000 - 6 * 3600;
const SUNSET = NOON_MS / 1000 + 6 * 3600;

// "HH:MM" exactly as the app formats it, in the runner's locale (12- or 24-hour)
const hhmm = (h: number, m: number) =>
  new Date(Date.UTC(2026, 0, 1, h, m)).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

// Results must not depend on the viewer's timezone (BUG-01)
const VIEWER_ZONES = ['UTC', 'Asia/Kolkata', 'America/New_York'];

let originalTz: string | undefined;
beforeEach(() => {
  originalTz = process.env.TZ;
});
afterEach(() => {
  process.env.TZ = originalTz;
});

describe.each(VIEWER_ZONES)('viewed from %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone;
  });

  it('places the sun at the midpoint at local noon', () => {
    expect(sunFraction(SUNRISE, SUNSET, NOON_MS)).toBeCloseTo(0.5, 5);
  });

  it('shows the location’s local time, not the viewer’s', () => {
    expect(getLocalTime(TOKYO, NOON_MS)).toBe(hhmm(12, 0));
  });

  it('formats sunrise and sunset in the location’s time', () => {
    expect(formatTime(SUNRISE, TOKYO)).toBe(hhmm(6, 0));
    expect(formatTime(SUNSET, TOKYO)).toBe(hhmm(18, 0));
  });
});

describe('sunFraction', () => {
  it('clamps to 0 before sunrise and 1 after sunset', () => {
    expect(sunFraction(SUNRISE, SUNSET, (SUNRISE - 60) * 1000)).toBe(0);
    expect(sunFraction(SUNRISE, SUNSET, (SUNSET + 60) * 1000)).toBe(1);
  });

  it('returns 0 for missing or inverted times', () => {
    expect(sunFraction(undefined, SUNSET, NOON_MS)).toBe(0);
    expect(sunFraction(SUNSET, SUNRISE, NOON_MS)).toBe(0);
  });
});

describe('getLocalTime / formatTime', () => {
  it('handles half-hour offsets (India, UTC+5:30)', () => {
    expect(getLocalTime(19800, NOON_MS)).toBe(hhmm(8, 30));
  });

  it('returns -- without data', () => {
    expect(getLocalTime(undefined, NOON_MS)).toBe('--');
    expect(formatTime(0, TOKYO)).toBe('--');
  });
});

describe('isNightAt (BUG-07)', () => {
  const icon = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;
  const weather = { sunrise: SUNRISE, sunset: SUNSET, icon: icon('01d') };

  it('uses sunrise and sunset when they are valid', () => {
    expect(isNightAt(weather, (SUNRISE - 60) * 1000)).toBe(true);
    expect(isNightAt(weather, NOON_MS)).toBe(false);
    expect(isNightAt(weather, (SUNSET + 60) * 1000)).toBe(true);
  });

  it('falls back to the icon day/night flag in polar day or night', () => {
    expect(isNightAt({ sunrise: 0, sunset: 0, icon: icon('13n') }, NOON_MS)).toBe(true);
    expect(isNightAt({ icon: icon('01d') }, NOON_MS)).toBe(false);
  });

  it('is day when there is no weather yet', () => {
    expect(isNightAt(null, NOON_MS)).toBe(false);
  });
});
