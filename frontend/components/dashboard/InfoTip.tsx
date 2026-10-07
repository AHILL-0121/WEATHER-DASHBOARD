import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

const EDGE = 8; // px kept clear of the viewport edge

// A "?" button with an explanation. Shows on hover, keyboard focus or tap;
// Escape, blur or moving the pointer away hides it (WCAG 1.4.13). The text is
// also the button's description, so screen readers announce it without
// opening anything.
export default function InfoTip({ children }: { children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const tip = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Panels on the right edge would push the tip off screen: nudge it left
  useLayoutEffect(() => {
    const el = tip.current;
    if (!open || !el) return;
    el.style.translate = '';
    const overflow = el.getBoundingClientRect().right - (document.documentElement.clientWidth - EDGE);
    if (overflow > 0) el.style.translate = `${-overflow}px 0`;
  }, [open]);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More info"
        aria-describedby={id}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // Focus already opens it; a click (or tap) must not toggle it shut again
        onClick={() => setOpen(true)}
        className="inline-grid size-[17px] place-items-center rounded-full border border-input font-mono text-[10.5px] text-faint hover:border-faint hover:text-foreground"
      >
        ?
      </button>
      {/* display: none while closed, so it never widens the page */}
      <span
        ref={tip}
        id={id}
        role="tooltip"
        className="absolute bottom-[calc(100%+8px)] -left-2 z-30 w-[230px] max-w-[calc(100vw-48px)] rounded-[10px] bg-foreground px-3 py-2.5 text-left font-sans text-[13px] leading-[1.45] text-background"
        hidden={!open}
      >
        {children}
      </span>
    </span>
  );
}
