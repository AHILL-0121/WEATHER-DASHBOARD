// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherForm from './WeatherForm';
import type { WeatherQuery } from '../lib/weatherClient';

afterEach(cleanup);

const PARIS = { name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 };
const PARIS_TX = { name: 'Paris', state: 'Texas', country: 'US', lat: 33.66, lon: -95.56 };

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function Harness({ onSearch, loading = false }: { onSearch: (q: WeatherQuery) => void; loading?: boolean }) {
  const [value, setValue] = useState('');
  return <WeatherForm onSearch={onSearch} loading={loading} inputValue={value} setInputValue={setValue} />;
}

function setup(props = {}) {
  const onSearch = vi.fn();
  const user = userEvent.setup();
  render(<Harness onSearch={onSearch} {...props} />);
  return { user, onSearch, input: screen.getByPlaceholderText('Search a city...') };
}

describe('WeatherForm', () => {
  it('Enter on a highlighted suggestion selects it and searches (BUG-12)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([PARIS, PARIS_TX])),
    );
    const { user, onSearch, input } = setup();

    await user.type(input, 'Par');
    await screen.findByText('Texas, US');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith({ city: 'Paris', lat: 33.66, lon: -95.56 });
    expect(input).toHaveValue('Paris, Texas, US');
  });

  it('Escape closes the suggestion list (BUG-12)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([PARIS])),
    );
    const { user, input } = setup();

    await user.type(input, 'Par');
    await screen.findByText('FR');
    await user.keyboard('{Escape}');

    expect(screen.queryByText('FR')).not.toBeInTheDocument();
    expect(input).toHaveValue('Par');
  });

  it('searches by typed text when nothing is selected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([])),
    );
    const { user, onSearch, input } = setup();

    await user.type(input, 'Atlantis{Enter}');

    expect(onSearch).toHaveBeenCalledWith({ city: 'Atlantis' });
  });

  it('keeps the input usable while loading (BUG-13)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([])),
    );
    const { user, input } = setup({ loading: true });

    await user.type(input, 'Rome');

    expect(input).toBeEnabled();
    expect(input).toHaveValue('Rome');
  });

  it('ignores a slow, stale suggestion response (BUG-03)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const pending: { url: string; resolve: (res: Response) => void }[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (url, { signal }) =>
            new Promise((resolve, reject) => {
              pending.push({ url, resolve });
              signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            }),
        ),
      );
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Harness onSearch={vi.fn()} />);
      const input = screen.getByPlaceholderText('Search a city...');

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
