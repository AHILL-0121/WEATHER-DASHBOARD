import { describe, expect, it } from 'vitest';
import { ALL_SCENES, getScene } from './scene';

describe('getScene', () => {
  it.each([
    ['Clear', 'clear'],
    ['Clouds', 'clouds'],
    ['Rain', 'rain'],
    ['Drizzle', 'drizzle'],
    ['Snow', 'snow'],
    ['Thunderstorm', 'thunderstorm'],
    ['Mist', 'mist'],
    ['Fog', 'mist'],
    ['Haze', 'mist'],
  ])('maps %s to %s', (condition, scene) => {
    expect(getScene(condition)).toBe(scene);
  });

  it('falls back to default for unknown or missing conditions', () => {
    expect(getScene('Tornado')).toBe('default');
    expect(getScene(undefined)).toBe('default');
  });

  it('only returns known scenes', () => {
    for (const c of ['Clear', 'Rain', 'Smoke', '']) expect(ALL_SCENES).toContain(getScene(c));
  });
});
