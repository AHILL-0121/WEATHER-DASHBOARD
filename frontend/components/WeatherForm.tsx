import React, {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import type { PlaceDTO } from '../lib/types';
import type { WeatherQuery } from '../lib/weatherClient';

interface Props {
  onSearch: (query: WeatherQuery) => void;
  loading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
}

export default function WeatherForm({ onSearch, loading, inputValue, setInputValue }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceDTO[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [selected, setSelected] = useState<PlaceDTO | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      clearTimeout(debounce.current);
      request.current?.abort();
    },
    [],
  );

  // Each keystroke cancels the previous lookup, so an older, slower
  // response can never replace the current suggestions
  const fetchSuggestions = async (q: string) => {
    request.current?.abort();
    const query = q.trim();
    if (query.length < 2) return setSuggestions([]);

    const controller = new AbortController();
    request.current = controller;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      const data: unknown = res.ok ? await res.json() : [];
      if (!controller.signal.aborted) setSuggestions(Array.isArray(data) ? (data as PlaceDTO[]) : []);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setSuggestions([]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSug(true);
    setHighlight(-1);
    setSelected(null);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSuggestions(e.target.value), 280);
  };

  const handleSelect = (s: PlaceDTO) => {
    setInputValue([s.name, s.state, s.country].filter(Boolean).join(', '));
    setShowSug(false);
    setSuggestions([]);
    setSelected(s);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (selected) onSearch({ city: selected.name, lat: selected.lat, lon: selected.lon });
    else onSearch({ city: inputValue.trim() });
    setShowSug(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || !suggestions.length) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSug(false);
      setHighlight(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    }
    // Enter on a highlighted suggestion picks it and searches in one step
    if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      const s = suggestions[highlight];
      if (!s) return;
      handleSelect(s);
      onSearch({ city: s.name, lat: s.lat, lon: s.lon });
    }
  };

  return (
    <div className="search-panel glass-panel">
      <form onSubmit={handleSubmit} autoComplete="off" style={{ position: 'relative' }}>
        <div className="search-wrap">
          <div className="search-input-wrap">
            <i className="fas fa-magnifying-glass search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search a city..."
              value={inputValue}
              onChange={handleChange}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 160)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {/* A new search while one is loading cancels the old one, so only an empty input disables this */}
          <button type="submit" className="search-btn" disabled={!inputValue.trim()}>
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 6 }} />
                Loading
              </>
            ) : (
              <>
                <i className="fas fa-location-crosshairs" style={{ marginRight: 6 }} />
                Search
              </>
            )}
          </button>
        </div>

        {showSug && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className={`suggestion-item${i === highlight ? ' active' : ''}`}
                onMouseDown={() => handleSelect(s)}
              >
                <i className="fas fa-location-dot sug-pin" />
                <div>
                  <div className="sug-name">{s.name}</div>
                  <div className="sug-detail">{[s.state, s.country].filter(Boolean).join(', ')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}
