import React, { useEffect, useState } from 'react';

function formatTime(unix, tzOffset = 0) {
  if (!unix) return '--';
  const date = new Date((unix + tzOffset) * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getLocalTime(tzOffset) {
  // tzOffset in seconds
  if (typeof tzOffset !== 'number') return '--';
  const now = new Date();
  // Convert local time to UTC, then add offset
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + tzOffset * 1000);
  return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function safeValue(val, unit = '') {
  if (val === undefined || val === null || isNaN(val)) return '--';
  return `${val}${unit}`;
}

function getWeatherBgClass(condition) {
  if (!condition) return 'weather-bg-default';
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return 'weather-bg-clear';
  if (c.includes('cloud')) return 'weather-bg-clouds';
  if (c.includes('rain') || c.includes('drizzle')) return 'weather-bg-rain';
  if (c.includes('snow')) return 'weather-bg-snow';
  if (c.includes('thunder')) return 'weather-bg-thunderstorm';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'weather-bg-mist';
  return 'weather-bg-default';
}

export default function WeatherDisplay({ weather, loading }) {
  const [localTime, setLocalTime] = useState('--');

  useEffect(() => {
    if (!weather || typeof weather.timezone !== 'number') return;
    const update = () => setLocalTime(getLocalTime(weather.timezone));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [weather?.timezone]);

  if (loading) return null;
  if (!weather) return null;

  const bgClass = getWeatherBgClass(weather.condition);
  const details = [
    { icon: 'fa-thermometer-half', label: 'Feels Like', value: safeValue(Math.round(weather.feels_like), '°C') },
    { icon: 'fa-arrow-down', label: 'Min', value: safeValue(Math.round(weather.temp_min), '°C') },
    { icon: 'fa-arrow-up', label: 'Max', value: safeValue(Math.round(weather.temp_max), '°C') },
    { icon: 'fa-tint', label: 'Humidity', value: safeValue(weather.humidity, '%') },
    { icon: 'fa-tachometer-alt', label: 'Pressure', value: safeValue(weather.pressure, ' hPa') },
    { icon: 'fa-wind', label: 'Wind', value: weather.wind_speed !== undefined ? `${safeValue(weather.wind_speed)} m/s${weather.wind_deg !== undefined ? ` (${safeValue(weather.wind_deg, '°')})` : ''}` : '--' },
    { icon: 'fa-cloud', label: 'Clouds', value: safeValue(weather.clouds, '%') },
    { icon: 'fa-eye', label: 'Visibility', value: weather.visibility !== undefined ? safeValue((weather.visibility / 1000).toFixed(1), ' km') : '--' },
    { icon: 'fa-sun', label: 'Sunrise', value: formatTime(weather.sunrise, weather.timezone) },
    { icon: 'fa-moon', label: 'Sunset', value: formatTime(weather.sunset, weather.timezone) },
  ];

  return (
    <div className={`p-3 mb-4 rounded-4 glass-bg ${bgClass}`}
      style={{
        boxShadow: '0 8px 32px rgba(79,140,255,0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255,255,255,0.18)',
      }}
    >
      <div className="text-center mb-4">
        <div className="d-flex align-items-center justify-content-center mb-2 gap-3">
          <span className="display-3 fw-bold text-primary">{safeValue(Math.round(weather.temp), '°C')}</span>
          <img
            src={weather.icon}
            alt={weather.condition}
            width={72}
            height={72}
            className="ms-2"
            style={{ filter: 'drop-shadow(0 2px 8px #4f8cff44)' }}
          />
        </div>
        <div className="h5 fw-semibold text-primary mb-1">{weather.condition || '--'}</div>
        <div className="text-secondary fs-5">{weather.city || '--'}, {weather.country || '--'}</div>
        <div className="text-secondary fs-6 mt-1">Local Time: <span className="fw-bold">{localTime}</span></div>
      </div>
      <div className="row g-4">
        {details.map((d, i) => (
          <div className="col-12 col-md-4 col-lg-4" key={d.label}>
            <div className="card glass-card h-100 border-0 shadow-sm rounded-4 text-center py-3 px-2 bg-white bg-opacity-50">
              <div className="mb-1">
                <i className={`fas ${d.icon} fa-lg text-primary mb-2`} />
              </div>
              <div className="fw-semibold text-secondary small mb-1">{d.label}</div>
              <div className="fw-bold fs-5 text-dark">{d.value}</div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .glass-bg {
          background: rgba(255,255,255,0.35);
        }
        .glass-card {
          background: rgba(255,255,255,0.55) !important;
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.18);
          box-shadow: 0 4px 24px rgba(79,140,255,0.10);
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .glass-card:hover {
          box-shadow: 0 8px 32px rgba(79,140,255,0.18);
          transform: translateY(-2px) scale(1.03);
        }
        /* Adaptive backgrounds for weather */
        .weather-bg-clear { background: linear-gradient(120deg, #ffe066 0%, #f7faff 100%) !important; }
        .weather-bg-clouds { background: linear-gradient(120deg, #bcd0ee 0%, #e0e7ff 100%) !important; }
        .weather-bg-rain { background: linear-gradient(120deg, #4f8cff 0%, #bcd0ee 100%) !important; }
        .weather-bg-thunderstorm { background: linear-gradient(120deg, #4f8cff 0%, #22223b 100%) !important; }
        .weather-bg-drizzle { background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%) !important; }
        .weather-bg-snow { background: linear-gradient(120deg, #e0e7ff 0%, #fff 100%) !important; }
        .weather-bg-mist, .weather-bg-fog { background: linear-gradient(120deg, #bcd0ee 0%, #e0e7ff 100%) !important; }
      `}</style>
    </div>
  );
} 