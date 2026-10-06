import React, { useState } from 'react';
import { particles } from './particles';
import RainDrops from './RainDrops';

export default function RainScene() {
  const [drops] = useState(() =>
    particles(45, () => ({
      left: `${Math.random() * 100}%`,
      height: `${22 + Math.random() * 45}px`,
      delay: `${Math.random() * 2.5}s`,
      duration: `${0.5 + Math.random() * 0.6}s`,
      opacity: 0.35 + Math.random() * 0.35,
    })),
  );
  return (
    <>
      <div className="weather-svg-scene">
        <svg
          width="100%"
          height="200"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMin slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g style={{ animation: 'cloudDrift1 20s ease-in-out infinite' }}>
            <ellipse cx="260" cy="55" rx="140" ry="52" fill="rgba(147,197,253,0.45)" />
            <ellipse cx="200" cy="78" rx="100" ry="44" fill="rgba(147,197,253,0.45)" />
            <ellipse cx="330" cy="80" rx="95" ry="42" fill="rgba(147,197,253,0.45)" />
          </g>
          <g style={{ animation: 'cloudDrift2 16s ease-in-out infinite' }}>
            <ellipse cx="600" cy="50" rx="120" ry="48" fill="rgba(96,165,250,0.38)" />
            <ellipse cx="555" cy="70" rx="95" ry="40" fill="rgba(96,165,250,0.38)" />
            <ellipse cx="650" cy="72" rx="88" ry="38" fill="rgba(96,165,250,0.38)" />
          </g>
        </svg>
      </div>
      <RainDrops drops={drops} />
    </>
  );
}
