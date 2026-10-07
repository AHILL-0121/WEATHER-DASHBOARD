import { useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error';

// Loads one resource for a point (forecast, air quality) whenever the point
// changes. The previous result stays visible while the next loads, like the
// current weather; on failure it's cleared so another place's data is never
// shown. Stale responses are aborted.
export default function usePointData<T>(
  lat: number | undefined,
  lon: number | undefined,
  load: (lat: number, lon: number, signal: AbortSignal) => Promise<T>,
): { data: T | null; status: Status } {
  const [state, setState] = useState<{ key: string; data: T | null; failed: boolean }>({
    key: '',
    data: null,
    failed: false,
  });
  const key = lat !== undefined && lon !== undefined ? `${lat},${lon}` : '';

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    const controller = new AbortController();
    load(lat, lon, controller.signal)
      .then((data) => setState({ key: `${lat},${lon}`, data, failed: false }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setState({ key: `${lat},${lon}`, data: null, failed: true });
      });
    return () => controller.abort();
    // `load` is a module-level function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  let status: Status = 'idle';
  if (key) status = state.key !== key ? 'loading' : state.failed ? 'error' : 'ready';
  return { data: state.data, status };
}
