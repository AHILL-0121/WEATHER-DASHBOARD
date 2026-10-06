import React, { useState } from 'react';
import { particles } from './particles';

export default function NightStars() {
  const [stars] = useState(() =>
    particles(80, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${1 + Math.random() * 2.2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${2 + Math.random() * 3}s`,
      opacity: 0.4 + Math.random() * 0.5,
    })),
  );
  return (
    <div className="stars-container">
      {stars.map((s, i) => (
        <div
          key={i}
          className="night-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--star-op': s.opacity, // read by the starTwinkle keyframes
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
