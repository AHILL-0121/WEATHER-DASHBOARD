import { useSyncExternalStore, type CSSProperties } from 'react';
import { CloudSun, Monitor, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { CONDITION_LABEL, conditionKind } from '@/lib/condition';
import { getLocalTime, isNightAt } from '@/lib/time';
import { tempColor } from '@/lib/tempColor';
import { formatTemp, type Units } from '@/lib/units';
import type { PlaceDTO, WeatherDTO } from '@/lib/types';
import { savedWeatherKey } from '@/hooks/useSavedWeather';
import { samePlace } from '@/hooks/usePlaces';
import type { ThemePref } from '@/hooks/usePrefs';
import { cn } from '@/lib/utils';
import Credits from './Credits';
import Segmented from './Segmented';

interface Props {
  saved: PlaceDTO[];
  savedWeather: Record<string, WeatherDTO>;
  current: PlaceDTO | null;
  units: Units;
  theme: ThemePref;
  now: number;
  onSelect: (place: PlaceDTO) => void;
  onRemove: (place: PlaceDTO) => void;
  onOpenSearch: () => void;
  onUnits: (units: Units) => void;
  onTheme: (theme: ThemePref) => void;
}

// "⌘K" on Apple devices, "Ctrl K" elsewhere. Read after hydration only.
const subscribeNever = () => () => {};
function useShortcutHint(): string {
  return useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    () => 'Ctrl K',
  );
}

function PlaceCard({
  place,
  weather,
  current,
  units,
  now,
  onSelect,
  onRemove,
}: {
  place: PlaceDTO;
  weather: WeatherDTO | undefined;
  current: boolean;
  units: Units;
  now: number;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const kind = weather ? conditionKind(weather) : null;
  const night = weather ? isNightAt(weather, now) : false;
  const summary = weather
    ? `${getLocalTime(weather.timezone, now)} · ${
        night && kind === 'clear' ? 'Clear night' : weather.description || CONDITION_LABEL[kind!]
      }`
    : 'Loading…';
  return (
    <li className="group relative shrink-0">
      <button
        type="button"
        aria-current={current ? 'true' : undefined}
        onClick={onSelect}
        style={{ '--tc': weather ? tempColor(weather.temp) : 'var(--ci-border-2)' } as CSSProperties}
        className={cn(
          'relative grid w-full min-w-[168px] grid-cols-[1fr_auto] gap-x-2.5 gap-y-0.5 rounded-lg border border-transparent py-3 pr-9 pl-3.5 text-left transition-colors duration-150 hover:bg-surface-2',
          'before:absolute before:top-3 before:bottom-3 before:left-0 before:w-[3px] before:rounded-[3px] before:bg-(--tc) before:opacity-90',
          current && 'border-[color-mix(in_srgb,var(--ci-accent)_35%,transparent)] bg-accent hover:bg-accent',
        )}
      >
        <span className="truncate font-medium">{place.name}</span>
        <span className="row-span-2 self-center text-[26px] leading-none font-light">
          {weather ? formatTemp(weather.temp, units) : ''}
        </span>
        <span className="truncate text-[12.5px] text-muted-foreground">{summary}</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${place.name} from saved places`}
        title="Remove"
        className="absolute top-2 right-1.5 grid size-6 place-items-center rounded-md text-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface-2 hover:text-foreground focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function Sidebar(props: Props) {
  const { saved, savedWeather, current, units, theme, now } = props;
  const hint = useShortcutHint();

  return (
    <aside
      aria-label="Places and settings"
      className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 min-[1100px]:sticky min-[1100px]:top-0 min-[1100px]:h-screen min-[1100px]:flex-col min-[1100px]:flex-nowrap min-[1100px]:items-stretch min-[1100px]:gap-4 min-[1100px]:overflow-y-auto min-[1100px]:border-r min-[1100px]:border-b-0 min-[1100px]:px-4 min-[1100px]:py-5"
    >
      <div className="flex items-center gap-2.5 px-1 text-base font-semibold">
        <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
          <CloudSun className="size-4" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <span className="max-[459px]:sr-only">Weather Dashboard</span>
      </div>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={props.onOpenSearch}
        className="flex h-10 min-w-[160px] flex-1 items-center gap-2 rounded-[10px] border border-input bg-surface-2 pr-2.5 pl-3 text-left text-muted-foreground hover:border-faint min-[1100px]:w-full min-[1100px]:flex-none"
      >
        <Search className="size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
        <span className="flex-1">Search places</span>
        <kbd className="rounded-[5px] border border-input bg-card px-[5px] py-px font-mono text-[11px] text-faint">
          {hint}
        </kbd>
      </button>

      <h2
        id="saved-heading"
        className="m-0 mt-1.5 px-1 text-xs font-medium tracking-[0.02em] text-faint max-[1099px]:sr-only"
      >
        Saved places
      </h2>
      <ul
        aria-labelledby="saved-heading"
        className="order-last m-0 flex basis-full list-none gap-1.5 overflow-x-auto p-0 pb-0.5 [scrollbar-width:none] min-[1100px]:order-none min-[1100px]:basis-auto min-[1100px]:flex-col min-[1100px]:overflow-visible"
      >
        {saved.map((place) => (
          <PlaceCard
            key={savedWeatherKey(place)}
            place={place}
            weather={savedWeather[savedWeatherKey(place)]}
            current={!!current && samePlace(place, current)}
            units={units}
            now={now}
            onSelect={() => props.onSelect(place)}
            onRemove={() => props.onRemove(place)}
          />
        ))}
        <li className="shrink-0">
          <button
            type="button"
            onClick={props.onOpenSearch}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm whitespace-nowrap text-muted-foreground hover:border-faint hover:text-foreground"
          >
            <Plus className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
            Add a place
          </button>
        </li>
      </ul>

      <div className="flex gap-2.5 min-[1100px]:mt-auto min-[1100px]:flex-col min-[1100px]:border-t min-[1100px]:border-border min-[1100px]:pt-3">
        <div className="flex items-center justify-between gap-2 text-[13.5px] text-foreground-2">
          <span className="max-[1099px]:sr-only">Units</span>
          <Segmented
            label="Units"
            value={units}
            onChange={props.onUnits}
            options={[
              { value: 'metric', label: '°C', ariaLabel: 'Celsius' },
              { value: 'imperial', label: '°F', ariaLabel: 'Fahrenheit' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-[13.5px] text-foreground-2">
          <span className="max-[1099px]:sr-only">Theme</span>
          <Segmented
            label="Theme"
            value={theme}
            onChange={props.onTheme}
            options={[
              { value: 'system', label: <Monitor aria-hidden="true" />, ariaLabel: 'System theme' },
              { value: 'light', label: <Sun aria-hidden="true" />, ariaLabel: 'Light theme' },
              { value: 'dark', label: <Moon aria-hidden="true" />, ariaLabel: 'Dark theme' },
            ]}
          />
        </div>
        <Credits className="m-0 text-xs text-faint max-[1099px]:hidden" />
      </div>
    </aside>
  );
}
