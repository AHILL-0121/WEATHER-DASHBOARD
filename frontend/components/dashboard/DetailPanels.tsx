import type { ReactNode } from 'react';
import { formatTime } from '@/lib/time';
import { compass, dewPoint, formatTemp, formatVisibility, formatWind, type Units } from '@/lib/units';
import type { WeatherDTO } from '@/lib/types';
import InfoTip from './InfoTip';

function Panel({ label, tip, children }: { label: string; tip?: string; children: ReactNode }) {
  return (
    <article className="flex min-h-[168px] flex-col rounded-xl border border-border bg-card px-[18px] pt-4 pb-[18px] shadow-card">
      <h2 className="m-0 flex items-center gap-1.5 text-[13px] font-normal text-muted-foreground">
        {label}
        {tip && <InfoTip>{tip}</InfoTip>}
      </h2>
      {children}
    </article>
  );
}

function Value({ children, unit }: { children: ReactNode; unit?: string }) {
  return (
    <p className="mt-1.5 text-[32px] leading-[1.1] font-light tracking-[-0.01em]">
      {children}
      {unit && (
        <small className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">{unit}</small>
      )}
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-auto pt-2.5 text-[13.5px] leading-[1.4] text-foreground-2">{children}</p>;
}

// A row of segments with the active one at full strength
function Scale({
  colours,
  active,
  labels,
}: {
  colours: string[];
  active: number;
  labels?: [string, string];
}) {
  return (
    <div className="mt-2.5" aria-hidden="true">
      <div className="flex gap-[3px]">
        {colours.map((c, i) => (
          <span
            key={c}
            className="h-1.5 flex-1 rounded-[2px]"
            style={{ background: c, opacity: i === active ? 1 : 0.28 }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-[5px] flex justify-between text-[11.5px] text-faint">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

/** "2 h 05 min" */
export function duration(seconds: number): string {
  const totalMin = Math.max(0, Math.round(seconds / 60));
  return `${Math.floor(totalMin / 60)} h ${String(totalMin % 60).padStart(2, '0')} min`;
}

const COMFORT: [label: string, below: number, colour: string][] = [
  ['dry', 10, '#8fb8de'],
  ['pleasant', 16, '#8cc65a'],
  ['humid', 21, '#e9c43f'],
  ['sticky', 24, '#ef9441'],
  ['oppressive', Infinity, '#e0573c'],
];

function feelsWhy(w: WeatherDTO): string {
  const diff = w.feels_like - w.temp;
  if (diff > 1.5) return 'Humidity makes it feel warmer than it is.';
  if (diff < -1.5) return 'Wind makes it feel colder than it is.';
  return 'Close to the actual temperature.';
}

function pressureNote(hPa: number): string {
  if (hPa < 1000) return 'Low. Unsettled, cloudy or wet weather is more likely.';
  if (hPa > 1022) return 'High. Usually brings settled weather.';
  return 'Near average.';
}

function visibilityNote(m: number): string {
  if (m >= 10_000) return 'Clear view to the horizon.';
  if (m >= 5_000) return 'Light haze in the distance.';
  return 'Reduced. Take care on the roads.';
}

function WindPanel({ w, units }: { w: WeatherDTO; units: Units }) {
  if (w.wind_speed === undefined) {
    return (
      <Panel label="Wind">
        <Value>--</Value>
        <Note>No wind data for this spot.</Note>
      </Panel>
    );
  }
  const [speed, unit] = formatWind(w.wind_speed, units);
  const dir = w.wind_deg !== undefined ? compass(w.wind_deg) : null;
  const tick = (a: number, r1: number, r2: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return (
      <line
        key={a}
        x1={44 + r1 * Math.cos(t)}
        y1={44 + r1 * Math.sin(t)}
        x2={44 + r2 * Math.cos(t)}
        y2={44 + r2 * Math.sin(t)}
        stroke="var(--ci-border-2)"
        strokeWidth="1.5"
      />
    );
  };
  return (
    <Panel label="Wind" tip="Direction is where the wind comes from. Gusts are the strongest short bursts.">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <Value unit={unit}>{speed}</Value>
        {w.wind_deg !== undefined && (
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
            <circle cx="44" cy="44" r="40" fill="none" stroke="var(--ci-border)" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => tick(a, a % 90 ? 35 : 32, 40))}
            {(
              [
                ['N', 44, 18],
                ['E', 71, 47],
                ['S', 44, 76],
                ['W', 17, 47],
              ] as const
            ).map(([l, x, y]) => (
              <text
                key={l}
                x={x}
                y={y}
                textAnchor="middle"
                className="fill-faint font-mono text-[10px] font-medium"
              >
                {l}
              </text>
            ))}
            {/* The arrow points where the wind blows to */}
            <g transform={`rotate(${(w.wind_deg + 180) % 360} 44 44)`}>
              <line
                x1="44"
                y1="62"
                x2="44"
                y2="24"
                stroke="var(--ci-text)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path d="M44 18 50 29 38 29Z" fill="var(--ci-text)" />
            </g>
            <circle cx="44" cy="44" r="3" fill="var(--ci-surface)" stroke="var(--ci-text)" strokeWidth="2" />
          </svg>
        )}
      </div>
      <Note>
        {dir ? `From the ${dir.name} (${dir.abbr})` : 'Direction unknown'}
        {w.wind_gust !== undefined ? `, gusting to ${formatWind(w.wind_gust, units).join(' ')}.` : '.'}
      </Note>
    </Panel>
  );
}

function PressurePanel({ hPa }: { hPa: number }) {
  const min = 960;
  const max = 1050;
  const angle = ((-120 + ((Math.min(Math.max(hPa, min), max) - min) / (max - min)) * 240) * Math.PI) / 180;
  const at = (deg: number) => [
    44 + 36 * Math.cos((deg * Math.PI) / 180),
    44 + 36 * Math.sin((deg * Math.PI) / 180),
  ];
  const [sx, sy] = at(-210);
  const [ex, ey] = at(30);
  return (
    <Panel
      label="Pressure"
      tip="Falling pressure often brings clouds and rain. Rising pressure usually brings settled weather."
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <Value unit="hPa">{Math.round(hPa)}</Value>
        <svg width="88" height="70" viewBox="0 0 88 70" aria-hidden="true">
          <path
            d={`M${sx},${sy} A36 36 0 1 1 ${ex},${ey}`}
            fill="none"
            stroke="var(--ci-track)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <line
            x1="44"
            y1="44"
            x2={44 + 28 * Math.sin(angle)}
            y2={44 - 28 * Math.cos(angle)}
            stroke="var(--ci-text)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="44" cy="44" r="4" fill="var(--ci-text)" />
          <text x="10" y="68" className="fill-faint font-mono text-[9.5px]">
            Low
          </text>
          <text x="78" y="68" textAnchor="end" className="fill-faint font-mono text-[9.5px]">
            High
          </text>
        </svg>
      </div>
      <Note>{pressureNote(hPa)}</Note>
    </Panel>
  );
}

function SunPanel({ w, now }: { w: WeatherDTO; now: number }) {
  const { sunrise, sunset, timezone } = w;
  if (!sunrise || !sunset || sunset <= sunrise) {
    return (
      <Panel label="Sunrise & sunset">
        <Note>No sunrise or sunset here today (polar day or night).</Note>
      </Panel>
    );
  }
  const nowSec = now / 1000;
  const up = nowSec >= sunrise && nowSec <= sunset;
  const p = Math.min(Math.max((nowSec - sunrise) / (sunset - sunrise), 0), 1);
  // After sunset, tomorrow's sunrise is about a day after today's
  const toNext = up ? sunset - nowSec : nowSec < sunrise ? sunrise - nowSec : sunrise + 86_400 - nowSec;
  const angle = Math.PI * (1 - p);
  return (
    <Panel label="Sunrise & sunset">
      <svg width="100%" height="70" viewBox="0 0 120 64" aria-hidden="true" className="mt-2">
        <path
          d="M10 56 A50 50 0 0 1 110 56"
          fill="none"
          stroke="var(--ci-track)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {up && (
          <>
            <path
              d="M10 56 A50 50 0 0 1 110 56"
              fill="none"
              stroke="#ef9441"
              strokeWidth="4"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${(p * 100).toFixed(1)} 100`}
            />
            <circle
              cx={60 + 50 * Math.cos(angle)}
              cy={56 - 50 * Math.sin(angle)}
              r="5"
              fill="#ffc23d"
              stroke="var(--ci-surface)"
              strokeWidth="2"
            />
          </>
        )}
        <line x1="2" x2="118" y1="56" y2="56" stroke="var(--ci-border-2)" />
      </svg>
      <Note>
        <b className="font-semibold text-foreground">
          {up ? 'Sunset' : 'Sunrise'} in {duration(toNext)}
        </b>
        <br />
        Sunrise {formatTime(sunrise, timezone)} · Sunset {formatTime(sunset, timezone)} ·{' '}
        {duration(sunset - sunrise)} of daylight
      </Note>
    </Panel>
  );
}

export default function DetailPanels({
  weather: w,
  units,
  now,
}: {
  weather: WeatherDTO;
  units: Units;
  now: number;
}) {
  const dew = dewPoint(w.temp, w.humidity);
  const comfort = COMFORT.findIndex(([, below]) => dew < below);
  const visibility = w.visibility !== undefined ? formatVisibility(w.visibility, units) : null;

  return (
    <section
      aria-label="Current details"
      className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 lg:grid-cols-3"
    >
      <Panel
        label="Feels like"
        tip="Combines temperature with humidity and wind to estimate how the air feels on your skin."
      >
        <Value>{formatTemp(w.feels_like, units)}</Value>
        <Note>{feelsWhy(w)}</Note>
      </Panel>

      <WindPanel w={w} units={units} />

      <Panel
        label="Humidity"
        tip="Dew point is a better guide to mugginess than relative humidity. Above about 21° most people find it sticky."
      >
        <Value unit="%">{Math.round(w.humidity)}</Value>
        <Scale colours={COMFORT.map(([, , c]) => c)} active={comfort} labels={['Dry', 'Oppressive']} />
        <Note>
          Dew point {formatTemp(dew, units)}:{' '}
          <b className="font-semibold text-foreground">{COMFORT[comfort]![0]}</b>.
        </Note>
      </Panel>

      <PressurePanel hPa={w.pressure} />

      <Panel label="Visibility">
        <Value unit={visibility?.[1]}>{visibility?.[0] ?? '--'}</Value>
        <Note>{w.visibility !== undefined ? visibilityNote(w.visibility) : 'No visibility data.'}</Note>
      </Panel>

      <SunPanel w={w} now={now} />
    </section>
  );
}
