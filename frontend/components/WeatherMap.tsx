import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import React, { useState, useEffect } from 'react';
import type { LatLngTuple } from 'leaflet';

interface MarkerProps {
  lat: number;
  lon: number;
  city: string;
  condition: string;
  temp: number | null;
  onMapClick?: (lat: number, lon: number) => void;
}

// Light CartoDB tiles to match the light theme
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Custom glowing marker (the only marker used, so Leaflet's default icon isn't configured)
const glowIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:radial-gradient(circle,#60a5fa 40%,rgba(96,165,250,0) 80%);
    border-radius:50%;
    box-shadow:0 0 12px 4px rgba(96,165,250,0.7);
    border:2px solid rgba(255,255,255,0.6);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Keeps the map centred on the selected location at the user's current zoom
function MapController({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.setView([lat, lon], map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [lat, lon, map]);
  return null;
}

function ClickableMarker({ lat, lon, city, condition, temp, onMapClick }: MarkerProps) {
  const [position, setPosition] = useState<LatLngTuple>([lat, lon]);
  const [shown, setShown] = useState<LatLngTuple>([lat, lon]);
  const map = useMap();

  // Move the marker when a new result arrives (adjusting state during render,
  // React's recommended alternative to syncing props in an effect)
  if (shown[0] !== lat || shown[1] !== lon) {
    setShown([lat, lon]);
    setPosition([lat, lon]);
  }

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.setView([e.latlng.lat, e.latlng.lng], map.getZoom(), { animate: true, duration: 1.2 });
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker position={position} icon={glowIcon}>
      {city && (
        <Popup>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{city}</div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            {condition}
            {temp ? ` • ${Math.round(temp)}°C` : ''}
          </div>
        </Popup>
      )}
    </Marker>
  );
}

export default function WeatherMap({ lat, lon, city, condition, temp, onMapClick }: MarkerProps) {
  const mapLat = Number.isFinite(lat) ? lat : 20;
  const mapLon = Number.isFinite(lon) ? lon : 0;
  return (
    <div className="glass-panel map-panel">
      <div className="map-header">
        <i className="fas fa-map-location-dot" style={{ color: 'var(--accent)', fontSize: '1rem' }} />
        <span className="map-title">Location Map</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Click anywhere to get weather
        </span>
      </div>
      <div className="map-body">
        <MapContainer
          center={[mapLat, mapLon]}
          zoom={3}
          minZoom={2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer attribution={DARK_ATTR} url={DARK_TILE} />
          <MapController lat={mapLat} lon={mapLon} />
          <ClickableMarker
            lat={mapLat}
            lon={mapLon}
            city={city}
            condition={condition}
            temp={temp}
            onMapClick={onMapClick}
          />
        </MapContainer>
      </div>
    </div>
  );
}
