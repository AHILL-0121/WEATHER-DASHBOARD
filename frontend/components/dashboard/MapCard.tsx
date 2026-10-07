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

// Wheel delta that counts as one zoom level. A mouse notch is about 100; a
// trackpad pinch sends many small deltas, so they're added up.
const WHEEL_PER_ZOOM = 60;
const HINT_MS = 1500;

// Safari reports trackpad pinches as its own gesture events, not ctrl+wheel
type GestureEvent = Event & { scale: number; clientX: number; clientY: number };

// Map zoom from a pinch or Ctrl/⌘ + scroll, without trapping page scrolling.
// Plain scroll wheels are left to the page (scrollWheelZoom is off), but a
// trackpad pinch arrives as ctrl+wheel: unhandled, the browser zooms the whole
// page instead (UX-03). A plain scroll over the map shows a short hint.
function GestureZoom() {
  const map = useMap();
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const el = map.getContainer();
    let total = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    let gestureStart = map.getZoom();

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          setHint(true);
          clearTimeout(hintTimer);
          hintTimer = setTimeout(() => setHint(false), HINT_MS);
        }
        return; // the page scrolls as usual
      }
      e.preventDefault(); // stop the browser zooming the page
      setHint(false);
      total += e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 33 : e.deltaY;
      clearTimeout(idle);
      idle = setTimeout(() => (total = 0), 250);
      const steps = Math.trunc(total / WHEEL_PER_ZOOM);
      if (!steps) return;
      total -= steps * WHEEL_PER_ZOOM;
      map.setZoomAround(map.mouseEventToContainerPoint(e), map.getZoom() - steps);
    };

    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureStart = map.getZoom();
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as GestureEvent;
      const zoom = Math.round(gestureStart + Math.log2(g.scale));
      if (zoom !== map.getZoom()) {
        map.setZoomAround(map.mouseEventToContainerPoint(g as unknown as MouseEvent), zoom);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart);
    el.addEventListener('gesturechange', onGestureChange);
    return () => {
      clearTimeout(idle);
      clearTimeout(hintTimer);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
    };
  }, [map]);

  return (
    <p
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[450] m-0 grid place-items-center bg-[rgb(8_12_20/0.45)] text-sm font-medium text-white transition-opacity duration-150 ${hint ? 'opacity-100' : 'opacity-0'}`}
    >
      Pinch, or hold Ctrl and scroll, to zoom the map
    </p>
  );
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
      <GestureZoom />
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
