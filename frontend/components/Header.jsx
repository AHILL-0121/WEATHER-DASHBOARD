export default function Header() {
  return (
    <header className="glass-panel dash-header">
      <div className="dash-logo">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--accent)' }}
        >
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
  );
}
