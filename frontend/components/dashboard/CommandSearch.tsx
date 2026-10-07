import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlaceDTO } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recent: PlaceDTO[];
  onPick: (place: PlaceDTO) => void;
  onLocate: () => void;
}

// The dialog (Radix focus trap, scroll lock, …) is about 24 KB of script that
// nobody needs until search opens, so it stays out of the first load and is
// fetched once the page is idle. That keeps it off the critical path for the
// first paint without making the first open wait.
const loadDialog = () => import('./SearchDialog');
const SearchDialog = dynamic(loadDialog, { ssr: false });

// Opens the search palette with Ctrl/⌘ K or "/" from anywhere on the page
export default function CommandSearch(props: Props) {
  const { open, onOpenChange } = props;
  const [wanted, setWanted] = useState(false);
  if (open && !wanted) setWanted(true); // render the dialog from the first open on

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target && (/^(input|textarea|select)$/i.test(target.tagName) || target.isContentEditable);
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Warm the chunk when the browser is idle (Safari has no requestIdleCallback)
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => void loadDialog(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => void loadDialog(), 2000);
    return () => clearTimeout(id);
  }, []);

  return wanted ? <SearchDialog {...props} /> : null;
}
