import React, { useState } from 'react';
import { particles } from './particles';
import RainDrops from './RainDrops';

export default function ThunderstormScene() {
  const [drops] = useState(() =>
    particles(50, () => ({
      left: `${Math.random() * 100}%`,
      height: `${20 + Math.random() * 40}px`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.45 + Math.random() * 0.55}s`,
      opacity: 0.4 + Math.random() * 0.35,
    })),
  );
  return (
    <>
      <div className="weather-svg-scene">
        <svg
          width="100%"
          height="220"
          viewBox="0 0 800 220"
          preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g style={{ animation: 'cloudBob 6s ease-in-out infinite' }}>
            <ellipse cx="300" cy="70" rx="170" ry="62" fill="rgba(167,139,250,0.42)" />
            <ellipse cx="228" cy="96" rx="120" ry="52" fill="rgba(167,139,250,0.42)" />
            <ellipse cx="380" cy="98" rx="115" ry="50" fill="rgba(167,139,250,0.42)" />
          </g>
          <g
            style={{
              transformOrigin: '310px 100px',
              animation: 'boltFlash 5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 10px #fbbf24)',
            }}
          >
            <polygon
              points="318,108 304,148 316,148 300,190 330,145 316,145 332,108"
              fill="#fbbf24"
              opacity="0.92"
            />
          </g>
          <g style={{ animation: 'cloudDrift2 19s ease-in-out infinite' }}>
            <ellipse cx="620" cy="55" rx="100" ry="38" fill="rgba(196,181,253,0.35)" />
            <ellipse cx="578" cy="72" rx="78" ry="32" fill="rgba(196,181,253,0.35)" />
            <ellipse cx="665" cy="74" rx="72" ry="30" fill="rgba(196,181,253,0.35)" />
          </g>
        </svg>
      </div>
      <RainDrops drops={drops} />
      <div className="lightning" />
    </>
  );
}
