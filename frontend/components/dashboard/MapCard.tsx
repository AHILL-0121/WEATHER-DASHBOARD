import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';

// Keyless CARTO tiles until the MapTiler switch (UX-11)
const TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
      {/* key: swap the layer outright when the theme changes */}
      <TileLayer key={theme} url={TILES[theme]} attribution={ATTRIBUTION} maxZoom={18} />
      <Controller lat={lat} lon={lon} onPick={onPick} />
    </MapContainer>
  );
}
