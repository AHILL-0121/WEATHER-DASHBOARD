// Random particle layouts are generated once, on first render (useState initialiser).
// Particle scenes only mount in the browser after weather loads, so there is no
// server-rendered markup for the random values to mismatch.
export function particles<T>(count: number, make: () => T): T[] {
  return Array.from({ length: count }, make);
}
