// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HourlyStrip from './HourlyStrip';
import WeekList from './WeekList';
import type { ForecastDTO, ForecastHourDTO, WeatherDTO } from '@/lib/types';

afterEach(cleanup);

const T0 = Date.UTC(2026, 9, 7, 9) / 1000; // 09:00 UTC, timezone 0
const icon = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;
const step = (i: number, o: Partial<ForecastHourDTO> = {}): ForecastHourDTO => ({
  time: T0 + i * 3 * 3600,
  temp: 14 + i,
  condition: 'Clouds',
  icon: icon('04d'),
  pop: 0,
  wind_speed: 4,
  ...o,
});
const WEATHER = {
  temp: 13.6,
  feels_like: 12,
  humidity: 70,
  condition: 'Clouds',
  icon: icon('04d'),
  timezone: 0,
  wind_speed: 3,
  sunrise: T0 - 2 * 3600,
  sunset: T0 + 8 * 3600 + 20 * 60, // 17:20, during the 18:00 step
} as WeatherDTO;
const HOURS = Array.from({ length: 9 }, (_, i) =>
  step(i, i === 2 ? { pop: 70, condition: 'Rain', icon: icon('10d') } : {}),
);
const NOW = (T0 + 3600) * 1000;

describe('HourlyStrip', () => {
  it('is a radio group navigable with arrow keys, Home and End (UX-01)', async () => {
    const user = userEvent.setup();
    render(<HourlyStrip weather={WEATHER} hours={HOURS} units="metric" now={NOW} />);
    const group = screen.getByRole('radiogroup', { name: 'Next 24 hours' });
    const radios = within(group).getAllByRole('radio');

    expect(radios).toHaveLength(9); // now + 8 steps
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAccessibleName(/^Now: 14 degrees, Cloudy/);
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);

    radios[0]!.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('70%', { selector: 'b' })).toBeInTheDocument(); // detail line

    await user.keyboard('{End}');
    expect(radios[8]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(radios[0]).toHaveFocus();
  });

  it('marks the steps in which the sun sets and rises', () => {
    render(<HourlyStrip weather={WEATHER} hours={HOURS} units="metric" now={NOW} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[3]).toHaveAccessibleName(/sunset at/);
    // Tomorrow's sunrise (07:00) falls in the 06:00–09:00 step, the last one shown
    expect(radios[8]).toHaveAccessibleName(/sunrise at/);
    expect(radios.filter((r) => /sunset|sunrise/.test(r.getAttribute('aria-label')!))).toHaveLength(2);
  });
});

describe('WeekList', () => {
  const day = (date: string, offset: number, o = {}) => ({
    date,
    temp_min: 8 + offset,
    temp_max: 16 + offset,
    condition: 'Clouds',
    icon: icon('04d'),
    pop: 10,
    steps: [9, 12, 15, 18].map((h, i) =>
      step(0, {
        time: Date.parse(`${date}T${String(h).padStart(2, '0')}:00:00Z`) / 1000,
        temp: 10 + i + offset,
      }),
    ),
    ...o,
  });
  const FORECAST: ForecastDTO = {
    timezone: 0,
    hourly: HOURS.slice(0, 8),
    daily: [
      day('2026-10-07', 0),
      day('2026-10-08', 2, { pop: 80, condition: 'Rain', icon: icon('10d') }),
      day('2026-10-09', -3),
    ],
  };

  it('lists days with "Today" first and spoken summaries', () => {
    render(<WeekList forecast={FORECAST} currentTemp={12} units="metric" now={NOW} />);
    const rows = screen.getAllByRole('button');
    expect(rows.map((r) => r.querySelector('span')?.textContent)).toEqual(['Today', 'Thu', 'Fri']);
    expect(rows[1]).toHaveTextContent('Rain, low 10, high 18 degrees, 80% chance of precipitation');
    expect(screen.getByText('5° to 18°')).toBeInTheDocument();
  });

  it('expands one day at a time to its own temperatures', async () => {
    const user = userEvent.setup();
    render(<WeekList forecast={FORECAST} currentTemp={12} units="imperial" now={NOW} />);
    const [today, tomorrow] = screen.getAllByRole('button');

    await user.click(tomorrow!);
    expect(tomorrow).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(tomorrow!.getAttribute('aria-controls')!)!;
    expect(panel).toBeVisible();
    expect(panel).toHaveTextContent('Rain at times, 80% chance overall.');
    expect(within(panel).getByText('Morning').nextSibling).toHaveTextContent('54°'); // 12 °C at 09:00

    await user.click(today!);
    expect(tomorrow).toHaveAttribute('aria-expanded', 'false');
    expect(today).toHaveAttribute('aria-expanded', 'true');
  });
});
