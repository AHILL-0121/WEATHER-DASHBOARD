// Falling-rain layer shared by RainScene and ThunderstormScene
export default function RainDrops({ drops }) {
  return (
    <div className="rain-container">
      {drops.map((d, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{
            left: d.left,
            height: d.height,
            animationDelay: d.delay,
            animationDuration: d.duration,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
