import React, { useState } from 'react';
import { particles } from './particles';

export default function SnowScene() {
  const [flakes] = useState(() =>
    particles(34, () => ({
      left: `${Math.random() * 100}%`,
      size: `${4 + Math.random() * 6}px`,
      delay: `${Math.random() * 7}s`,
      duration: `${5.5 + Math.random() * 6}s`,
    })),
  );
  return (
    <>
      <div className="weather-svg-scene">
        <svg
          width="100%"
          height="160"
          viewBox="0 0 800 160"
          preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g style={{ animation: 'cloudDrift3 24s ease-in-out infinite' }}>
            <ellipse cx="300" cy="60" rx="150" ry="54" fill="rgba(186,230,253,0.45)" />
            <ellipse cx="235" cy="84" rx="105" ry="44" fill="rgba(186,230,253,0.45)" />
            <ellipse cx="370" cy="86" rx="100" ry="42" fill="rgba(186,230,253,0.45)" />
          </g>
        </svg>
      </div>
      <div className="snow-container">
        {flakes.map((f, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: f.left,
              width: f.size,
              height: f.size,
              animationDelay: f.delay,
              animationDuration: f.duration,
              background: 'rgba(186,230,253,0.95)',
            }}
          />
        ))}
      </div>
    </>
  );
}
