import { useEffect, useSyncExternalStore } from 'react';
import useStoredState from './useStoredState';
import type { Units } from '../lib/units';

export type ThemePref = 'system' | 'light' | 'dark';

const isUnits = (v: unknown): v is Units => v === 'metric' || v === 'imperial';
const isTheme = (v: unknown): v is ThemePref => v === 'system' || v === 'light' || v === 'dark';

export function useUnits() {
  return useStoredState<Units>('units', 'metric', isUnits);
}

// The theme is independent of the location's day or night (UX-07). "system"
// removes data-theme so the CSS follows prefers-color-scheme. public/theme-init.js
// applies the stored choice before first paint; this keeps it in sync afterwards.
export function useTheme() {
  const [theme, setTheme] = useStoredState<ThemePref>('theme', 'system', isTheme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
  return [theme, setTheme] as const;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeDark(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** The theme actually showing: the stored choice, or the system's when "system" */
export function useEffectiveTheme(theme: ThemePref): 'light' | 'dark' {
  const systemDark = useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  if (theme !== 'system') return theme;
  return systemDark ? 'dark' : 'light';
}
