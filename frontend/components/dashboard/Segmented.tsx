import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Option<T> {
  value: T;
  label: ReactNode;
  /** Accessible name when `label` is only an icon */
  ariaLabel?: string;
}

// A row of toggle buttons where exactly one is pressed (units, theme)
export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-[9px] border border-input bg-surface-2 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          aria-label={o.ariaLabel}
          title={o.ariaLabel}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] text-muted-foreground [&_svg]:size-[15px]',
            o.value === value &&
              'bg-card text-foreground shadow-[0_0_0_1px_var(--ci-border-2),0_1px_2px_rgb(0_0_0/0.08)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
