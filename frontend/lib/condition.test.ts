import { describe, expect, it } from 'vitest';
import { conditionKind, iconCode } from './condition';

const icon = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;

describe('conditionKind', () => {
  it.each([
    ['01d', 'Clear', 'clear'],
    ['02n', 'Clouds', 'partly'],
    ['03d', 'Clouds', 'partly'],
    ['04d', 'Clouds', 'clouds'],
    ['09d', 'Drizzle', 'rain'],
    ['10n', 'Rain', 'rain'],
    ['11d', 'Thunderstorm', 'storm'],
    ['13d', 'Snow', 'snow'],
    ['50d', 'Haze', 'mist'],
  ])('icon %s (%s) → %s', (code, condition, kind) => {
    expect(conditionKind({ icon: icon(code), condition })).toBe(kind);
  });

  it('falls back to the group name when the icon is unknown', () => {
    expect(conditionKind({ icon: '', condition: 'Drizzle' })).toBe('rain');
    expect(conditionKind({ icon: '', condition: 'Smoke' })).toBe('mist');
    expect(conditionKind({ icon: '', condition: '' })).toBe('clouds');
  });

  it('reads the icon code', () => {
    expect(iconCode(icon('10n'))).toBe('10n');
    expect(iconCode('nonsense')).toBeNull();
  });
});
