import { describe, expect, it } from 'vitest';
import { TEMP_STOPS, tempColor } from './tempColor';

describe('tempColor', () => {
  it('returns each stop colour exactly at its temperature', () => {
    expect(tempColor(-15)).toBe('rgb(106 111 216)'); // #6a6fd8
    expect(tempColor(21)).toBe('rgb(233 196 63)'); // #e9c43f
    expect(tempColor(42)).toBe('rgb(163 35 47)'); // #a3232f
  });

  it('interpolates between stops', () => {
    // Halfway between 14 °C #8cc65a (140 198 90) and 21 °C #e9c43f (233 196 63)
    expect(tempColor(17.5)).toBe('rgb(187 197 77)');
  });

  it('clamps beyond the ends of the scale', () => {
    expect(tempColor(-40)).toBe(tempColor(-15));
    expect(tempColor(55)).toBe(tempColor(42));
    expect(tempColor(-Infinity)).toBe(tempColor(-15));
    expect(tempColor(Infinity)).toBe(tempColor(42));
  });

  it('falls back to a neutral mid-scale colour for NaN', () => {
    expect(tempColor(NaN)).toBe(tempColor(TEMP_STOPS[3]![0]));
  });

  it('has ascending stops', () => {
    const temps = TEMP_STOPS.map(([t]) => t);
    expect(temps).toEqual([...temps].sort((a, b) => a - b));
  });
});
