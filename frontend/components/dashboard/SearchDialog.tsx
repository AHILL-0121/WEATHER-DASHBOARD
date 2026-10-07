import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { History, LocateFixed, MapPin, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { searchPlaces } from '@/lib/weatherClient';
import { cn } from '@/lib/utils';
import type { PlaceDTO } from '@/lib/types';
import { countryName } from './Hero';

type Item = { type: 'locate' } | { type: 'place'; place: PlaceDTO; recent: boolean };
type Status = 'idle' | 'loading' | 'done' | 'error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recent: PlaceDTO[];
  onPick: (place: PlaceDTO) => void;
  onLocate: () => void;
}

const DEBOUNCE_MS = 250;

export const placeRegion = (p: PlaceDTO) => [p.state, countryName(p.country)].filter(Boolean).join(', ');

// Command palette with a WAI-ARIA combobox (A11Y-01): focus stays in the
// input, arrows move the active option (aria-activedescendant), Enter picks,
// Escape closes. Loaded on demand by CommandSearch, which owns the shortcuts.
export default function SearchDialog({ open, onOpenChange, recent, onPick, onLocate }: Props) {
  const listId = useId();
  const [query, setQuery] = useState('');
  // Results and failures remember which query they belong to, so the status
  // can be derived instead of reset by hand on every keystroke
  const [answer, setAnswer] = useState<{ q: string; places: PlaceDTO[] } | null>(null);
  const [failedQuery, setFailedQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const request = useRef<AbortController | null>(null);

  // Each keystroke cancels the previous lookup, so an older, slower response
  // can never replace the current results (BUG-03)
  useEffect(() => {
    const q = query.trim();
    request.current?.abort();
    if (q.length < 2) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((places) => setAnswer({ q, places }))
        .catch((err: Error) => {
          if (err.name !== 'AbortError') setFailedQuery(q);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const q = query.trim();
  const searching = q.length >= 2;
  const results = searching && answer?.q === q ? answer.places : [];
  let status: Status = 'idle';
  if (searching) status = answer?.q === q ? 'done' : failedQuery === q ? 'error' : 'loading';
  const items: Item[] = searching
    ? results.map((place) => ({ type: 'place', place, recent: false }))
    : [{ type: 'locate' }, ...recent.map((place): Item => ({ type: 'place', place, recent: true }))];
  const activeIndex = items.length ? Math.min(active, items.length - 1) : -1;
  const optionId = (i: number) => `${listId}-${i}`;

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onOpenChange(false);
    if (item.type === 'locate') onLocate();
    else onPick(item.place);
  };

  const move = (to: number) => {
    if (!items.length) return;
    const next = (to + items.length) % items.length;
    setActive(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(activeIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(items[activeIndex]);
    }
  };

  const reset = (next: boolean) => {
    if (next) {
      setQuery('');
      setActive(0);
    }
    onOpenChange(next);
  };

  let empty: string | null = null;
  if (searching && !results.length) {
    if (status === 'loading') empty = 'Searching…';
    else if (status === 'error') empty = "Search isn't available right now. Please try again.";
    else if (status === 'done') empty = `No place matches “${q}”.`;
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogTitle className="sr-only">Search places</DialogTitle>
        <DialogDescription className="sr-only">
          Type a city name, then use the arrow keys and Enter to pick a result.
        </DialogDescription>
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 text-faint">
          <Search className="size-[18px] shrink-0" aria-hidden="true" />
          <input
            role="combobox"
            aria-label="Search a city"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search a city…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-[52px] flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-faint"
          />
          <kbd className="rounded-[5px] border border-input bg-card px-[5px] py-px font-mono text-[11px] text-faint">
            Esc
          </kbd>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Places"
          className="m-0 max-h-[340px] list-none overflow-y-auto p-1.5"
        >
          {items.map((item, i) => {
            const first = i === 0 || (items[i - 1]?.type === 'place') !== (item.type === 'place');
            const heading = item.type === 'place' && first ? (item.recent ? 'Recent' : 'Places') : null;
            return (
              <li
                key={item.type === 'locate' ? 'locate' : `${item.place.lat},${item.place.lon}`}
                role="presentation"
              >
                {heading && (
                  <div aria-hidden="true" className="px-2.5 pt-2 pb-1 text-xs text-faint">
                    {heading}
                  </div>
                )}
                <div
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseMove={() => i !== activeIndex && setActive(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-[9px] [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground',
                    i === activeIndex && 'bg-accent',
                  )}
                >
                  {item.type === 'locate' ? (
                    <>
                      <LocateFixed aria-hidden="true" />
                      <span>Use my current location</span>
                    </>
                  ) : (
                    <>
                      {item.recent ? <History aria-hidden="true" /> : <MapPin aria-hidden="true" />}
                      <span>
                        {item.place.name} <span className="text-faint">{placeRegion(item.place)}</span>
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {empty && (
          <p role="status" className="px-6 pt-1 pb-6 text-center text-faint">
            {empty}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
