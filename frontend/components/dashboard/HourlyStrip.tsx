import { useState, type KeyboardEvent } from 'react';
import { CONDITION_LABEL, conditionKind, iconCode } from '@/lib/condition';
import { localHour } from '@/lib/summary';
import { tempColor } from '@/lib/tempColor';
import { formatTime } from '@/lib/time';
import { formatTemp, formatWind, toDisplayTemp, type Units } from '@/lib/units';
import { cn } from '@/lib/utils';
import type { ForecastHourDTO, WeatherDTO } from '@/lib/types';
import ConditionIcon from './ConditionIcon';

interface Column {
  now: boolean;
  time: number;
  temp: number;
  kind: ReturnType<typeof conditionKind>;
  night: boolean;
  pop: number;
  wind?: number;
  /** "↑06:42" when the sun rises or sets during this step */
  sunEvent?: string;
}

const LINE_H = 70; // px reserved for the curve and its labels
const CURVE_TOP = 22;
const CURVE_SPAN = 38;

function columns(weather: WeatherDTO, hours: ForecastHourDTO[], nowMs: number): Column[] {
  const tz = weather.timezone;
  const night = (icon: string) => iconCode(icon)?.endsWith('n') ?? false;
  const events = [weather.sunrise, weather.sunset]
    .filter((t): t is number => !!t)
    .flatMap((t) => [t, t + 86_400]); // tomorrow's are about a day later
  const sunEvent = (from: number, to: number) => {
    const t = events.find((e) => e > from && e <= to);
    if (t === undefined) return undefined;
    const rising = weather.sunrise !== undefined && (t - weather.sunrise) % 86_400 === 0;
    return `${rising ? '↑' : '↓'}${formatTime(t, tz)}`;
  };

  // "Now" comes from the current weather; the rest are the steps after it
  const [current, ...later] = hours;
  const nowCol: Column = {
    now: true,
    time: nowMs / 1000,
    temp: weather.temp,
    kind: conditionKind(weather),
    night: night(weather.icon),
    pop: current?.pop ?? 0,
    wind: weather.wind_speed,
  };
  let prev = nowCol.time;
  return [
    nowCol,
    ...later.map((h) => {
      const col: Column = {
        now: false,
        time: h.time,
        temp: h.temp,
        kind: conditionKind(h),
        night: night(h.icon),
        pop: h.pop,
        wind: h.wind_speed,
        sunEvent: sunEvent(prev, h.time),
      };
      prev = h.time;
      return col;
    }),
  ];
}

