import { useEffect, useState, type RefObject } from 'react';

// True once the element comes within `margin` of the viewport, and stays true.
// Used to load heavy, below-the-fold parts (the map) only when they're needed.
export default function useNearViewport(ref: RefObject<Element | null>, margin = '600px'): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    if (!('IntersectionObserver' in window)) {
      // Very old browsers: just load it, right after this render
      const id = setTimeout(() => setNear(true));
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);

  return near;
}
