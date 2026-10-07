import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, hasCoords, type WeatherQuery } from '../lib/weatherClient';
import type { WeatherDTO } from '../lib/types';

const OFFLINE_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

export interface UseWeather {
  weather: WeatherDTO | null;
  loading: boolean;
  error: string;
  search: (query: WeatherQuery) => Promise<void>;
  /** Repeats the last search, e.g. from the error banner */
  retry: () => Promise<void>;
}

// The single path for loading weather. Only the latest request may update
// state: starting a new one aborts the previous. The last good result stays
// in `weather` while a new one loads or fails, so the page never blanks.
export default function useWeather(): UseWeather {
  const [weather, setWeather] = useState<WeatherDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const lastQuery = useRef<WeatherQuery | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const search = useCallback(async (query: WeatherQuery) => {
    if (!hasCoords(query) && !query.city) return;
    lastQuery.current = query;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setError('');
    try {
      const data = await getWeather(query, signal);
      if (!signal.aborted) setWeather(data);
    } catch (err) {
      if ((err as Error).name === 'AbortError' || signal.aborted) return;
      setError(err instanceof TypeError ? OFFLINE_MESSAGE : (err as Error).message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    if (lastQuery.current) await search(lastQuery.current);
  }, [search]);

  return { weather, loading, error, search, retry };
}
