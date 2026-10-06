export default function MistScene() {
  return (
    <div className="mist-container">
      {[
        { h: '55%', top: '12%', dur: '9s', del: '0s' },
        { h: '40%', top: '35%', dur: '12s', del: '2.5s' },
        { h: '35%', top: '58%', dur: '8s', del: '1s' },
      ].map((m, i) => (
        <div
          key={i}
          className="mist-layer"
          style={{
            height: m.h,
            top: m.top,
            animationDuration: m.dur,
            animationDelay: m.del,
            opacity: 0.5 - i * 0.08,
          }}
        />
      ))}
    </div>
  );
}
