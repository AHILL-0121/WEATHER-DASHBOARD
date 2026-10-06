export default function CloudScene() {
  return (
    <div className="weather-svg-scene">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g style={{ animation: 'cloudDrift1 22s ease-in-out infinite' }}>
          <ellipse cx="280" cy="110" rx="160" ry="62" fill="rgba(255,255,255,0.50)" />
          <ellipse cx="210" cy="136" rx="110" ry="52" fill="rgba(255,255,255,0.50)" />
          <ellipse cx="360" cy="140" rx="100" ry="48" fill="rgba(255,255,255,0.50)" />
        </g>
        <g style={{ animation: 'cloudDrift2 17s ease-in-out infinite' }}>
          <ellipse cx="600" cy="80" rx="100" ry="44" fill="rgba(226,232,240,0.52)" />
          <ellipse cx="560" cy="100" rx="80" ry="38" fill="rgba(226,232,240,0.52)" />
          <ellipse cx="650" cy="102" rx="75" ry="36" fill="rgba(226,232,240,0.52)" />
        </g>
        <g style={{ animation: 'cloudDrift3 26s ease-in-out infinite' }}>
          <ellipse cx="120" cy="220" rx="70" ry="28" fill="rgba(248,250,252,0.42)" />
          <ellipse cx="95" cy="235" rx="50" ry="22" fill="rgba(248,250,252,0.42)" />
          <ellipse cx="155" cy="238" rx="48" ry="22" fill="rgba(248,250,252,0.42)" />
        </g>
      </svg>
    </div>
  );
}
