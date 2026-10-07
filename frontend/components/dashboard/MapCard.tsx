import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';

// MapTiler's muted "Dataviz" styles (UX-11). The key is public by design: it
// ships to the browser and is locked to our domains in the MapTiler dashboard.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
const STYLE = { light: 'dataviz', dark: 'dataviz-dark' };
// {r} becomes "@2x" on high-density screens
const tileUrl = (theme: 'light' | 'dark') =>
  `https://api.maptiler.com/maps/${STYLE[theme]}/256/{z}/{x}/{y}{r}.png?key=${MAPTILER_KEY}`;
const ATTRIBUTION =
  '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>';

const pin = L.divIcon({
  className: '',
  html: '<div class="map-pin"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface Props {
  lat: number;
  lon: number;
  theme: 'light' | 'dark';
  onPick: (lat: number, lon: number) => void;
}

// Follows the selected place at the user's own zoom, without a fly animation
// (BUG-08). A click moves the pin at once and asks for that spot's weather.
function Controller({ lat, lon, onPick }: Omit<Props, 'theme'>) {
  const map = useMap();
  const [pos, setPos] = useState<LatLngTuple>([lat, lon]);
  const [shown, setShown] = useState<LatLngTuple>([lat, lon]);

  // Adjust state during render when a new place arrives (React's recommended
  // alternative to syncing props in an effect)
  if (shown[0] !== lat || shown[1] !== lon) {
    setShown([lat, lon]);
    setPos([lat, lon]);
  }

  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: false });
  }, [lat, lon, map]);

  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={pos} icon={pin} keyboard={false} />;
}

export default function MapCard({ lat, lon, theme, onPick }: Props) {
  // Read once: Leaflet only takes animation options at creation. Client-only
  // component (loaded with ssr: false), so window is always defined here.
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={4}
      minZoom={2}
      scrollWheelZoom={false}
      worldCopyJump
      fadeAnimation={false}
      zoomAnimation={!reducedMotion}
      markerZoomAnimation={!reducedMotion}
      className="h-[360px] w-full"
    >
      {MAPTILER_KEY ? (
        // key: swap the layer outright when the theme changes
        <TileLayer key={theme} url={tileUrl(theme)} attribution={ATTRIBUTION} maxZoom={18} />
      ) : (
        <p className="absolute inset-x-0 top-3 z-[400] m-0 text-center text-xs text-muted-foreground">
          Map tiles need NEXT_PUBLIC_MAPTILER_KEY. Clicking still loads weather.
        </p>
      )}
      <Controller lat={lat} lon={lon} onPick={onPick} />
      {MAPTILER_KEY && (
        // MapTiler's free plan asks for its logo on the map
        <a
          href="https://www.maptiler.com"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1.5 left-2 z-[400] block"
          // Leaflet listens on the map element itself: without this, clicking
          // the logo would also load the weather under it
          ref={(el) => {
            if (el) L.DomEvent.disableClickPropagation(el);
          }}
        >
          <img src="/maptiler-logo.svg" alt="MapTiler" width={67} height={20} />
        </a>
      )}
    </MapContainer>
  );
}
