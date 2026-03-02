import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import WeatherForm from '../components/WeatherForm';
import WeatherDisplay from '../components/WeatherDisplay';

const WeatherMap = dynamic(() => import('../components/WeatherMap'), { ssr: false });

/* -- condition -> scene name -- */
function getScene(condition) {
  if (!condition) return 'default';
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun'))              return 'clear';
  if (c.includes('thunderstorm') || c.includes('thunder'))   return 'thunderstorm';
  if (c.includes('snow') || c.includes('sleet'))             return 'snow';
  if (c.includes('rain'))                                    return 'rain';
  if (c.includes('drizzle'))                                 return 'drizzle';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'mist';
  if (c.includes('cloud'))                                   return 'clouds';
  return 'default';
}

/* -- Night helpers -- */
function NightStars() {
  const stars = useMemo(() => Array.from({ length: 80 }, () => ({
    top:      `${Math.random() * 100}%`,
    left:     `${Math.random() * 100}%`,
    size:     `${1 + Math.random() * 2.2}px`,
    delay:    `${Math.random() * 5}s`,
    duration: `${2 + Math.random() * 3}s`,
    opacity:  0.4 + Math.random() * 0.5,
  })), []);
  return (
    <div className="stars-container">
      {stars.map((s, i) => (
        <div key={i} className="night-star" style={{
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          opacity: s.opacity,
          animationDelay: s.delay,
          animationDuration: s.duration,
        }} />
      ))}
    </div>
  );
}

function MoonScene() {
  return (
    <div className="weather-svg-scene">
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg">
        {/* Moon glow halo */}
        <circle cx="160" cy="130" r="130" fill="rgba(148,163,184,0.10)" />
        <circle cx="160" cy="130" r="90"  fill="rgba(186,230,253,0.10)" />
        {/* Moon crescent */}
        <circle cx="160" cy="130" r="58" fill="rgba(226,232,240,0.75)"
          style={{ filter:'drop-shadow(0 0 18px rgba(186,230,253,0.5))' }} />
        <circle cx="186" cy="112" r="48" fill="rgba(15,23,42,0.88)" />
        {/* Stars near moon */}
        <circle cx="290" cy="60"  r="2" fill="rgba(255,255,255,0.70)" />
        <circle cx="320" cy="85"  r="1.2" fill="rgba(255,255,255,0.55)" />
        <circle cx="250" cy="90"  r="1.5" fill="rgba(255,255,255,0.60)" />
        <circle cx="340" cy="45"  r="1"   fill="rgba(255,255,255,0.50)" />
        <circle cx="100" cy="55"  r="1.5" fill="rgba(255,255,255,0.55)" />
        <circle cx="75"  cy="95"  r="1"   fill="rgba(255,255,255,0.40)" />
        {/* Distant cloud wisps */}
        <g style={{ opacity:0.35, animation:'cloudDrift2 25s ease-in-out infinite' }}>
          <ellipse cx="580" cy="80" rx="90" ry="28" fill="rgba(148,163,184,0.40)" />
          <ellipse cx="545" cy="95" rx="65" ry="22" fill="rgba(148,163,184,0.40)" />
          <ellipse cx="624" cy="97" rx="58" ry="20" fill="rgba(148,163,184,0.40)" />
        </g>
      </svg>
    </div>
  );
}

/* -- SVG animated weather scenes -- */

function SunScene() {
  const rays = [0,30,60,90,120,150,180,210,240,270,300,330];
  return (
    <div className="weather-svg-scene">
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg">
        <circle cx="160" cy="130" r="160" fill="rgba(253,230,138,0.20)" />
        <g style={{ transformOrigin:'160px 130px', animation:'sunRotate 14s linear infinite' }}>
          {rays.map(a => {
            const rad = a * Math.PI / 180;
            return (
              <line key={a}
                x1={160 + 85 * Math.cos(rad)} y1={130 + 85 * Math.sin(rad)}
                x2={160 + 130 * Math.cos(rad)} y2={130 + 130 * Math.sin(rad)}
                stroke="rgba(251,191,36,0.55)" strokeWidth={a % 60 === 0 ? 4 : 2} strokeLinecap="round" />
            );
          })}
        </g>
        <circle cx="160" cy="130" r="62" fill="rgba(252,211,77,0.78)"
          style={{ animation:'sunGlowPulse 4s ease-in-out infinite' }} />
        <circle cx="160" cy="130" r="52" fill="rgba(253,230,138,0.55)" />
        <g style={{ animation:'cloudDrift2 18s ease-in-out infinite' }}>
          <ellipse cx="580" cy="90" rx="85" ry="38" fill="rgba(255,255,255,0.52)" />
          <ellipse cx="540" cy="108" rx="60" ry="30" fill="rgba(255,255,255,0.52)" />
          <ellipse cx="620" cy="110" rx="55" ry="28" fill="rgba(255,255,255,0.52)" />
        </g>
      </svg>
    </div>
  );
}

