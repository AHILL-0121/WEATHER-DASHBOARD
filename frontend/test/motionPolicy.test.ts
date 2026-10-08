import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Enforces the motion policy in DESIGN.md: nothing moves on its own, and
// input-driven motion lasts ≤ 200 ms. A line can opt out with a
// "motion-policy: exempt" comment on it or on the line above.

const ROOT = join(__dirname, '..');
const DIRS = ['components', 'hooks', 'lib', 'pages', 'styles'];
const MAX_MS = 200;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(path);
    return /\.(css|tsx?)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [path] : [];
  });
}

const FORBIDDEN: [RegExp, string][] = [
  [/\binfinite\b/, 'looping animation'],
  [/@keyframes\b/, 'keyframe animation'],
  [/\banimate-(spin|ping|pulse|bounce)\b/, 'looping Tailwind animation'],
  [/\brequestAnimationFrame\b/, 'requestAnimationFrame loop'],
  [/<canvas\b/, 'canvas'],
];

// Durations as Tailwind classes (duration-150, duration-[180ms]) or in CSS (0.3s, 250ms)
function durationsMs(line: string): number[] {
  const out: number[] = [];
  for (const m of line.matchAll(/\bduration-(\d+)\b/g)) out.push(Number(m[1]));
  for (const m of line.matchAll(/(?<![\w-])(\d*\.?\d+)(ms|s)\b/g)) {
    if (/transition|animation|duration/.test(line)) out.push(Number(m[1]) * (m[2] === 's' ? 1000 : 1));
  }
  return out;
}

function violations(): string[] {
  const found: string[] = [];
  for (const file of DIRS.flatMap((d) => sourceFiles(join(ROOT, d)))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/motion-policy: exempt/.test(line + (lines[i - 1] ?? ''))) return;
      // Skip comments, which may describe what the policy forbids
      if (/^\s*(\/\/|\/?\*)/.test(line)) return;
      const at = `${relative(ROOT, file).replaceAll('\\', '/')}:${i + 1}`;
      for (const [re, what] of FORBIDDEN) if (re.test(line)) found.push(`${at} ${what}`);
      for (const ms of durationsMs(line))
        if (ms > MAX_MS) found.push(`${at} ${ms} ms motion (max ${MAX_MS})`);
    });
  }
  return found;
}

describe('motion policy', () => {
  it('has no looping or long motion in the app source', () => {
    expect(violations()).toEqual([]);
  });

  it('reads durations from Tailwind classes and CSS', () => {
    expect(durationsMs('transition-colors duration-150')).toEqual([150]);
    expect(durationsMs('duration-[600ms] ease-out')).toEqual([600]);
    expect(durationsMs('transition: opacity 0.3s ease')).toEqual([300]);
    expect(durationsMs('padding: 2s')).toEqual([]);
  });
});
