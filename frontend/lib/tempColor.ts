// The temperature colour scale: the only data colour in the UI (DESIGN rule 3
// in plan/sampleui.html). Every temperature mark uses it; blue accent is for
// selection and focus only. Input is always °C, whatever unit is displayed.

type RGB = readonly [number, number, number];

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as unknown as RGB;

/** Colour stops: [°C, colour], ascending */
export const TEMP_STOPS: readonly (readonly [number, string])[] = [
  [-15, '#6a6fd8'],
  [-5, '#4d9de0'],
  [5, '#38b7b0'],
  [14, '#8cc65a'],
  [21, '#e9c43f'],
  [27, '#ef9441'],
  [33, '#e0573c'],
  [42, '#a3232f'],
];

const STOPS = TEMP_STOPS.map(([t, h]) => [t, hex(h)] as const);

const rgb = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;

/** CSS colour for a temperature in °C; clamped to the ends of the scale */
export function tempColor(celsius: number): string {
  const first = STOPS[0]!;
  const last = STOPS[STOPS.length - 1]!;
  if (Number.isNaN(celsius)) return rgb(STOPS[3]![1]); // neutral mid-scale
  if (celsius <= first[0]) return rgb(first[1]);
  if (celsius >= last[0]) return rgb(last[1]);

  const i = STOPS.findIndex(([t]) => celsius <= t);
  const [t0, c0] = STOPS[i - 1]!;
  const [t1, c1] = STOPS[i]!;
  const f = (celsius - t0) / (t1 - t0);
  return rgb(c0.map((v, k) => Math.round(v + (c1[k]! - v) * f)) as unknown as RGB);
}