function CloudScene() {
  return (
    <div className="weather-svg-scene">
      <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg">
        <g style={{ animation:'cloudDrift1 22s ease-in-out infinite' }}>
          <ellipse cx="280" cy="110" rx="160" ry="62" fill="rgba(255,255,255,0.50)" />
          <ellipse cx="210" cy="136" rx="110" ry="52" fill="rgba(255,255,255,0.50)" />
          <ellipse cx="360" cy="140" rx="100" ry="48" fill="rgba(255,255,255,0.50)" />
        </g>
        <g style={{ animation:'cloudDrift2 17s ease-in-out infinite' }}>
          <ellipse cx="600" cy="80" rx="100" ry="44" fill="rgba(226,232,240,0.52)" />
          <ellipse cx="560" cy="100" rx="80" ry="38" fill="rgba(226,232,240,0.52)" />
          <ellipse cx="650" cy="102" rx="75" ry="36" fill="rgba(226,232,240,0.52)" />
        </g>
        <g style={{ animation:'cloudDrift3 26s ease-in-out infinite' }}>
          <ellipse cx="120" cy="220" rx="70" ry="28" fill="rgba(248,250,252,0.42)" />
          <ellipse cx="95"  cy="235" rx="50" ry="22" fill="rgba(248,250,252,0.42)" />
          <ellipse cx="155" cy="238" rx="48" ry="22" fill="rgba(248,250,252,0.42)" />
        </g>
      </svg>
    </div>
  );
}

function RainScene() {
  const drops = useMemo(() => Array.from({ length: 45 }, () => ({
    left:     `${Math.random() * 100}%`,
    height:   `${22 + Math.random() * 45}px`,
    delay:    `${Math.random() * 2.5}s`,
    duration: `${0.5 + Math.random() * 0.6}s`,
    opacity:  0.35 + Math.random() * 0.35,
  })), []);
  return (
    <>
      <div className="weather-svg-scene">
        <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg">
          <g style={{ animation:'cloudDrift1 20s ease-in-out infinite' }}>
            <ellipse cx="260" cy="55" rx="140" ry="52" fill="rgba(147,197,253,0.45)" />
            <ellipse cx="200" cy="78" rx="100" ry="44" fill="rgba(147,197,253,0.45)" />
            <ellipse cx="330" cy="80" rx="95"  ry="42" fill="rgba(147,197,253,0.45)" />
          </g>
          <g style={{ animation:'cloudDrift2 16s ease-in-out infinite' }}>
            <ellipse cx="600" cy="50" rx="120" ry="48" fill="rgba(96,165,250,0.38)" />
            <ellipse cx="555" cy="70" rx="95"  ry="40" fill="rgba(96,165,250,0.38)" />
            <ellipse cx="650" cy="72" rx="88"  ry="38" fill="rgba(96,165,250,0.38)" />
          </g>
        </svg>
      </div>
      <div className="rain-container">
        {drops.map((d, i) => (
          <div key={i} className="rain-drop" style={{
            left: d.left, height: d.height,
            animationDelay: d.delay, animationDuration: d.duration, opacity: d.opacity,
          }} />
        ))}
      </div>
    </>
  );
}

