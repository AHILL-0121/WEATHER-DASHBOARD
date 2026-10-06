import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPlace, getWeather, hasCoords, type WeatherQuery } from '../lib/weatherClient';
import type { WeatherDTO } from '../lib/types';

const OFFLINE_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

interface Options {
  /** Called with a display name for map clicks ("Paris, FR", or coordinates for open water) */
  onPlaceLabel?: (label: string) => void;
}

export interface UseWeather {
  weather: WeatherDTO | null;
  loading: boolean;
  error: string;
  search: (query: WeatherQuery) => Promise<void>;
  searchPoint: (lat: number, lon: number) => Promise<void>;
}

// The single path for loading weather. Only the latest request may update
// state: starting a new one aborts the previous. The last good result stays
// in `weather` while a new one loads or fails, so the map never jumps.
export default function useWeather({ onPlaceLabel }: Options = {}): UseWeather {
  const [weather, setWeather] = useState<WeatherDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const onPlaceLabelRef = useRef(onPlaceLabel);

  useEffect(() => {
    onPlaceLabelRef.current = onPlaceLabel;
  }, [onPlaceLabel]);
  useEffect(() => () => requestRef.current?.abort(), []);

  const load = useCallback(async (query: WeatherQuery, { labelFromCoords = false } = {}) => {
    const point = hasCoords(query) ? query : null;
    if (!point && !query.city) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setError('');
    try {
      // Map clicks need a place name for the search box; fetch it alongside the weather
      const placePromise = labelFromCoords && point ? fetchPlace(point.lat, point.lon, signal) : null;
      placePromise?.catch(() => {}); // avoid an unhandled rejection if the weather call fails first

      const data = await getWeather(query, signal);
      if (signal.aborted) return;
      setWeather(data);

      if (placePromise && point) {
        const place = await placePromise;
        if (signal.aborted) return;
        onPlaceLabelRef.current?.(
          place
            ? [place.name, place.state, place.country].filter(Boolean).join(', ')
            : `${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`,
        );
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError' || signal.aborted) return;
      setError(err instanceof TypeError ? OFFLINE_MESSAGE : (err as Error).message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);

  const search = useCallback((query: WeatherQuery) => load(query), [load]);
  const searchPoint = useCallback(
    (lat: number, lon: number) => load({ lat, lon }, { labelFromCoords: true }),
    [load],
  );

  return { weather, loading, error, search, searchPoint };
}
