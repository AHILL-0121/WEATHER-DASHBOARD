import { describe, expect, it } from 'vitest';
import { parsePlaceParams, placeSearch } from './urlPlace';

describe('parsePlaceParams', () => {
  it('reads a named point and rounds it to 2 dp', () => {
    expect(parsePlaceParams('?lat=48.8566&lon=2.3522&name=Paris&country=FR')).toEqual({
      place: { name: 'Paris', country: 'FR', lat: 48.86, lon: 2.35 },
    });
  });

  it('reads an unnamed point', () => {
    expect(parsePlaceParams('?lat=-33.9&lon=151.2')).toEqual({ place: { name: '', lat: -33.9, lon: 151.2 } });
  });

  it('reads a search, trimmed', () => {
    expect(parsePlaceParams('?q=%20San%20Jos%C3%A9%20')).toEqual({ query: 'San José' });
  });

  it('prefers the point when both are given', () => {
    expect(parsePlaceParams('?q=Paris&lat=1&lon=2').place).toMatchObject({ lat: 1, lon: 2 });
  });

  it.each([
    ['', 'no params'],
    ['?lat=91&lon=0', 'latitude out of range'],
    ['?lat=0&lon=-180.5', 'longitude out of range'],
    ['?lat=&lon=', 'empty values'],
    ['?lat=1e1&lon=0x10', 'non-decimal numbers'],
    ['?lat=NaN&lon=Infinity', 'non-finite numbers'],
    ['?lat=10', 'a missing longitude'],
    ['?q=%20%20', 'a blank search'],
  ])('ignores %s (%s)', (search) => {
    expect(parsePlaceParams(search)).toEqual({});
  });

  it('caps the length of text values', () => {
    const { place } = parsePlaceParams(`?lat=1&lon=2&name=${'x'.repeat(500)}`);
    expect(place?.name).toHaveLength(100);
  });
});

describe('placeSearch', () => {
  it('round-trips through parsePlaceParams', () => {
    const place = { name: 'Paris', state: 'Texas', country: 'US', lat: 33.66, lon: -95.56 };
    expect(placeSearch(place)).toBe('?lat=33.66&lon=-95.56&name=Paris&state=Texas&country=US');
    expect(parsePlaceParams(placeSearch(place))).toEqual({ place });
  });

  it('leaves out an empty name', () => {
    expect(placeSearch({ name: '', lat: 10.123, lon: 20 })).toBe('?lat=10.12&lon=20');
  });
});
