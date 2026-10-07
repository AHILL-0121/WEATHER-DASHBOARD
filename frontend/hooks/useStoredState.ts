import { useCallback, useMemo, useSyncExternalStore } from 'react';

// State kept in localStorage under "wd:<key>". Every component using the same
// key stays in sync, including across tabs. The server render and the first
// client render use `fallback`, so hydration never mismatches; the stored
// value arrives on the next render. Storage can be unavailable (private
// windows, blocked cookies): reads then return `fallback` and writes are
// kept in memory for the session.

const PREFIX = 'wd:';
const listeners = new Set<() => void>();
const memory = new Map<string, string>();

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, value: string): void {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* storage unavailable: the in-memory copy still serves this tab */
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function useStoredState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (next: T | ((prev: T) => T)) => void] {
  // The raw string is the snapshot: it's stable between renders, unlike a parsed object
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
    // fallback and isValid are expected to be module-level constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      // Read the latest stored value so consecutive updates compose
      let prev = fallback;
      const current = readRaw(key);
      if (current !== null) {
        try {
          const parsed: unknown = JSON.parse(current);
          if (isValid(parsed)) prev = parsed;
        } catch {
          /* keep fallback */
        }
      }
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeRaw(key, JSON.stringify(resolved));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, set];
}
