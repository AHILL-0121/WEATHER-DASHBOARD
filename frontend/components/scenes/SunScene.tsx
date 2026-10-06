export default function SunScene() {
  const rays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <div className="weather-svg-scene">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="160" cy="130" r="160" fill="rgba(253,230,138,0.20)" />
        <g style={{ transformOrigin: '160px 130px', animation: 'sunRotate 14s linear infinite' }}>
          {rays.map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={160 + 85 * Math.cos(rad)}
                y1={130 + 85 * Math.sin(rad)}
                x2={160 + 130 * Math.cos(rad)}
                y2={130 + 130 * Math.sin(rad)}
                stroke="rgba(251,191,36,0.55)"
                strokeWidth={a % 60 === 0 ? 4 : 2}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        <circle
          cx="160"
          cy="130"
          r="62"
          fill="rgba(252,211,77,0.78)"
          style={{ animation: 'sunGlowPulse 4s ease-in-out infinite' }}
        />
        <circle cx="160" cy="130" r="52" fill="rgba(253,230,138,0.55)" />
        <g style={{ animation: 'cloudDrift2 18s ease-in-out infinite' }}>
          <ellipse cx="580" cy="90" rx="85" ry="38" fill="rgba(255,255,255,0.52)" />
          <ellipse cx="540" cy="108" rx="60" ry="30" fill="rgba(255,255,255,0.52)" />
          <ellipse cx="620" cy="110" rx="55" ry="28" fill="rgba(255,255,255,0.52)" />
        </g>
      </svg>
    </div>
  );
}
