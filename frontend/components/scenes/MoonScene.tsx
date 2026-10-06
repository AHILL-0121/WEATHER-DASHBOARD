export default function MoonScene() {
  return (
    <div className="weather-svg-scene">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Moon glow halo */}
        <circle cx="160" cy="130" r="130" fill="rgba(148,163,184,0.10)" />
        <circle cx="160" cy="130" r="90" fill="rgba(186,230,253,0.10)" />
        {/* Moon crescent */}
        <circle
          cx="160"
          cy="130"
          r="58"
          fill="rgba(226,232,240,0.75)"
          style={{ filter: 'drop-shadow(0 0 18px rgba(186,230,253,0.5))' }}
        />
        <circle cx="186" cy="112" r="48" fill="rgba(15,23,42,0.88)" />
        {/* Stars near moon */}
        <circle cx="290" cy="60" r="2" fill="rgba(255,255,255,0.70)" />
        <circle cx="320" cy="85" r="1.2" fill="rgba(255,255,255,0.55)" />
        <circle cx="250" cy="90" r="1.5" fill="rgba(255,255,255,0.60)" />
        <circle cx="340" cy="45" r="1" fill="rgba(255,255,255,0.50)" />
        <circle cx="100" cy="55" r="1.5" fill="rgba(255,255,255,0.55)" />
        <circle cx="75" cy="95" r="1" fill="rgba(255,255,255,0.40)" />
        {/* Distant cloud wisps */}
        <g style={{ opacity: 0.35, animation: 'cloudDrift2 25s ease-in-out infinite' }}>
          <ellipse cx="580" cy="80" rx="90" ry="28" fill="rgba(148,163,184,0.40)" />
          <ellipse cx="545" cy="95" rx="65" ry="22" fill="rgba(148,163,184,0.40)" />
          <ellipse cx="624" cy="97" rx="58" ry="20" fill="rgba(148,163,184,0.40)" />
        </g>
      </svg>
    </div>
  );
}
