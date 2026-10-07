import { describe, expect, it } from 'vitest';
import { compass, dewPoint, formatPrecip, formatTemp, formatVisibility, formatWind } from './units';

describe('units', () => {
  it('formats temperatures in both systems', () => {
    expect(formatTemp(21.6, 'metric')).toBe('22°');
    expect(formatTemp(0, 'imperial')).toBe('32°');
    expect(formatTemp(-40, 'imperial')).toBe('-40°');
    expect(formatTemp(undefined, 'metric')).toBe('--°');
  });

  it('converts wind from m/s', () => {
    expect(formatWind(10, 'metric')).toEqual(['36', 'km/h']);
    expect(formatWind(10, 'imperial')).toEqual(['22', 'mph']);
  });

  it('caps visibility at the 10 km OpenWeather reports', () => {
    expect(formatVisibility(10_000, 'metric')).toEqual(['10+', 'km']);
    expect(formatVisibility(4_200, 'metric')).toEqual(['4.2', 'km']);
    expect(formatVisibility(10_000, 'imperial')).toEqual(['6+', 'mi']);
    expect(formatVisibility(1_609.344, 'imperial')).toEqual(['1.0', 'mi']);
  });

  it('formats precipitation', () => {
    expect(formatPrecip(1.44, 'metric')).toEqual(['1.4', 'mm']);
    expect(formatPrecip(25.4, 'imperial')).toEqual(['1.00', 'in']);
  });

  it('computes the dew point', () => {
    expect(dewPoint(20, 100)).toBeCloseTo(20, 1);
    expect(dewPoint(30, 50)).toBeCloseTo(18.4, 0);
    expect(Number.isFinite(dewPoint(10, 0))).toBe(true);
  });

  it('names compass directions', () => {
    expect(compass(0)).toEqual({ name: 'north', abbr: 'N' });
    expect(compass(200)).toEqual({ name: 'south-southwest', abbr: 'SSW' });
    expect(compass(-90)).toEqual({ name: 'west', abbr: 'W' });
    expect(compass(359)).toEqual({ name: 'north', abbr: 'N' });
  });
});
