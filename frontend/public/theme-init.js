// Applies the saved theme before first paint so a dark-theme choice doesn't
// flash light. A file rather than an inline script, so the CSP can stay
// script-src 'self'. Mirrors useTheme in hooks/usePrefs.ts.
try {
  var t = JSON.parse(localStorage.getItem('wd:theme'));
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch {
  /* storage unavailable: follow the system theme */
}
