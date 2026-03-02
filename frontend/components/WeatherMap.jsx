import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useState, useEffect } from 'react';

// Light CartoDB tiles to match the light theme
const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Fix default marker icon issue in Leaflet + Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom glowing marker
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

// Keeps map centered on the selected location without zooming in
function MapController({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 3, { animate: true, duration: 1.2 });
    }
  }, [lat, lon, map]);
  return null;
}

function ClickableMarker({ lat, lon, city, condition, temp, onMapClick }) {
  const [position, setPosition] = useState([lat, lon]);
  const map = useMap();

  // Sync marker when search result changes
  useEffect(() => {
    setPosition([lat, lon]);
  }, [lat, lon]);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.setView([e.latlng.lat, e.latlng.lng], 3, { animate: true, duration: 1.2 });
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker position={position} icon={glowIcon}>
      {city && (
        <Popup>
          <div style={{ fontWeight:700, color:'#1e293b' }}>{city}</div>
          <div style={{ fontSize:'0.85rem', color:'#475569' }}>
            {condition}{temp ? ` • ${Math.round(temp)}°C` : ''}
          </div>
        </Popup>
      )}
    </Marker>
  );
}

export default function WeatherMap({ lat, lon, city, condition, temp, onMapClick }) {
  const mapLat = lat || 20;
  const mapLon = lon || 0;
  return (
    <div className="glass-panel map-panel">
      <div className="map-header">
        <i className="fas fa-map-location-dot" style={{ color:'var(--accent)', fontSize:'1rem' }} />
        <span className="map-title">Location Map</span>
        <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'var(--text-muted)' }}>Click anywhere to get weather</span>
      </div>
      <div className="map-body">
        <MapContainer
          center={[mapLat, mapLon]}
          zoom={3}
          minZoom={2}
          style={{ height:'100%', width:'100%' }}
          zoomControl={false}
        >
          <TileLayer attribution={DARK_ATTR} url={DARK_TILE} />
          <MapController lat={mapLat} lon={mapLon} />
          <ClickableMarker
            lat={mapLat} lon={mapLon}
            city={city} condition={condition} temp={temp}
            onMapClick={onMapClick}
          />
        </MapContainer>
      </div>
    </div>
  );
}