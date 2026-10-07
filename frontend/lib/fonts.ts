import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

// Self-hosted at build time by next/font: no request to Google at runtime and
// no layout shift. _app.tsx exposes the family names as --font-plex-sans and
// --font-plex-mono, which styles/tailwind.css maps to font-sans / font-mono.
// preload is off until the redesign uses these fonts; until then nothing on
// the page renders in Plex, so preloading would only waste bandwidth.
export const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  preload: false,
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
});
