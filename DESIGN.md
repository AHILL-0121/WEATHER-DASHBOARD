# Design notes

The UI follows the "Calm Instrument" direction: a quiet, readable instrument
panel rather than an animated scene.

## Motion policy

Motion exists only to confirm what the user just did. Nothing on the page moves
by itself.

1. **No ambient or looping motion.** No `animation: … infinite`, no looping
   Tailwind utilities (`animate-spin`, `animate-pulse`, `animate-ping`,
   `animate-bounce`), no `@keyframes`, no `requestAnimationFrame` loops, no
   auto-playing `<canvas>` or video.
2. **Input-driven only.** A transition runs because of a hover, focus, click,
   key press or a request the user started.
3. **≤ 200 ms.** Keep transitions short (150 ms is the default in this codebase).
4. **Opacity and transform only** (plus colour on hover). Never animate height,
   width, top/left or anything else that triggers layout; expanded rows use
   `hidden` instead of a height animation.
5. **Off under reduced motion.** `prefers-reduced-motion: reduce` turns off
   every transition and animation (`styles/tailwind.css`), and Leaflet's zoom
   animation is disabled (`MapCard.tsx`).

### Exceptions

A progress indicator follows the request, not the interface, so it may run
longer than 200 ms. Each exception carries a `motion-policy: exempt` comment
with its reason, on the line or the line above:

- The one-shot loading line at the top of the page (`pages/index.tsx`, 600 ms).

### Enforcement

- `test/motionPolicy.test.ts` scans `components/`, `hooks/`, `lib/`, `pages/`
  and `styles/` for the forbidden patterns above and for durations over 200 ms.
  It runs with `npm test` in CI.
- ESLint (`no-restricted-globals`, `no-restricted-properties`) flags
  `requestAnimationFrame` in the editor.
