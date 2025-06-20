import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useState } from 'react';

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

function ClickableMarker({ lat, lon, city, condition, temp, onMapClick }) {
  const [position, setPosition] = useState([lat, lon]);
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  // Only show popup if city is present
  return (
    <Marker position={position}>
      {city && (
        <Popup>
          <div className="fw-bold">{city}</div>
          <div>{condition} &bull; {temp ? Math.round(temp) + '°C' : ''}</div>
        </Popup>
      )}
    </Marker>
  );
}

export default function WeatherMap({ lat, lon, city, condition, temp, onMapClick }) {
  // Use default coordinates if none provided
  const defaultLat = 20;
  const defaultLon = 0;
  const mapLat = lat || defaultLat;
  const mapLon = lon || defaultLon;
  return (
    <div className="card mt-4 shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-white fw-semibold text-primary">Location Map</div>
      <div style={{ height: 320, width: '100%' }}>
        <MapContainer center={[mapLat, mapLon]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickableMarker lat={mapLat} lon={mapLon} city={city} condition={condition} temp={temp} onMapClick={onMapClick} />
        </MapContainer>
      </div>
    </div>
  );
} 