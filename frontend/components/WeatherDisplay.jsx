import React, { useEffect, useState } from 'react';

function formatTime(unix, tzOffset = 0) {
  if (!unix) return '--';
  const d = new Date((unix + tzOffset) * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function getLocalTime(tzOffset) {
  if (typeof tzOffset !== 'number') return '--';
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + tzOffset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function safe(val, unit = '') {
  if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) return '--';
  return `${val}${unit}`;
}

function sunFraction(sunrise, sunset, tzOffset) {
  if (!sunrise || !sunset) return 0;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nowSec = utc / 1000 + tzOffset;
  const riseSec = sunrise + tzOffset;
  const setSec  = sunset  + tzOffset;
  if (nowSec <= riseSec) return 0;
  if (nowSec >= setSec)  return 1;
  return (nowSec - riseSec) / (setSec - riseSec);
}

function WindCompass({ deg }) {
  if (deg === undefined || deg === null) return null;
  const cardinals = [
    { label:'N', style:{ top:3,    left:'50%', transform:'translateX(-50%)' } },
    { label:'E', style:{ right:3,  top:'50%',  transform:'translateY(-50%)' } },
    { label:'S', style:{ bottom:3, left:'50%', transform:'translateX(-50%)' } },
    { label:'W', style:{ left:3,   top:'50%',  transform:'translateY(-50%)' } },
  ];
  return (
    <div className="wind-compass">
      <div className="wind-needle" style={{ transform: `rotate(${deg}deg)` }} />
      {cardinals.map(c => (
        <span key={c.label} style={{
          position:'absolute', fontSize:'8px', fontWeight:700,
          color:'var(--text-muted)', ...c.style,
        }}>{c.label}</span>
      ))}
    </div>
  );
}

function SunArc({ sunrise, sunset, tzOffset }) {
  const pct = sunFraction(sunrise, sunset, tzOffset);
  const r = 55, cx = 75, cy = 70;
  const totalLen = Math.PI * r;
  const px = cx + r * Math.cos(Math.PI - pct * Math.PI);
  const py = cy - r * Math.sin(pct * Math.PI);
  const pathD = `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;
  return (
    <div className="sun-arc-wrap">
      <svg width="150" height="75" viewBox="0 0 150 75" className="sun-arc-svg" overflow="visible">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path d={pathD} className="sun-path" />
        <path d={pathD} className="sun-progress" strokeDasharray={totalLen} strokeDashoffset={totalLen * (1 - pct)} />
        <circle cx={px} cy={py} r={5} fill="#fbbf24" className="sun-dot" />
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', width:130, marginTop:4 }}>
        <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
          <i className="fas fa-sun" style={{ marginRight:4, color:'#f59e0b' }} />
          {formatTime(sunrise, tzOffset)}
        </span>
        <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
          {formatTime(sunset, tzOffset)}
          <i className="fas fa-moon" style={{ marginLeft:4, color:'#7c3aed' }} />
        </span>
      </div>
    </div>
  );
}

export default function WeatherDisplay({ weather, loading }) {
  const [localTime, setLocalTime] = useState('--');

  useEffect(() => {
    if (!weather || typeof weather.timezone !== 'number') return;
    const tick = () => setLocalTime(getLocalTime(weather.timezone));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [weather?.timezone]);

  if (loading) {
    return (
      <div className="glass-panel loading-panel">
        <div className="skel" style={{ height:80, marginBottom:16 }} />
        <div className="skel" style={{ height:36, marginBottom:12 }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {Array(6).fill(0).map((_,i) => <div key={i} className="skel" style={{ height:90 }} />)}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const stats = [
    { icon:'fa-temperature-half', label:'Feels Like',  value: safe(Math.round(weather.feels_like),'°C'), delay:0.08 },
    { icon:'fa-arrow-trend-down', label:'Min Temp',    value: safe(Math.round(weather.temp_min),'°C'),    delay:0.16 },
    { icon:'fa-arrow-trend-up',   label:'Max Temp',    value: safe(Math.round(weather.temp_max),'°C'),    delay:0.24 },
    { icon:'fa-droplet',          label:'Humidity',    value: safe(weather.humidity,'%'),                  bar: weather.humidity, delay:0.32 },
    { icon:'fa-gauge-high',       label:'Pressure',    value: safe(weather.pressure,' hPa'),               delay:0.40 },
    { icon:'fa-cloud',            label:'Cloud Cover', value: safe(weather.clouds,'%'),                    bar: weather.clouds,   delay:0.48 },
    { icon:'fa-eye',              label:'Visibility',  value: weather.visibility != null ? safe((weather.visibility/1000).toFixed(1),' km') : '--', delay:0.56 },
    { icon:'fa-wind',             label:'Wind Speed',  value: weather.wind_speed != null ? safe(weather.wind_speed,' m/s') : '--',
      extra: <WindCompass deg={weather.wind_deg} />, delay:0.64 },
    { icon:'fa-sun',              label:'Sunrise / Sunset', value: null, wide: true,
      extra: <SunArc sunrise={weather.sunrise} sunset={weather.sunset} tzOffset={weather.timezone} />, delay:0.72 },
  ];

  return (
    <div className="glass-panel weather-panel">
      {/* Hero row */}
      <div className="hero-row">
        <div>
          <div className="hero-temp">
            {safe(Math.round(weather.temp), '°')}
            <span style={{ fontSize:'2rem', fontWeight:700, letterSpacing:0 }}>C</span>
          </div>
        </div>
        <div className="hero-icon-wrap">
          <div className="hero-icon-halo" />
          <img src={weather.icon} alt={weather.condition} className="hero-icon" width={96} height={96} />
        </div>
      </div>

      <div className="hero-meta">
        <div className="hero-condition">{weather.condition || '--'}</div>
        <div className="hero-location">
          <i className="fas fa-location-dot" style={{ fontSize:'0.8rem' }} />
          {weather.city || '--'}, {weather.country || '--'}
        </div>
        <div className="hero-time">
          <i className="fas fa-clock" style={{ fontSize:'0.8rem' }} />
          Local time &mdash; <strong>{localTime}</strong>
        </div>
      </div>

      <div className="glass-divider" />

      <div className="stats-grid">
        {stats.map(s => (
          <div
            key={s.label}
            className="stat-card"
            style={{ animationDelay:`${s.delay}s`, gridColumn: s.wide ? 'span 2' : undefined }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className="stat-icon-wrap"><i className={`fas ${s.icon}`} /></div>
              <span className="stat-label">{s.label}</span>
            </div>
            {s.value && <div className="stat-value">{s.value}</div>}
            {s.bar != null && (
              <div className="stat-bar-track">
                <div className="stat-bar-fill" style={{ width:`${Math.min(100,s.bar)}%`, animationDelay:`${s.delay}s` }} />
              </div>
            )}
            {s.extra && s.extra}
          </div>
        ))}
      </div>
    </div>
  );
}