function SnowScene() {
  const flakes = useMemo(() => Array.from({ length: 34 }, () => ({
    left:     `${Math.random() * 100}%`,
    size:     `${4 + Math.random() * 6}px`,
    delay:    `${Math.random() * 7}s`,
    duration: `${5.5 + Math.random() * 6}s`,
  })), []);
  return (
    <>
      <div className="weather-svg-scene">
        <svg width="100%" height="160" viewBox="0 0 800 160" preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg">
          <g style={{ animation:'cloudDrift3 24s ease-in-out infinite' }}>
            <ellipse cx="300" cy="60" rx="150" ry="54" fill="rgba(186,230,253,0.45)" />
            <ellipse cx="235" cy="84" rx="105" ry="44" fill="rgba(186,230,253,0.45)" />
            <ellipse cx="370" cy="86" rx="100" ry="42" fill="rgba(186,230,253,0.45)" />
          </g>
        </svg>
      </div>
      <div className="snow-container">
        {flakes.map((f, i) => (
          <div key={i} className="snowflake" style={{
            left: f.left, width: f.size, height: f.size,
            animationDelay: f.delay, animationDuration: f.duration,
            background: 'rgba(186,230,253,0.95)',
          }} />
        ))}
      </div>
    </>
  );
}

function ThunderstormScene() {
  const drops = useMemo(() => Array.from({ length: 50 }, () => ({
    left:     `${Math.random() * 100}%`,
    height:   `${20 + Math.random() * 40}px`,
    delay:    `${Math.random() * 2}s`,
    duration: `${0.45 + Math.random() * 0.55}s`,
    opacity:  0.4 + Math.random() * 0.35,
  })), []);
  return (
    <>
      <div className="weather-svg-scene">
        <svg width="100%" height="220" viewBox="0 0 800 220" preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg">
          <g style={{ animation:'cloudBob 6s ease-in-out infinite' }}>
            <ellipse cx="300" cy="70"  rx="170" ry="62" fill="rgba(167,139,250,0.42)" />
            <ellipse cx="228" cy="96"  rx="120" ry="52" fill="rgba(167,139,250,0.42)" />
            <ellipse cx="380" cy="98"  rx="115" ry="50" fill="rgba(167,139,250,0.42)" />
          </g>
          <g style={{ transformOrigin:'310px 100px', animation:'boltFlash 5s ease-in-out infinite',
            filter:'drop-shadow(0 0 10px #fbbf24)' }}>
            <polygon points="318,108 304,148 316,148 300,190 330,145 316,145 332,108"
              fill="#fbbf24" opacity="0.92" />
          </g>
          <g style={{ animation:'cloudDrift2 19s ease-in-out infinite' }}>
            <ellipse cx="620" cy="55" rx="100" ry="38" fill="rgba(196,181,253,0.35)" />
            <ellipse cx="578" cy="72" rx="78"  ry="32" fill="rgba(196,181,253,0.35)" />
            <ellipse cx="665" cy="74" rx="72"  ry="30" fill="rgba(196,181,253,0.35)" />
          </g>
        </svg>
      </div>
      <div className="rain-container">
        {drops.map((d, i) => (
          <div key={i} className="rain-drop" style={{
            left: d.left, height: d.height,
            animationDelay: d.delay, animationDuration: d.duration, opacity: d.opacity,
          }} />
        ))}
      </div>
      <div className="lightning" />
    </>
  );
}

function MistScene() {
  return (
    <div className="mist-container">
      {[
        { h:'55%', top:'12%', dur:'9s',  del:'0s'   },
        { h:'40%', top:'35%', dur:'12s', del:'2.5s' },
        { h:'35%', top:'58%', dur:'8s',  del:'1s'   },
      ].map((m, i) => (
        <div key={i} className="mist-layer" style={{
          height: m.h, top: m.top,
          animationDuration: m.dur, animationDelay: m.del,
          opacity: 0.5 - i * 0.08,
        }} />
      ))}
    </div>
  );
}

/* -- SVG scene selector -- */
function SceneFX({ scene, isNight }) {
  if (isNight) {
    switch (scene) {
      case 'clear':        return <MoonScene />;
      case 'rain':
      case 'drizzle':      return <RainScene />;
      case 'snow':         return <SnowScene />;
      case 'thunderstorm': return <ThunderstormScene />;
      case 'mist':         return <MistScene />;
      default:             return null;  /* stars handled separately */
    }
  }
  switch (scene) {
    case 'clear':        return <SunScene />;
    case 'clouds':       return <CloudScene />;
    case 'rain':
    case 'drizzle':      return <RainScene />;
    case 'snow':         return <SnowScene />;
    case 'thunderstorm': return <ThunderstormScene />;
    case 'mist':         return <MistScene />;
    default:             return <CloudScene />;
  }
}

