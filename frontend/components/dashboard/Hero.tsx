import type { CSSProperties } from 'react';
import { Info, Umbrella } from 'lucide-react';
import { CONDITION_LABEL, conditionKind, type ConditionKind } from '@/lib/condition';
import { getLocalTime } from '@/lib/time';
import { formatTemp, toDisplayTemp, type Units } from '@/lib/units';
import type { Summary } from '@/lib/summary';
import type { PlaceDTO, WeatherDTO } from '@/lib/types';
import WeatherArt from './WeatherArt';

// [top, bottom, ink] per condition: static gradients whose ink keeps ≥ 4.5:1 contrast
const GRADIENTS: Record<'day' | 'night', Record<ConditionKind, [string, string, string]>> = {
  day: {
    clear: ['#3d86d6', '#86bdf0', '#fff'],
    partly: ['#4f86c4', '#9cc3e8', '#fff'],
    clouds: ['#5d6f88', '#93a3b8', '#fff'],
    rain: ['#46576f', '#7a8ba2', '#fff'],
    storm: ['#3a3757', '#66648a', '#fff'],
    snow: ['#a9bdd2', '#e1e9f1', '#0d1726'],
    mist: ['#a2acb7', '#d3d9df', '#0d1726'],
  },
  night: {
    clear: ['#0c1834', '#22355c', '#fff'],
    partly: ['#121e38', '#2a3a5c', '#fff'],
    clouds: ['#1a2230', '#323d50', '#fff'],
    rain: ['#141f31', '#2a394f', '#fff'],
    storm: ['#16132a', '#2e2948', '#fff'],
    snow: ['#223047', '#41526b', '#fff'],
    mist: ['#222832', '#3a424e', '#fff'],
  },
};

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** "GB" → "United Kingdom"; unknown codes are returned as they are */
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

interface Props {
  weather: WeatherDTO;
  /** The place the user picked; its geocoder name beats OpenWeather's station name */
  place: PlaceDTO | null;
  units: Units;
  night: boolean;
  now: number;
  /** Plain-language outlook; null until the forecast arrives */
  summary: Summary | null;
}

export default function Hero({ weather, place, units, night, now, summary }: Props) {
  const kind = conditionKind(weather);
  const [top, bottom, ink] = GRADIENTS[night ? 'night' : 'day'][kind];
  const lightInk = ink === '#fff';
  const style = {
    '--h1': top,
    '--h2': bottom,
    '--h-ink': ink,
    '--h-ink-2': lightInk ? 'rgb(255 255 255 / 0.82)' : 'rgb(13 23 38 / 0.74)',
    '--h-glass': lightInk ? 'rgb(255 255 255 / 0.12)' : 'rgb(255 255 255 / 0.45)',
  } as CSSProperties;

  const name = place?.name || weather.city || 'Unnamed location';
  let region: string | undefined;
  if (place?.name) region = [place.state, countryName(place.country)].filter(Boolean).join(', ');
  else if (weather.city) region = countryName(weather.country);
  else region = `${weather.lat.toFixed(2)}°, ${weather.lon.toFixed(2)}°`;

  const condition = night && kind === 'clear' ? 'Clear night' : weather.description || CONDITION_LABEL[kind];
  const temp = toDisplayTemp(weather.temp, units);

  return (
    <section
      aria-labelledby="place-name"
      style={style}
      className="relative overflow-hidden rounded-[20px] border border-black/5 bg-linear-160 from-(--h1) to-(--h2) text-(--h-ink)"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 p-[clamp(20px,3vw,32px)] min-[600px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h1
            id="place-name"
            className="m-0 text-[clamp(22px,2.6vw,30px)] leading-[1.15] font-semibold tracking-[-0.01em]"
          >
            {name}
          </h1>
          <p className="mt-0.5 text-sm text-(--h-ink-2)">
            {[region, `${getLocalTime(weather.timezone, now)} local time`].filter(Boolean).join(' · ')}
          </p>
          <p
            className="mt-[18px] mb-1 text-[clamp(88px,12vw,136px)] leading-none font-light tracking-[-0.04em]"
            aria-label={`${temp} degrees`}
          >
            {temp}
            <sup className="relative top-[0.3em] ml-[0.03em] align-top text-[0.36em] tracking-normal">°</sup>
          </p>
          <p className="text-xl font-medium">{condition}</p>
          <p className="mt-0.5 text-[15px] text-(--h-ink-2)">
            H {formatTemp(weather.temp_max, units)} · L {formatTemp(weather.temp_min, units)} · Feels like{' '}
            {formatTemp(weather.feels_like, units)}
          </p>
        </div>
        <div className="absolute top-16 right-3.5 w-[140px] opacity-95 min-[600px]:static min-[600px]:w-[clamp(150px,20vw,230px)] min-[600px]:self-center min-[600px]:opacity-100">
          <WeatherArt kind={kind} night={night} />
        </div>
        {summary && (
          <p className="col-span-full mt-3.5 mb-0 flex items-start gap-2.5 rounded-lg bg-(--h-glass) px-3.5 py-3 text-[15px] leading-[1.45]">
            {summary.wet ? (
              <Umbrella className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
            )}
            <span>
              <b className="font-semibold">{summary.lead}</b>
              {summary.rest}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
