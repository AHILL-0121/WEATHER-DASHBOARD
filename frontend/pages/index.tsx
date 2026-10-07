import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, Search } from 'lucide-react';
import PageHead from '../components/PageHead';
import ErrorBoundary from '../components/ErrorBoundary';
import Sidebar from '../components/dashboard/Sidebar';
import CommandSearch from '../components/dashboard/CommandSearch';
import Hero from '../components/dashboard/Hero';
import DetailPanels from '../components/dashboard/DetailPanels';
import Credits from '../components/dashboard/Credits';
import useNow from '../hooks/useNow';
import useWeather from '../hooks/useWeather';
import usePlaces, { samePlace } from '../hooks/usePlaces';
import useSavedWeather from '../hooks/useSavedWeather';
import { useEffectiveTheme, useTheme, useUnits } from '../hooks/usePrefs';
import { CONDITION_LABEL, conditionKind } from '../lib/condition';
import { isNightAt } from '../lib/time';
import { toDisplayTemp } from '../lib/units';
import { fetchPlace } from '../lib/weatherClient';
import { cn } from '../lib/utils';
import type { PlaceDTO } from '../lib/types';

const MapCard = dynamic(() => import('../components/dashboard/MapCard'), {
  ssr: false,
  loading: () => <div className="h-[360px]" />,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

// false during the server render and hydration, true afterwards
const subscribeNever = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

export default function Home() {
  const hydrated = useHydrated();
  const { saved, recent, current, setCurrent, pick, remove } = usePlaces();
  const [units, setUnits] = useUnits();
  const [theme, setTheme] = useTheme();
  const mapTheme = useEffectiveTheme(theme);
  const { weather, loading, error, search, retry } = useWeather();
  const savedWeather = useSavedWeather(hydrated ? saved : []);
  const now = useNow();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const labelRequest = useRef<AbortController | null>(null);

  // Load the current place. Waits for hydration so a returning visitor's
  // stored place is used, rather than fetching the default first.
  const lat = current?.lat;
  const lon = current?.lon;
  useEffect(() => {
    if (hydrated && lat !== undefined && lon !== undefined) search({ lat, lon });
  }, [hydrated, lat, lon, search]);

  const choose = useCallback(
    (place: PlaceDTO, fromSearch = false) => {
      setNotice('');
      labelRequest.current?.abort();
      if (fromSearch) pick(place);
      else setCurrent(place);
    },
    [pick, setCurrent],
  );

  // Map clicks and "use my location": load the point straight away, then
  // name it from the reverse geocoder when that answers (open water stays unnamed)
  const choosePoint = useCallback(
    (pLat: number, pLon: number) => {
      const point: PlaceDTO = { name: '', lat: round2(pLat), lon: round2(pLon) };
      choose(point);
      const controller = new AbortController();
      labelRequest.current = controller;
      fetchPlace(point.lat, point.lon, controller.signal)
        .then((place) => {
          if (!place || controller.signal.aborted) return;
          const { name, state, country } = place;
          setCurrent((cur) => (cur && samePlace(cur, point) ? { ...point, name, state, country } : cur));
        })
        .catch(() => {});
    },
    [choose, setCurrent],
  );

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setNotice("Your browser can't share its location. Search for a place instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => choosePoint(pos.coords.latitude, pos.coords.longitude),
      (err) =>
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Search for a place instead.'
            : "Couldn't find your location. Search for a place instead.",
        ),
      { timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }, [choosePoint]);

  const night = isNightAt(weather, now);
  const kind = weather ? conditionKind(weather) : null;
  const name = current?.name || weather?.city || 'Unnamed location';
  const message = error || notice;

  return (
    <>
      <PageHead weather={weather} name={name} units={units} />

      {/* One-shot progress line while loading; static otherwise */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary',
          loading
            ? 'scale-x-[0.85] opacity-100 transition-transform duration-[600ms] ease-out'
            : 'scale-x-0 opacity-0',
        )}
      />

      <div className="grid min-h-screen grid-cols-1 min-[1100px]:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar
          saved={saved}
          savedWeather={savedWeather}
          current={current}
          units={units}
          theme={theme}
          now={now}
          onSelect={(place) => choose(place)}
          onRemove={remove}
          onOpenSearch={() => setSearchOpen(true)}
          onUnits={setUnits}
          onTheme={setTheme}
        />

        <main aria-busy={loading} className="w-full max-w-[1180px] px-[clamp(16px,3vw,36px)] pt-6 pb-12">
          {message && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-3 rounded-lg border border-[#e8a39a] bg-card px-4 py-3 text-sm"
            >
              <AlertCircle className="size-[18px] shrink-0 text-destructive" aria-hidden="true" />
              <span>
                {error && weather ? <b className="font-semibold">Couldn&apos;t refresh. </b> : null}
                {message}
                {error && weather ? ' Showing the last weather that loaded.' : ''}
              </span>
              {error && (
                <button type="button" onClick={retry} className="ml-auto shrink-0 font-medium text-primary">
                  Try again
                </button>
              )}
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {weather && kind && !loading
              ? `${name}: ${toDisplayTemp(weather.temp, units)} degrees, ${weather.description || CONDITION_LABEL[kind]}.`
              : ''}
          </p>

          {!current ? (
            <section className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
              <h1 className="m-0 text-xl font-semibold">No place selected</h1>
              <p className="mt-2 text-muted-foreground">Search for a city, or use your current location.</p>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 font-medium text-primary-foreground"
              >
                <Search className="size-4" aria-hidden="true" />
                Search places
              </button>
            </section>
          ) : (
            <div className={cn('transition-opacity duration-150', loading && weather && 'opacity-50')}>
              {weather ? (
                <>
                  <Hero weather={weather} place={current} units={units} night={night} now={now} />
                  <div className="mt-4">
                    <DetailPanels weather={weather} units={units} now={now} />
                  </div>
                </>
              ) : (
                // First load: a quiet placeholder the size of the hero, no shimmer
                <div className="h-[360px] rounded-[20px] border border-border bg-card" aria-hidden="true" />
              )}

              <section
                aria-labelledby="map-heading"
                className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-[18px] pt-4">
                  <h2 id="map-heading" className="m-0 text-[15px] font-semibold">
                    Map
                  </h2>
                  <p className="m-0 text-[13px] text-muted-foreground">
                    Click to check another spot. Search works from the keyboard.
                  </p>
                </div>
                <div className="mt-3.5 border-t border-border bg-surface-2">
                  <ErrorBoundary
                    name="Map"
                    fallback={
                      <p role="alert" className="m-0 grid h-[360px] place-items-center text-faint">
                        The map couldn&apos;t be loaded. Search by city name instead.
                      </p>
                    }
                  >
                    <MapCard lat={current.lat} lon={current.lon} theme={mapTheme} onPick={choosePoint} />
                  </ErrorBoundary>
                </div>
              </section>
            </div>
          )}

          {/* The sidebar's credits are hidden on narrow screens */}
          <footer className="mt-8 min-[1100px]:hidden">
            <Credits className="m-0 text-center text-xs text-faint" />
          </footer>
        </main>
      </div>

      <CommandSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        recent={recent}
        onPick={(place) => choose(place, true)}
        onLocate={locate}
      />
    </>
  );
}
