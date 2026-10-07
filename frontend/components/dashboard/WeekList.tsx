import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CONDITION_LABEL, conditionKind, isWet } from '@/lib/condition';
import { dayName, localHour } from '@/lib/summary';
import { tempColor } from '@/lib/tempColor';
import { formatTemp, toDisplayTemp, type Units } from '@/lib/units';
import { cn } from '@/lib/utils';
import type { ForecastDayDTO, ForecastDTO } from '@/lib/types';
import ConditionIcon from './ConditionIcon';

const PERIODS: [label: string, hour: number][] = [
  ['Morning', 9],
  ['Afternoon', 15],
  ['Evening', 19],
  ['Night', 23],
];

// The day's own 3-hour temperatures as a small line, plus period readings
function DayDetail({ day, tz, units }: { day: ForecastDayDTO; tz: number; units: Units }) {
  const kind = conditionKind(day);
  const steps = day.steps;
  const w = 400;
  const h = 70;
  const temps = steps.map((s) => s.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const x = (s: (typeof steps)[number]) => 4 + (((s.time + tz) % 86_400) / 86_400) * (w - 8);
  const y = (t: number) => 8 + ((max - t) / (max - min || 1)) * 40;

  const blurb = isWet(kind)
    ? `${CONDITION_LABEL[kind]} at times, ${day.pop}% chance overall.`
    : kind === 'clear'
      ? 'Sunny and settled.'
      : `${CONDITION_LABEL[kind]} and mostly dry.`;

  // Nearest step to each period, if the day has one within 2 hours
  const periods = PERIODS.map(([label, hour]) => {
    const near = steps.find((s) => Math.abs(localHour(s.time, tz) - hour) <= 2);
    return { label, temp: near?.temp };
  }).filter((p) => p.temp !== undefined);

  return (
    <div className="px-2.5 pt-0.5 pb-3.5 text-[13.5px] text-foreground-2">
      {blurb}
      {steps.length > 1 && (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="mt-1.5 block h-[70px] w-full"
        >
          <defs>
            <linearGradient id={`day-${day.date}`} gradientUnits="userSpaceOnUse" x1="0" x2={w}>
              {steps.map((s) => (
                <stop key={s.time} offset={x(s) / w} stopColor={tempColor(s.temp)} />
              ))}
            </linearGradient>
          </defs>
          {steps.map(
            (s) =>
              s.pop > 20 && (
                <rect
                  key={`p${s.time}`}
                  x={x(s) - 3}
                  y={h - 12 - (s.pop / 100) * 12}
                  width="6"
                  height={(s.pop / 100) * 12}
                  rx="1.5"
                  fill="var(--ci-rain)"
                  opacity=".5"
                />
              ),
          )}
          <polyline
            points={steps.map((s) => `${x(s)},${y(s.temp)}`).join(' ')}
            fill="none"
            stroke={`url(#day-${day.date})`}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {periods.length > 0 && (
        <dl className="mt-2 grid grid-cols-4 gap-1.5 text-xs text-muted-foreground">
          {periods.map((p) => (
            <div key={p.label}>
              <dt>{p.label}</dt>
              <dd className="m-0 text-lg font-normal text-foreground">{formatTemp(p.temp, units)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function WeekList({
  forecast,
  currentTemp,
  units,
  now,
}: {
  forecast: ForecastDTO;
  currentTemp: number;
  units: Units;
  now: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const days = forecast.daily;
  const tz = forecast.timezone;
  const min = Math.min(...days.map((d) => d.temp_min));
  const max = Math.max(...days.map((d) => d.temp_max));
  const span = max - min || 1;
  const pct = (t: number) => ((t - min) / span) * 100;

  return (
    <section
      aria-labelledby="week-heading"
      className="rounded-xl border border-border bg-card pb-1.5 shadow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-[18px] pt-4">
        <h2 id="week-heading" className="m-0 text-[15px] font-semibold">
          {days.length}-day forecast
        </h2>
        <p className="m-0 text-[13px] text-muted-foreground">
          {formatTemp(min, units)} to {formatTemp(max, units)}
        </p>
      </div>
      <ul className="m-0 mt-2 list-none px-2">
        {days.map((d, i) => {
          const name = dayName(d.date, tz, now);
          const kind = conditionKind(d);
          const expanded = open === d.date;
          const panelId = `day-panel-${d.date}`;
          return (
            <li key={d.date}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : d.date)}
                className={cn(
                  'grid w-full grid-cols-[52px_22px_34px_30px_minmax(40px,1fr)_30px_14px] items-center gap-[7px] rounded-[10px] px-1.5 py-[11px] text-left text-sm hover:bg-surface-2 min-[480px]:grid-cols-[84px_24px_38px_34px_minmax(50px,1fr)_34px_16px] min-[480px]:gap-2.5 min-[480px]:px-2.5',
                  i > 0 &&
                    'rounded-none border-t border-border hover:rounded-[10px] hover:border-transparent',
                )}
              >
                <span className="font-medium">{name}</span>
                <ConditionIcon kind={kind} night={false} className="size-[18px] text-foreground-2" />
                <span className="font-mono text-xs text-rain" aria-hidden="true">
                  {d.pop >= 20 ? `${d.pop}%` : ''}
                </span>
                <span className="text-right text-muted-foreground" aria-hidden="true">
                  {formatTemp(d.temp_min, units)}
                </span>
                <span className="relative h-1.5 rounded-full bg-track" aria-hidden="true">
                  <i
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${pct(d.temp_min)}%`,
                      width: `${Math.max(5, pct(d.temp_max) - pct(d.temp_min))}%`,
                      background: `linear-gradient(90deg, ${tempColor(d.temp_min)}, ${tempColor(d.temp_max)})`,
                    }}
                  />
                  {name === 'Today' && (
                    <b
                      className="absolute top-1/2 -mt-[5px] -ml-[5px] size-2.5 rounded-full border-2 border-foreground bg-card"
                      style={{ left: `${Math.min(97, Math.max(3, pct(currentTemp)))}%` }}
                    />
                  )}
                </span>
                <span className="text-right font-medium" aria-hidden="true">
                  {formatTemp(d.temp_max, units)}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 text-faint transition-transform duration-[180ms]',
                    expanded && 'rotate-180',
                  )}
                />
                <span className="sr-only">
                  {CONDITION_LABEL[kind]}, low {toDisplayTemp(d.temp_min, units)}, high{' '}
                  {toDisplayTemp(d.temp_max, units)} degrees
                  {d.pop >= 20 ? `, ${d.pop}% chance of precipitation` : ''}
                </span>
              </button>
              <div id={panelId} hidden={!expanded}>
                {expanded && <DayDetail day={d} tz={tz} units={units} />}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
