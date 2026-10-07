import { useEffect, useState } from 'react';
import { getWeather } from '../lib/weatherClient';
import type { PlaceDTO, WeatherDTO } from '../lib/types';

const key = (p: Pick<PlaceDTO, 'lat' | 'lon'>) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

// Current weather for each saved place, keyed by rounded coordinates. Failures
// just leave a place without data; the sidebar shows its name regardless.
// Responses are cached for 5 minutes by weatherClient, so this costs little.
export default function useSavedWeather(places: PlaceDTO[]): Record<string, WeatherDTO> {
  const [byKey, setByKey] = useState<Record<string, WeatherDTO>>({});
  const placesKey = places.map(key).join('|');

  useEffect(() => {
    const controller = new AbortController();
    for (const place of places) {
      getWeather({ lat: place.lat, lon: place.lon }, controller.signal)
        .then((w) => setByKey((prev) => ({ ...prev, [key(place)]: w })))
        .catch(() => {});
    }
    return () => controller.abort();
    // placesKey captures every change that matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesKey]);

  return byKey;
}

export const savedWeatherKey = key;