// Catmull-Rom → cubic Bézier: a smooth curve through every point
function smoothPath(pts: [number, number][]): string {
  if (!pts.length) return '';
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export default function HourlyStrip({
  weather,
  hours,
  units,
  now,
}: {
  weather: WeatherDTO;
  hours: ForecastHourDTO[];
  units: Units;
  now: number;
}) {
  const cols = columns(weather, hours, now);
  const [selected, setSelected] = useState(0);
  const sel = Math.min(selected, cols.length - 1);
  const tz = weather.timezone;

  const temps = cols.map((c) => c.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const y = (t: number) => CURVE_TOP + ((max - t) / (max - min || 1)) * CURVE_SPAN;
  // The curve is drawn in a 100-unit-per-column space and stretched to fit
  const pts = cols.map((c, i): [number, number] => [i * 100 + 50, y(c.temp)]);

  const label = (c: Column) => (c.now ? 'Now' : formatTime(c.time, tz));
  const condition = (c: Column) => (c.night && c.kind === 'clear' ? 'Clear night' : CONDITION_LABEL[c.kind]);

  const select = (i: number, focus: boolean) => {
    const next = Math.max(0, Math.min(cols.length - 1, i));
    setSelected(next);
    if (focus) {
      const el = document.getElementById(`hour-${next}`);
      el?.focus();
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step) select(sel + step, true);
    else if (e.key === 'Home') select(0, true);
    else if (e.key === 'End') select(cols.length - 1, true);
    else return;
    e.preventDefault();
  };

  const s = cols[sel]!;
  const wind = s.wind !== undefined ? formatWind(s.wind, units).join(' ') : null;

  return (
    <section
      aria-labelledby="hourly-heading"
      className="mt-4 rounded-xl border border-border bg-card shadow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-[18px] pt-4">
        <h2 id="hourly-heading" className="m-0 text-[15px] font-semibold">
          Next 24 hours
        </h2>
        <p className="m-0 text-[13px] text-muted-foreground">Select a time for details</p>
      </div>

      <div className="overflow-x-auto px-2.5 pt-2 pb-1 [scrollbar-width:thin]">
        <div
          role="radiogroup"
          aria-labelledby="hourly-heading"
          onKeyDown={onKeyDown}
          className="relative grid min-w-max auto-cols-[minmax(58px,1fr)] grid-flow-col"
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 w-full"
            height={LINE_H}
            viewBox={`0 0 ${cols.length * 100} ${LINE_H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="hourly-line"
                gradientUnits="userSpaceOnUse"
                x1="50"
                x2={cols.length * 100 - 50}
              >
                {cols.map((c, i) => (
                  <stop
                    key={c.time}
                    offset={cols.length > 1 ? i / (cols.length - 1) : 0}
                    stopColor={tempColor(c.temp)}
                  />
                ))}
              </linearGradient>
            </defs>
            <path
              d={smoothPath(pts)}
              fill="none"
              stroke="url(#hourly-line)"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {cols.map((c, i) => (
            <button
              key={c.time}
              id={`hour-${i}`}
              type="button"
              role="radio"
              aria-checked={i === sel}
              tabIndex={i === sel ? 0 : -1}
              onClick={() => select(i, false)}
              aria-label={`${label(c)}: ${toDisplayTemp(c.temp, units)} degrees, ${condition(c)}, ${c.pop}% chance of precipitation${c.sunEvent ? `, ${c.sunEvent.startsWith('↑') ? 'sunrise' : 'sunset'} at ${c.sunEvent.slice(1)}` : ''}`}
              className={cn(
                'relative grid grid-rows-[70px_22px_26px_18px_20px] items-center justify-items-center rounded-lg pt-1 pb-2 text-[13px] text-foreground-2 transition-colors duration-150 hover:bg-surface-2',
                i === sel &&
                  'bg-accent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ci-accent)_40%,transparent)] hover:bg-accent',
              )}
            >
              {/* Temperature label and dot sit on the curve */}
              <span className="relative h-full w-full" aria-hidden="true">
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-foreground"
                  style={{ top: y(c.temp) - 4 - 22 }}
                >
                  {formatTemp(c.temp, units)}
                </span>
                <span
                  className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card"
                  style={{
                    top: y(c.temp) - 4,
                    width: c.now ? 9 : 6,
                    height: c.now ? 9 : 6,
                    borderColor: tempColor(c.temp),
                  }}
                />
              </span>
              <ConditionIcon kind={c.kind} night={c.night} className="size-[18px] text-foreground-2" />
              <span className="font-mono text-[11.5px] text-rain" aria-hidden="true">
                {c.pop >= 10 ? `${c.pop}%` : ''}
              </span>
              <span
                aria-hidden="true"
                className="w-1.5 self-end rounded-[2px] bg-rain"
                style={{
                  height: Math.round((c.pop / 100) * 16),
                  opacity: c.pop >= 10 ? 0.25 + (c.pop / 100) * 0.6 : 0,
                }}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'font-mono text-xs text-muted-foreground',
                  c.now && 'font-medium text-foreground',
                  c.sunEvent && 'text-[#b5690a] dark:text-[#f0a24a]',
                )}
              >
                {c.now ? 'Now' : (c.sunEvent ?? String(localHour(c.time, tz)).padStart(2, '0'))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p
        aria-live="polite"
        className="mx-[18px] mt-0 mb-0 flex flex-wrap gap-x-[18px] gap-y-1.5 border-t border-border pt-3 pb-4 text-sm text-foreground-2 [&_b]:font-semibold [&_b]:text-foreground"
      >
        <span>
          <b>{label(s)}</b> · {condition(s)}
        </span>
        <span>
          Temperature <b>{formatTemp(s.temp, units)}</b>
          {s.now ? ` (feels ${formatTemp(weather.feels_like, units)})` : ''}
        </span>
        <span>
          Precipitation <b>{s.pop}%</b>
        </span>
        {wind && (
          <span>
            Wind <b>{wind}</b>
          </span>
        )}
        {s.now && (
          <span>
            Humidity <b>{Math.round(weather.humidity)}%</b>
          </span>
        )}
      </p>
    </section>
  );
}
