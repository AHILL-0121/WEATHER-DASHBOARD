// shadcn/ui dialog, trimmed to what the app uses. Radix handles the focus
// trap, Escape, outside clicks, scroll lock and returning focus on close.
// No enter/exit animation, per the motion policy (input-driven, ≤ 200 ms).
import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(8_12_20/0.42)]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 overflow-hidden rounded-[14px] border border-input bg-card text-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Dialog, DialogContent, DialogDescription, DialogTitle };
