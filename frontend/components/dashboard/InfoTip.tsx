import { useEffect, useId, useState } from 'react';

// A "?" button with an explanation. Shows on hover and keyboard focus, toggles
// on tap, and Escape hides it (WCAG 1.4.13). The text is also the button's
// description, so screen readers announce it without opening anything.
export default function InfoTip({ children }: { children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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
        onClick={() => setOpen((o) => !o)}
        className="inline-grid size-[17px] place-items-center rounded-full border border-input font-mono text-[10.5px] text-faint hover:border-faint hover:text-foreground"
      >
        ?
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-[calc(100%+8px)] -left-2 z-30 w-[230px] max-w-[calc(100vw-48px)] rounded-[10px] bg-foreground px-3 py-2.5 text-left font-sans text-[13px] leading-[1.45] text-background ${open ? '' : 'invisible'}`}
      >
        {children}
      </span>
    </span>
  );
}