/* -- Main page -- */
export default function Home() {
  const [weather,    setWeather]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [inputValue, setInputValue] = useState('');

  const scene = getScene(weather?.condition);

  // Determine night/day using the location's sunrise/sunset (UTC unix timestamps)
  const isNight = useMemo(() => {
    if (!weather?.sunrise || !weather?.sunset) return false;
    const nowUtc = Math.floor(Date.now() / 1000);
    return nowUtc < weather.sunrise || nowUtc > weather.sunset;
  }, [weather?.sunrise, weather?.sunset]);

  // Apply night + scene classes to <body> so CSS vars cascade to all children
  const ALL_SCENES = ['clear','clouds','rain','drizzle','snow','thunderstorm','mist','default'];
  useEffect(() => {
    document.body.classList.toggle('night', isNight);
    ALL_SCENES.forEach(s => document.body.classList.remove(`scene-${s}`));
    document.body.classList.add(`scene-${scene}`);
    return () => {
      document.body.classList.remove('night');
      ALL_SCENES.forEach(s => document.body.classList.remove(`scene-${s}`));
    };
  }, [isNight, scene]);

  const fetchWeather = async ({ city, lat, lon }) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      let url = '/api/weather?';
      url += (lat && lon) ? `lat=${lat}&lon=${lon}` : `city=${encodeURIComponent(city)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('City not found or API error');
      setWeather(await res.json());
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
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error('Location not found or API error');
      const data = await res.json();
      setWeather(data);
      try {
        const gr = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );
        const gd = await gr.json();
        if (gd?.[0]?.name) {
          setInputValue([gd[0].name, gd[0].state, gd[0].country].filter(Boolean).join(', '));
        } else setInputValue(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } catch { setInputValue(`${lat.toFixed(4)}, ${lon.toFixed(4)}`); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapLat = weather?.lat  ?? 20;
  const mapLon = weather?.lon  ?? 0;

  return (
    <>
      {/* Background scene */}
      <div className={`scene scene-${scene}`} />
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      {isNight && <NightStars />}
      <SceneFX scene={scene} isNight={isNight} />

      {/* Dashboard */}
      <div className="app-wrapper">
        <div className="dashboard-container">

          {/* Header */}
          <header className="glass-panel dash-header">
            <div className="dash-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--accent)' }}>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <div>
              <div className="dash-title">Weather Dashboard</div>
              <div className="dash-subtitle">Real-time global weather intelligence</div>
            </div>
          </header>

          {/* Search */}
          <WeatherForm
            onSearch={fetchWeather}
            loading={loading}
            inputValue={inputValue}
            setInputValue={setInputValue}
          />

          {/* Error */}
          {error && (
            <div className="error-banner glass-panel">
              <i className="fas fa-triangle-exclamation" />
              {error}
            </div>
          )}

          {/* Weather data */}
          <WeatherDisplay weather={weather} loading={loading} />

          {/* Map */}
          <WeatherMap
            lat={mapLat} lon={mapLon}
            city={weather?.city ?? ''}
            condition={weather?.condition ?? ''}
            temp={weather?.temp ?? null}
            onMapClick={handleMapClick}
          />

          {/* Footer */}
          <footer className="glass-panel dash-footer">
            <span className="footer-brand">Crafted by AHILL &mdash; All rights reserved</span>
            <div className="footer-links">
              <a href="https://sa-portfolio-psi.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="footer-link" title="Portfolio">
                <i className="fas fa-shield-halved" />
              </a>
              <a href="https://github.com/AHILL-0121" target="_blank" rel="noopener noreferrer"
                className="footer-link" title="GitHub">
                <i className="fab fa-github" />
              </a>
              <a href="https://www.linkedin.com/in/ahill-selvaraj" target="_blank" rel="noopener noreferrer"
                className="footer-link" title="LinkedIn">
                <i className="fab fa-linkedin" />
              </a>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
