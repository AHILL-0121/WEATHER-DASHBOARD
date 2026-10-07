import { describe, expect, it } from 'vitest';
import { dayName, heroSummary, pressureTrend, upcoming } from './summary';
import type { ForecastDTO, ForecastHourDTO, WeatherDTO } from './types';

const T0 = Date.UTC(2026, 9, 7, 9) / 1000; // 09:00 UTC
const icon = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;
const hour = (i: number, o: Partial<ForecastHourDTO> = {}): ForecastHourDTO => ({
  time: T0 + i * 3 * 3600,
  temp: 15 + i,
  condition: 'Clouds',
  icon: icon('04d'),
  pop: 0,
  ...o,
});
const WEATHER = {
  temp: 15,
  condition: 'Clouds',
  icon: icon('04d'),
  timezone: 0,
  wind_gust: 5,
} as WeatherDTO;

describe('upcoming', () => {
  it('keeps the step in progress and 24 h after it', () => {
    const steps = Array.from({ length: 12 }, (_, i) => hour(i));
    const forecast: ForecastDTO = {
      timezone: 0,
      hourly: steps.slice(0, 8),
      daily: [
        {
          date: '2026-10-07',
          temp_min: 0,
          temp_max: 0,
          condition: '',
          icon: '',
          pop: 0,
          steps: steps.slice(0, 5),
        },
        {
          date: '2026-10-08',
          temp_min: 0,
          temp_max: 0,
          condition: '',
          icon: '',
          pop: 0,
          steps: steps.slice(5),
        },
      ],
    };
    // 10:30 is inside the 09:00 step
    const now = (T0 + 1.5 * 3600) * 1000;
    expect(upcoming(forecast, now).map((h) => h.time)).toEqual(steps.slice(0, 9).map((h) => h.time));
    // 12:00 exactly: the 09:00 step has finished
    expect(upcoming(forecast, (T0 + 3 * 3600) * 1000)[0]!.time).toBe(steps[1]!.time);
  });
});

describe('heroSummary', () => {
  it('says when rain is likely to start', () => {
    const hours = [hour(0), hour(1), hour(2, { pop: 70, condition: 'Rain', icon: icon('10d') }), hour(3)];
    const s = heroSummary(WEATHER, hours, 'metric');
    expect(s.wet).toBe(true);
    expect(s.lead).toBe(
      `Rain likely from ${new Date((T0 + 6 * 3600) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}.`,
    );
    expect(s.rest).toContain('High of 18°');
    expect(s.rest).toContain('low of 15°');
  });

  it('says when it is dry, and mentions strong gusts', () => {
    const s = heroSummary({ ...WEATHER, wind_gust: 15 }, [hour(0), hour(1)], 'imperial');
    expect(s).toMatchObject({ lead: 'No rain expected in the next 24 hours.', wet: false });
    expect(s.rest).toContain('Gusty, up to 34 mph.');
    expect(s.rest).toContain('High of 61°'); // 16 °C
  });

  it('describes precipitation that is already falling', () => {
    const snowing = { ...WEATHER, condition: 'Snow', icon: icon('13d') };
    const easing = heroSummary(snowing, [hour(0, { pop: 90 }), hour(1, { pop: 20 })], 'metric');
    expect(easing.lead).toBe('Snow now');
    expect(easing.rest).toMatch(/^, easing around /);
    const steady = heroSummary(snowing, [hour(0, { pop: 90 }), hour(1, { pop: 80 })], 'metric');
    expect(steady.rest).toMatch(/^ for the next few hours\./);
  });

  it('ignores a high chance of precipitation in dry conditions', () => {
    expect(heroSummary(WEATHER, [hour(0, { pop: 80 })], 'metric').wet).toBe(false);
  });
});

describe('pressureTrend', () => {
  const hours = (later: number | undefined) => [hour(0), hour(1), hour(2, { pressure: later })];
  it.each([
    [1004, /Falling fast/],
    [1007, /Falling slowly/],
    [1009, /Steady/],
    [1012, /Rising slowly/],
    [1014, /Rising over/],
  ])('1010 → %i hPa reads %s', (later, text) => {
    expect(pressureTrend(1010, hours(later))).toMatch(text);
  });

  it('returns null without forecast pressure', () => {
    expect(pressureTrend(1010, hours(undefined))).toBeNull();
    expect(pressureTrend(1010, [])).toBeNull();
  });
});

describe('dayName', () => {
  it('uses the location’s own date for "Today"', () => {
    const now = Date.UTC(2026, 9, 7, 22); // 22:00 UTC = 03:30 on the 8th in India
    expect(dayName('2026-10-07', 0, now)).toBe('Today');
    expect(dayName('2026-10-08', 19800, now)).toBe('Today');
    expect(dayName('2026-10-09', 19800, now)).toBe('Fri');
  });
});
