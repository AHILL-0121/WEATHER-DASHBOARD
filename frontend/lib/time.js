// Time helpers. Every timestamp here is UTC (Unix seconds from OpenWeather,
// ms from Date.now()), and tzOffset is the location's offset in seconds.
// The viewer's own timezone must never affect the result.

// "HH:MM" at the location for a Unix timestamp in seconds
export function formatTime(unix, tzOffset = 0) {
  if (!unix) return '--';
  const d = new Date((unix + tzOffset) * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// Current "HH:MM" at the location: shift UTC now by the offset, then format as UTC
export function getLocalTime(tzOffset, nowMs) {
  if (typeof tzOffset !== 'number') return '--';
  return new Date(nowMs + tzOffset * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

// How far the sun is between sunrise (0) and sunset (1), clamped
export function sunFraction(sunrise, sunset, nowMs) {
  if (!sunrise || !sunset || sunset <= sunrise) return 0;
  const nowSec = nowMs / 1000;
  if (nowSec <= sunrise) return 0;
  if (nowSec >= sunset) return 1;
  return (nowSec - sunrise) / (sunset - sunrise);
}

// In polar day or night sunrise/sunset can be missing or equal, so fall back
// to OpenWeather's own day/night flag: the icon code ends in "d" or "n" (01n).
export function isNightAt(weather, nowMs) {
  if (!weather) return false;
  const { sunrise, sunset, icon } = weather;
  if (Number.isFinite(sunrise) && Number.isFinite(sunset) && sunset > sunrise) {
    const nowSec = nowMs / 1000;
    return nowSec < sunrise || nowSec > sunset;
  }
  return /n@2x\.png$/.test(icon ?? '');
}
