import type { ReactNode } from 'react';
import { isWet, type ConditionKind } from '@/lib/condition';

// Static, composed illustration per condition × day/night (no animation).
// Ported from plan/sampleui.html. Only one is on the page, so ids are fixed.

const CLOUD = 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z';
const STARS: [number, number, number][] = [
  [30, 30, 1.4],
  [170, 24, 1.1],
  [150, 58, 1],
  [22, 80, 1],
  [186, 96, 1.2],
  [60, 16, 0.9],
];
const SNOW: [number, number][] = [
  [66, 122],
  [90, 132],
  [114, 120],
  [138, 130],
  [78, 148],
  [126, 150],
];

function cloudColours(kind: ConditionKind, night: boolean): [string, string] {
  if (night) return ['#7d8aa3', '#56637c'];
  if (kind === 'storm') return ['#a3a8c2', '#737a98'];
  if (isWet(kind)) return ['#e3e8ef', '#b4c0cf'];
  return ['#ffffff', '#e2e9f1'];
}

export default function WeatherArt({ kind, night }: { kind: ConditionKind; night: boolean }) {
  const [c0, c1] = cloudColours(kind, night);

  const cloud = (x: number, y: number, s: number, fill: 'wa-cA' | 'wa-cB', opacity = 1) => (
    <path d={CLOUD} transform={`translate(${x} ${y}) scale(${s})`} fill={`url(#${fill})`} opacity={opacity} />
  );
  const body = (x: number, y: number, r: number) =>
    night ? (
      <>
        <mask id="wa-moon">
          <rect width="200" height="160" fill="#fff" />
          <circle cx={x + r * 0.45} cy={y - r * 0.35} r={r * 0.85} fill="#000" />
        </mask>
        <circle cx={x} cy={y} r={r * 1.7} fill="url(#wa-mhalo)" />
        <circle cx={x} cy={y} r={r} fill="#eef0f4" mask="url(#wa-moon)" />
      </>
    ) : (
      <>
        <circle cx={x} cy={y} r={r * 1.9} fill="url(#wa-halo)" />
        <circle cx={x} cy={y} r={r} fill="url(#wa-sun)" />
      </>
    );

  let scene: ReactNode;
  if (kind === 'clear') {
    scene = body(100, 78, 36);
  } else if (kind === 'partly') {
    scene = (
      <>
        {body(76, 58, 26)}
        {cloud(44, 34, 5.2, 'wa-cA')}
      </>
    );
  } else if (kind === 'clouds') {
    scene = (
      <>
        {cloud(66, 4, 4, 'wa-cB')}
        {cloud(28, 30, 5.4, 'wa-cA')}
      </>
    );
  } else if (kind === 'mist') {
    scene = (
      <>
        {cloud(40, 10, 5, 'wa-cB', 0.8)}
        {[116, 132, 148].map((y, i) => (
          <rect
            key={y}
            x={36 + i * 10}
            y={y}
            width={130 - i * 20}
            height="7"
            rx="3.5"
            fill={c0}
            opacity={0.85 - i * 0.2}
          />
        ))}
      </>
    );
  } else {
    scene = (
      <>
        {cloud(40, 2, 5.2, 'wa-cA')}
        {kind !== 'snow' &&
          [62, 82, 102, 122, 142].map((x, i) => (
            <line
              key={x}
              x1={x}
              y1={118 + (i % 2) * 6}
              x2={x - 7}
              y2={138 + (i % 2) * 6}
              stroke={night ? '#8fb6e8' : '#4d8fdb'}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
        {kind === 'snow' &&
          SNOW.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#fff" stroke="#9fb2cc" strokeWidth="1" />
          ))}
        {kind === 'storm' && (
          <path
            d="M104 96 88 128h14l-8 26 26-36h-15l9-22Z"
            fill="#ffc83d"
            stroke="#e0a31c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
      </>
    );
  }

  return (
    <svg viewBox="0 0 200 160" aria-hidden="true" className="block h-auto w-full">
      <defs>
        <radialGradient id="wa-sun" cx=".4" cy=".35">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="1" stopColor="#ffc23d" />
        </radialGradient>
        <radialGradient id="wa-halo">
          <stop offset="0" stopColor="#ffd76a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd76a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wa-mhalo">
          <stop offset="0" stopColor="#dfe6ff" stopOpacity=".28" />
          <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wa-cA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
        <linearGradient id="wa-cB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} stopOpacity=".75" />
          <stop offset="1" stopColor={c1} stopOpacity=".75" />
        </linearGradient>
      </defs>
      {night &&
        STARS.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff" opacity=".75" />)}
      {scene}
    </svg>
  );
}
