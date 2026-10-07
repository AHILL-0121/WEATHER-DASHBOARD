import '../styles/tailwind.css';
import 'leaflet/dist/leaflet.css';
import type { AppProps } from 'next/app';
import { plexMono, plexSans } from '../lib/fonts';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* On :root so portals (the search dialog) get the fonts too */}
      <style jsx global>{`
        :root {
          --font-plex-sans: ${plexSans.style.fontFamily};
          --font-plex-mono: ${plexMono.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
