import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPlace, getWeather } from '../lib/weatherClient';

const OFFLINE_MESSAGE = "Couldn't reach the server. Check your connection and try again.";

// The single path for loading weather. Only the latest request may update
// state: starting a new one aborts the previous. The last good result stays
// in `weather` while a new one loads or fails, so the map never jumps.
export default function useWeather({ onPlaceLabel } = {}) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);
  const onPlaceLabelRef = useRef(onPlaceLabel);

  useEffect(() => {
    onPlaceLabelRef.current = onPlaceLabel;
  }, [onPlaceLabel]);
  useEffect(() => () => requestRef.current?.abort(), []);

  const load = useCallback(async ({ city, lat, lon }, { labelFromCoords = false } = {}) => {
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
    if (!hasCoords && !city) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setError('');
    try {
      // Map clicks need a place name for the search box; fetch it alongside the weather
      const placePromise = labelFromCoords ? fetchPlace(lat, lon, signal) : null;
      placePromise?.catch(() => {}); // avoid an unhandled rejection if the weather call fails first

      const data = await getWeather({ city, lat, lon }, signal);
      if (signal.aborted) return;
      setWeather(data);

      if (placePromise) {
        const place = await placePromise;
        if (signal.aborted) return;
        onPlaceLabelRef.current?.(
          place
            ? [place.name, place.state, place.country].filter(Boolean).join(', ')
            : `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        );
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal.aborted) return;
      setError(err instanceof TypeError ? OFFLINE_MESSAGE : err.message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }, []);

  const search = useCallback((query) => load(query), [load]);
  const searchPoint = useCallback((lat, lon) => load({ lat, lon }, { labelFromCoords: true }), [load]);

  return { weather, loading, error, search, searchPoint };
}
