import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import WeatherForm from '../components/WeatherForm';
import WeatherDisplay from '../components/WeatherDisplay';
import Link from 'next/link';
// Dynamically import WeatherMap with SSR disabled
const WeatherMap = dynamic(() => import('../components/WeatherMap'), { ssr: false });

function getBackgroundGradient(condition) {
  if (!condition) return 'bg-gradient-clouds';
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return 'bg-gradient-clear';
  if (c.includes('cloud')) return 'bg-gradient-clouds';
  if (c.includes('rain')) return 'bg-gradient-rain';
  if (c.includes('drizzle')) return 'bg-gradient-drizzle';
  if (c.includes('snow')) return 'bg-gradient-snow';
  if (c.includes('thunder')) return 'bg-gradient-thunderstorm';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'bg-gradient-mist';
  return 'bg-gradient-clouds';
}

export default function Home() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState('');

  const fetchWeather = async ({ city, lat, lon }) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      let url = '/api/weather?';
      if (lat && lon) {
        url += `lat=${lat}&lon=${lon}`;
      } else if (city) {
        url += `city=${encodeURIComponent(city)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('City not found or API error');
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/weather?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Location not found or API error');
      const data = await res.json();
      setWeather(data);
      // Reverse geocode to get city name
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`);
      const geoData = await geoRes.json();
      if (geoData && geoData[0] && geoData[0].name) {
        let cityStr = geoData[0].name;
        if (geoData[0].state) cityStr += ', ' + geoData[0].state;
        if (geoData[0].country) cityStr += ', ' + geoData[0].country;
        setInputValue(cityStr);
      } else {
        setInputValue(`${lat.toFixed(4)},${lon.toFixed(4)}`);
      }
    } catch (err) {
      setError(err.message);
      setInputValue(`${lat.toFixed(4)},${lon.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  // Default map center if no weather loaded
  const defaultLat = 20;
  const defaultLon = 0;
  const mapLat = weather && weather.lat ? weather.lat : defaultLat;
  const mapLon = weather && weather.lon ? weather.lon : defaultLon;
  const mapCity = weather && weather.city ? weather.city : '';
  const mapCondition = weather && weather.condition ? weather.condition : '';
  const mapTemp = weather && weather.temp ? weather.temp : '';

  const bgClass = getBackgroundGradient(weather?.condition);

  return (
    <div className={`min-vh-100 position-relative ${bgClass}`}
      style={{ transition: 'background 1s' }}>
      {/* Animated blurred background shapes */}
      <div className="position-absolute top-0 start-0 w-25 h-25 bg-white opacity-10 rounded-circle" style={{zIndex:0, filter:'blur(15px)'}}></div>
      <div className="position-absolute top-50 end-0 w-25 h-25 bg-white opacity-10 rounded-circle" style={{zIndex:0, filter:'blur(15px)'}}></div>
      <div className="position-absolute bottom-0 start-50 w-25 h-25 bg-white opacity-10 rounded-circle" style={{zIndex:0, filter:'blur(20px)'}}></div>
      {/* Adaptive infographics */}
      {bgClass === 'bg-gradient-clear' && (
        <svg className="weather-sun" width="120" height="120" style={{position:'absolute',top:40,left:40,zIndex:0}} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="32" fill="#ffe066" filter="url(#sunGlow)" />
          <g stroke="#ffe066" strokeWidth="6">
            <line x1="60" y1="10" x2="60" y2="0" />
            <line x1="60" y1="110" x2="60" y2="120" />
            <line x1="10" y1="60" x2="0" y2="60" />
            <line x1="110" y1="60" x2="120" y2="60" />
            <line x1="25" y1="25" x2="15" y2="15" />
            <line x1="95" y1="25" x2="105" y2="15" />
            <line x1="25" y1="95" x2="15" y2="105" />
            <line x1="95" y1="95" x2="105" y2="105" />
          </g>
          <defs>
            <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}
      {bgClass === 'bg-gradient-clouds' && (
        <svg className="weather-clouds" width="180" height="80" style={{position:'absolute',top:60,right:60,zIndex:0}} viewBox="0 0 180 80">
          <ellipse cx="60" cy="60" rx="60" ry="30" fill="#fff" opacity="0.7" />
          <ellipse cx="120" cy="50" rx="40" ry="20" fill="#e0e7ff" opacity="0.7" />
          <ellipse cx="90" cy="70" rx="30" ry="15" fill="#bcd0ee" opacity="0.6" />
        </svg>
      )}
      {bgClass === 'bg-gradient-rain' && (
        <>
          <svg className="weather-clouds" width="120" height="60" style={{position:'absolute',top:40,right:40,zIndex:0}} viewBox="0 0 120 60">
            <ellipse cx="60" cy="40" rx="50" ry="22" fill="#bcd0ee" opacity="0.7" />
            <ellipse cx="80" cy="30" rx="30" ry="14" fill="#e0e7ff" opacity="0.7" />
            <ellipse cx="40" cy="50" rx="20" ry="10" fill="#fff" opacity="0.6" />
          </svg>
          {/* Animated raindrops */}
          {[...Array(16)].map((_, i) => (
            <svg
              key={i}
              className="weather-raindrop"
              width="12" height="32"
              style={{
                position: 'absolute',
                left: `${5 + i * 6}%`,
                top: 0,
                zIndex: 0,
                animationDelay: `${(i % 8) * 0.4}s`
              }}
              viewBox="0 0 12 32"
            >
              <ellipse cx="6" cy="16" rx="4" ry="10" fill="#4f8cff" opacity="0.5" />
            </svg>
          ))}
        </>
      )}
      <div className="weather-anim-bg position-absolute w-100 h-100 top-0 start-0" />
      <div className="container py-5" style={{ zIndex: 1, position: 'relative' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg rounded-4 p-4 border-0 bg-white bg-opacity-75 mb-4">
              <header className="d-flex align-items-center justify-content-center mb-4 gap-2">
                <img src="/weather-hero.svg" alt="Weather" width={56} height={56} style={{ marginRight: 16 }} />
                <a href="/" style={{ textDecoration: 'none' }}>
                  <h1 className="fw-bold text-primary mb-0" style={{ fontSize: '2.2rem', letterSpacing: 1 }}>Weather Dashboard</h1>
                </a>
              </header>
              <WeatherForm onSearch={fetchWeather} loading={loading} inputValue={inputValue} setInputValue={setInputValue} />
              {error && <div className="alert alert-danger text-center fw-semibold py-2 mb-3">{error}</div>}
              <WeatherDisplay weather={weather} loading={loading} />
            </div>
            <WeatherMap
              lat={mapLat}
              lon={mapLon}
              city={mapCity}
              condition={mapCondition}
              temp={mapTemp}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
      <style jsx global>{`
        .bg-gradient-clear {
          background: linear-gradient(120deg, #ffe066 0%, #f7faff 100%) !important;
        }
        .bg-gradient-clouds {
          background: linear-gradient(120deg, #bcd0ee 0%, #e0e7ff 100%) !important;
        }
        .bg-gradient-rain {
          background: linear-gradient(120deg, #4f8cff 0%, #bcd0ee 100%) !important;
        }
        .bg-gradient-drizzle {
          background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%) !important;
        }
        .bg-gradient-snow {
          background: linear-gradient(120deg, #e0e7ff 0%, #fff 100%) !important;
        }
        .bg-gradient-thunderstorm {
          background: linear-gradient(120deg, #4f8cff 0%, #22223b 100%) !important;
        }
        .bg-gradient-mist, .bg-gradient-fog {
          background: linear-gradient(120deg, #bcd0ee 0%, #e0e7ff 100%) !important;
        }
        .weather-sun {
          animation: sun-move 8s linear infinite alternate;
        }
        @keyframes sun-move {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -10px) scale(1.05); }
          50% { transform: translate(40px, 10px) scale(1.1); }
          75% { transform: translate(20px, 20px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .weather-clouds {
          animation: clouds-move 12s ease-in-out infinite alternate;
        }
        @keyframes clouds-move {
          0% { transform: translateX(0); }
          50% { transform: translateX(-40px); }
          100% { transform: translateX(0); }
        }
        .weather-raindrop {
          animation: raindrop-fall 2.2s linear infinite;
        }
        @keyframes raindrop-fall {
          0% { opacity: 0; transform: translateY(-40px) scaleY(0.7); }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; transform: translateY(340px) scaleY(1.1); }
        }
      `}</style>
      {/* Developer Credits Footer */}
      <footer className="dev-footer w-100 d-flex flex-column align-items-center justify-content-center py-3 mt-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="fw-bold text-primary" style={{fontSize:'1.1rem', letterSpacing:1}}>Secured & Crafted by AHILL <span style={{color:'#ffe066'}}>🛡️</span></span>
        </div>
        <div className="d-flex align-items-center gap-4">
          <a href="https://sa-portfolio1.vercel.app/" target="_blank" rel="noopener noreferrer" title="Portfolio" className="footer-icon-link">
            {/* Cybersecurity shield icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2l7 4v5c0 5.25-3.5 10-7 11-3.5-1-7-5.75-7-11V6l7-4z" fill="#4f8cff" stroke="#22223b" strokeWidth="1.5"/><path d="M12 11v3" stroke="#ffe066" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="9" r="1" fill="#ffe066"/></svg>
          </a>
          <a href="https://github.com/AHILL-0121" target="_blank" rel="noopener noreferrer" title="GitHub" className="footer-icon-link">
            {/* Official GitHub logo */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.338 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .268.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2Z" fill="#22223b"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/ahill-selvaraj" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="footer-icon-link">
            {/* Official LinkedIn logo */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path d="M7.5 9.5h2v7h-2v-7zm1-2.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zM10.5 9.5h1.9v1.01h.03c.26-.49.89-1.01 1.82-1.01 1.95 0 2.3 1.28 2.3 2.95v3.05h-2v-2.7c0-.64-.01-1.47-.9-1.47-.9 0-1.04.7-1.04 1.42v2.75h-2v-7z" fill="#fff"/></svg>
          </a>
        </div>
      </footer>
      <style jsx>{`
        .dev-footer {
          background: rgba(255,255,255,0.7);
          border-top: 1.5px solid #e0e7ff;
          box-shadow: 0 -2px 16px rgba(79,140,255,0.08);
          position: relative;
        }
        .footer-icon-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f7faff;
          box-shadow: 0 2px 8px rgba(79,140,255,0.10);
          transition: background 0.2s, transform 0.15s;
          width: 44px;
          height: 44px;
        }
        .footer-icon-link:hover {
          background: #e0e7ff;
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
} 