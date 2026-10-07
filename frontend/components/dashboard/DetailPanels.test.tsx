// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import DetailPanels, { duration } from './DetailPanels';
import type { WeatherDTO } from '@/lib/types';

afterEach(cleanup);

const NOON = Date.UTC(2026, 9, 7, 12) / 1000;
const W: WeatherDTO = {
  city: 'London',
  country: 'GB',
  lat: 51.51,
  lon: -0.13,
  temp: 12,
  feels_like: 9,
  temp_min: 10,
  temp_max: 14,
  condition: 'Clouds',
  description: 'Broken clouds',
  humidity: 80,
  pressure: 1012,
  wind_speed: 5,
  wind_deg: 200,
  wind_gust: 9,
  visibility: 10_000,
  sunrise: NOON - 5 * 3600,
  sunset: NOON + 2 * 3600 + 5 * 60,
  clouds: 75,
  icon: 'https://openweathermap.org/img/wn/04d@2x.png',
  timezone: 0,
};

describe('DetailPanels (A11Y-06)', () => {
  it('describes wind and the sun in words', () => {
    render(<DetailPanels weather={W} units="metric" now={NOON * 1000} />);
    expect(screen.getByText('From the south-southwest (SSW), gusting to 32 km/h.')).toBeInTheDocument();
    expect(screen.getByText('Sunset in 2 h 05 min')).toBeInTheDocument();
    expect(screen.getByText('Wind makes it feel colder than it is.')).toBeInTheDocument();
    expect(screen.getByText('Clear view to the horizon.')).toBeInTheDocument();
  });

  it('counts down to tomorrow’s sunrise after sunset', () => {
    render(<DetailPanels weather={W} units="metric" now={(W.sunset! + 3600) * 1000} />);
    // Sunrise is 07:00 UTC; an hour after the 14:05 sunset, the next is 15 h 55 min away
    expect(screen.getByText('Sunrise in 15 h 55 min')).toBeInTheDocument();
  });

  it('handles polar day or night and missing data', () => {
    const polar = {
      ...W,
      sunrise: undefined,
      sunset: undefined,
      wind_speed: undefined,
      visibility: undefined,
    };
    render(<DetailPanels weather={polar} units="metric" now={NOON * 1000} />);
    expect(screen.getByText(/No sunrise or sunset here today/)).toBeInTheDocument();
    expect(screen.getByText('No wind data for this spot.')).toBeInTheDocument();
    expect(screen.getByText('No visibility data.')).toBeInTheDocument();
  });

  it('switches to imperial units', () => {
    render(<DetailPanels weather={W} units="imperial" now={NOON * 1000} />);
    expect(screen.getByText('mph')).toBeInTheDocument();
    expect(screen.getByText('48°')).toBeInTheDocument(); // feels like 9 °C
  });

  it('formats durations', () => {
    expect(duration(0)).toBe('0 h 00 min');
    expect(duration(3 * 3600 + 7 * 60 + 29)).toBe('3 h 07 min');
    expect(duration(-5)).toBe('0 h 00 min');
  });
});
