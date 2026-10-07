// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandSearch from './CommandSearch';
import { clearCache } from '@/lib/weatherClient';
import type { PlaceDTO } from '@/lib/types';

afterEach(cleanup);
beforeEach(clearCache);

const PARIS: PlaceDTO = { name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 };
const PARIS_TX: PlaceDTO = { name: 'Paris', state: 'Texas', country: 'US', lat: 33.66, lon: -95.56 };
const ROME: PlaceDTO = { name: 'Rome', country: 'IT', lat: 41.89, lon: 12.48 };

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function Harness({ initiallyOpen = true, recent = [] as PlaceDTO[] }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <p>page</p>
      <CommandSearch open={open} onOpenChange={setOpen} recent={recent} onPick={onPick} onLocate={onLocate} />
    </>
  );
}

const onPick = vi.fn();
const onLocate = vi.fn();
beforeEach(() => {
  onPick.mockReset();
  onLocate.mockReset();
});

describe('CommandSearch', () => {
  it('picks a result with the arrow keys and Enter, then closes (A11Y-01)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([PARIS, PARIS_TX])),
    );
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox', { name: 'Search a city' });

    await user.type(input, 'Par');
    await screen.findByText('Texas, United States');
    await user.keyboard('{ArrowDown}');

    const active = document.getElementById(input.getAttribute('aria-activedescendant')!);
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(active).toHaveTextContent('Texas, United States');

    await user.keyboard('{Enter}');
    expect(onPick).toHaveBeenCalledWith(PARIS_TX);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers "use my location" and recent places before typing (UX-05, UX-06)', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    render(<Harness recent={[ROME]} />);

    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Use my current location', 'Rome Italy']);

    await user.keyboard('{Enter}');
    expect(onLocate).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('says when nothing matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([])),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'Atlantis');

    expect(await screen.findByText('No place matches “Atlantis”.')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('reports a failed search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 500 })),
    );
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'Rome');

    expect(await screen.findByText(/Search isn't available/)).toBeInTheDocument();
  });

  it('opens with Ctrl+K and closes with Escape', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    render(<Harness initiallyOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog', { name: 'Search places' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores a slow, stale response (BUG-03)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const pending: { url: string; resolve: (res: Response) => void }[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (url: string, { signal }: RequestInit) =>
            new Promise((resolve, reject) => {
              pending.push({ url, resolve });
              signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            }),
        ),
      );
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Harness />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'Lo');
      await act(() => vi.advanceTimersByTimeAsync(300)); // debounce → request 1 ("Lo")
      await user.type(input, 'ndon');
      await act(() => vi.advanceTimersByTimeAsync(300)); // request 2 ("London") aborts request 1

      expect(pending.map((p) => decodeURIComponent(p.url))).toEqual([
        '/api/geocode?q=Lo',
        '/api/geocode?q=London',
      ]);
      await act(async () => {
        pending[1]!.resolve(json([{ name: 'London', country: 'GB', lat: 51.5, lon: -0.12 }]));
        pending[0]!.resolve(json([{ name: 'Lome', country: 'TG', lat: 6.13, lon: 1.22 }]));
      });

      expect(await screen.findByText('London')).toBeInTheDocument();
      expect(screen.queryByText('Lome')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
